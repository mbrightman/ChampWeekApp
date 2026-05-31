from fastapi import FastAPI, HTTPException
import requests
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import re
import time

app = FastAPI(title="Champ Week API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE = {}
CACHE_TTL_SECONDS = 30

TOURNAMENT_SEEDS = {}
seed_file_path = os.path.join(os.path.dirname(__file__), "seeds.json")

try:
    with open(seed_file_path, "r") as file:
        TOURNAMENT_SEEDS = json.load(file)
        print("Successfully loaded seeds.json!")
except FileNotFoundError:
    print("WARNING: seeds.json not found. Seeds will not display.")

CONFERENCE_MAP = {
    '2':  'ACC',
    '4':  'Big East',
    '7':  'Big Ten',
    '8':  'Big 12',
    '3':  'A10',
    '23': 'SEC',
}

# =============================================================================
# THE FIX: ENTITY RESOLUTION MAPPING
# Add teams here if ESPN's short/display names don't align with Wikipedia
# =============================================================================
OVERRIDES = {
    "Pitt": "Pittsburgh",
    "Miami": "Miami (FL)",
    "Florida St": "Florida State",
    "FSU": "Florida State",
    "NC State": "NC State", # Safely handles ESPN sometimes sending "North Carolina State"
    "UConn": "UConn",
    "Ole Miss": "Mississippi"
}

def get_true_seed(team_name: str, conf_seeds: dict) -> str:
    if not conf_seeds:
        return "-"
        
    # 1. Check for a strict Exact Match first (Fastest)
    if team_name in conf_seeds:
        return conf_seeds[team_name]

    # 2. Check the Manual Override Dictionary
    if team_name in OVERRIDES:
        wiki_alias = OVERRIDES[team_name]
        if wiki_alias in conf_seeds:
            return conf_seeds[wiki_alias]

    # --- THE SCRUBBER ---
    # This removes all Wikipedia daggers, hashes, and punctuation.
    # It converts "Arizona#‡" -> "arizona" and "Kansas State" -> "kansas st"
    def clean_string(s: str) -> str:
        s = s.lower()
        s = re.sub(r'[^a-z0-9\s]', '', s) # Strip everything except letters/numbers/spaces
        s = s.replace(" state", " st")
        return s.strip()

    norm_team = clean_string(team_name)
    
    # 3. Normalized Exact Match
    for wiki_name, seed in conf_seeds.items():
        norm_wiki = clean_string(wiki_name)
        if norm_team == norm_wiki:
            return seed

    # 4. Normalized Substring Match (One-Way Only)
    sorted_wiki_names = sorted(conf_seeds.keys(), key=len, reverse=True)
    for wiki_name in sorted_wiki_names:
        norm_wiki = clean_string(wiki_name)
        if norm_wiki and norm_wiki in norm_team:
            return conf_seeds[wiki_name]

    return "-"


def is_conference_tournament_game(event: dict) -> bool:
    competitions = event.get("competitions", [])
    for comp in competitions:
        if comp.get("conferenceCompetition", False):
            return True
    return False


@app.get("/api/bracket/{group_id}")
def get_bracket_data(group_id: str, date: str):
    # --- 1. CACHE INTERCEPTOR ---
    current_time = time.time()
    cached_entry = CACHE.get(group_id)

    # If we have it in the cache AND it's less than 30 seconds old, serve it!
    if cached_entry and (current_time - cached_entry["timestamp"] < CACHE_TTL_SECONDS):
        print(f"⚡ Serving {group_id} from Cache!")
        return cached_entry["data"]

    # If we made it here, the cache is either empty or expired.
    print(f"🌐 Fetching {group_id} from ESPN API...")

    url = (
        f"https://site.api.espn.com/apis/site/v2/sports/basketball/"
        f"mens-college-basketball/scoreboard"
        f"?groups={group_id}&dates={date}&limit=50"
    )

    try:
        response = requests.get(url)
        response.raise_for_status()
        raw_data = response.json()

        conference_name = CONFERENCE_MAP.get(group_id, "Unknown")
        clean_games = []
        events = raw_data.get("events", [])
        
        conf_seeds = TOURNAMENT_SEEDS.get(conference_name, {})

        for event in events:
            if not is_conference_tournament_game(event):
                continue

            status_dict = event.get("status", {}).get("type", {})
            status = status_dict.get("shortDetail", "TBD")
            is_live = status_dict.get("state") == "in" # <-- NEW: True if the game is active            
            game_date = event.get("date", "")

            competitions = event.get("competitions", [{}])
            broadcasts = competitions[0].get("broadcasts", []) if competitions else []
            network = ""
            
            if broadcasts and isinstance(broadcasts, list):
                names = broadcasts[0].get("names", [])
                if names and len(names) > 0:
                    network = names[0] 

            competitors = competitions[0].get("competitors", []) if competitions else []
            teams = []

            for team in competitors:
                short_name = team.get("team", {}).get("shortDisplayName", "TBD")
                display_name = team.get("team", {}).get("displayName", short_name)

                true_seed = get_true_seed(short_name, conf_seeds)
                if true_seed == "-":
                    true_seed = get_true_seed(display_name, conf_seeds)

                teams.append({
                    "name": short_name, 
                    "seed": true_seed,
                    "score": team.get("score", "0"),
                    "winner": team.get("winner", False),
                })

            # =========================================================
            # 🚨 THE TIME MACHINE HACK 🚨
            # Force the first two games to pretend they are live!
            # =========================================================
            # if len(clean_games) < 2:
            #     is_live = True
            #     status = "2nd Half - 08:45"
            #     import random
            #     # Make the score jitter up and down so you can visually see the 3-second refresh!
            #     current_score = int(teams[0].get("score", "0"))
            #     teams[0]["score"] = str(current_score + random.randint(-4, 4))
            # =========================================================

            clean_games.append({
                "id": event.get("id"),
                "date": game_date,
                "name": event.get("name", "Unknown Matchup"),
                "status": status,
                "is_live": is_live, # <-- NEW: Pass it to React!
                "network": network, 
                "teams": teams,
            })

        # Build the final response object
        final_response = {
            "conference_id": group_id,
            "conference_name": conference_name,
            "date_pulled": date,
            "total_games": len(clean_games),
            "games": clean_games,
        }

        # --- 2. SAVE TO CACHE BEFORE RETURNING ---
        CACHE[group_id] = {
            "timestamp": current_time,
            "data": final_response
        }

        return final_response

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data from ESPN: {str(e)}")