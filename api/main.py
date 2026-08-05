from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import json
import logging
import os
import re
import time

# TO RUN: uvicorn main:app 

# =============================================================================
# LOGGING SETUP
# =============================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        # ADDED: encoding="utf-8" to fix the Windows crash
        logging.FileHandler("app.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("champ_week")

app = FastAPI(title="Champ Week API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://champ-week-app.vercel.app/" # <-- Add your Vercel URL here!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE = {}
CACHE_TTL_SECONDS = 30

# =============================================================================
# DATA LOADERS
# =============================================================================
BASE_DIR = os.path.dirname(__file__)

# 1. Load Tournament Seeds
TOURNAMENT_SEEDS = {}
try:
    with open(os.path.join(BASE_DIR, "seeds.json"), "r") as file:
        TOURNAMENT_SEEDS = json.load(file)
        logger.info("✅ Successfully loaded seeds.json")
except FileNotFoundError:
    logger.warning("⚠️ WARNING: seeds.json not found. Seeds will not display.")

# 2. Load ESPN Conference Mappings
CONFERENCE_MAP = {}
try:
    with open(os.path.join(BASE_DIR, "espn_conference_mappings.json"), "r") as file:
        CONFERENCE_MAP = json.load(file)
        logger.info("✅ Successfully loaded espn_conference_mappings.json")
except FileNotFoundError:
    logger.warning("⚠️ WARNING: espn_conference_mappings.json not found.")

# 3. Load ESPN D1 Team Mappings (The Filter Dictionary)
TEAM_MAP = {}
try:
    with open(os.path.join(BASE_DIR, "espn_d1_team_mappings.json"), "r") as file:
        TEAM_MAP = json.load(file)
        logger.info("✅ Successfully loaded espn_d1_team_mappings.json")
except FileNotFoundError:
    logger.warning("⚠️ WARNING: espn_d1_team_mappings.json not found.")


# =============================================================================
# ENTITY RESOLUTION MAPPING
# Add teams here if ESPN's short/display names don't align with Wikipedia
# =============================================================================
OVERRIDES = {
    "Pitt": "Pittsburgh",
    "Miami": "Miami (FL)",
    "Florida St": "Florida State",
    "FSU": "Florida State",
    "NC State": "NC State", 
    "UConn": "UConn",
    "Ole Miss": "Mississippi",
    "San José St": "San Jose State",
    "Long Island": "LIU",
    "Grambling": "Grambling State",
    "UL Monroe": "LouisianaMonroe",
    "App State": "Appalachian State",
    "SC Upstate": "USC Upstate"
}

def get_true_seed(team_name: str, conf_seeds: dict) -> str:
    if not conf_seeds:
        return "-"
        
    # 1. Check for a strict Exact Match first
    if team_name in conf_seeds:
        return conf_seeds[team_name]

    # 2. Check the Manual Override Dictionary
    search_name = team_name  # <-- Default to the ESPN name
    if team_name in OVERRIDES:
        search_name = OVERRIDES[team_name] # <-- Upgrade to the Wiki alias
        if search_name in conf_seeds:
            return conf_seeds[search_name]

    # --- THE SCRUBBER ---
    def clean_string(s: str) -> str:
        s = s.lower()
        s = re.sub(r'[^a-z0-9\s]', '', s) 
        s = s.replace(" state", " st")
        return s.strip()

    # 3. Normalized Exact Match (Using the upgraded search_name!)
    norm_team = clean_string(search_name)
    
    for wiki_name, seed in conf_seeds.items():
        norm_wiki = clean_string(wiki_name)
        if norm_team == norm_wiki:
            return seed

    # 4. Normalized Substring Match
    sorted_wiki_names = sorted(conf_seeds.keys(), key=len, reverse=True)
    for wiki_name in sorted_wiki_names:
        norm_wiki = clean_string(wiki_name)
        if norm_wiki and norm_wiki in norm_team:
            return conf_seeds[wiki_name]

    return "-"


# =============================================================================
# THE BULLETPROOF GAME FILTER WITH DEFECT TRACKING
# =============================================================================
def is_conference_tournament_game(event: dict, target_conf_id: str) -> bool:
    competitions = event.get("competitions", [])
    if not competitions:
        return False
    
    competitors = competitions[0].get("competitors", [])
    
    for team in competitors:
        team_data = team.get("team", {})
        team_id = str(team_data.get("id", ""))
        team_name = team_data.get("shortDisplayName", "Unknown")
        
        # If we recognize this team in our master D1 dictionary...
        if team_id and team_id in TEAM_MAP:
            team_conf_id = TEAM_MAP[team_id].get("conference_id")
            
            # If the team belongs to a DIFFERENT conference, drop the game immediately!
            if str(team_conf_id) != str(target_conf_id):
                return False
        elif team_id and team_name != "TBD":
            # 🚨 DEFECT LOG: Team is missing from espn_d1_team_mappings.json!
            logger.warning(
                f"⚠️ DATA DEFECT: Team ID {team_id} ('{team_name}') not found in TEAM_MAP "
                f"during conference filter check (Target Group: {target_conf_id})."
            )
                
    # If no teams failed the check (or if both teams are "TBD" and thus 
    # not in the TEAM_MAP yet), we safely assume the game belongs here.
    return True


@app.get("/api/bracket/{group_id}")
async def get_bracket_data(group_id: str, date: str):
    # --- 1. CACHE INTERCEPTOR ---
    current_time = time.time()
    cached_entry = CACHE.get(group_id)

    if cached_entry and (current_time - cached_entry["timestamp"] < CACHE_TTL_SECONDS):
        logger.info(f"⚡ Serving {group_id} from Cache!")
        return cached_entry["data"]

    logger.info(f"🌐 Fetching {group_id} from ESPN API...")

    url = (
        f"https://site.api.espn.com/apis/site/v2/sports/basketball/"
        f"mens-college-basketball/scoreboard"
        f"?groups={group_id}&dates={date}&limit=50"
    )

    try:
        # Async HTTP Request via httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            raw_data = response.json()

        # Safely pull the conference name from JSON map
        conference_name = CONFERENCE_MAP.get(str(group_id), "Unknown")
        if conference_name == "Unknown":
            logger.warning(f"⚠️ DATA DEFECT: Group ID {group_id} not mapped in CONFERENCE_MAP.")

        clean_games = []
        events = raw_data.get("events", [])
        
        conf_seeds = TOURNAMENT_SEEDS.get(conference_name, {})

        for event in events:
            # Pass group_id to filter
            if not is_conference_tournament_game(event, str(group_id)):
                continue

            status_dict = event.get("status", {}).get("type", {})
            status = status_dict.get("shortDetail", "TBD")
            is_live = status_dict.get("state") == "in" 
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
                team_data = team.get("team", {})
                team_id = str(team_data.get("id", ""))
                short_name = team_data.get("shortDisplayName", "TBD")
                display_name = team_data.get("displayName", short_name)

                true_seed = get_true_seed(short_name, conf_seeds)
                if true_seed == "-":
                    true_seed = get_true_seed(display_name, conf_seeds)

                # --- NEW: Construct the high-res ESPN logo URL ---
                logo_url = f"https://a.espncdn.com/i/teamlogos/ncaa/500/{team_id}.png" if team_id else ""

                teams.append({
                    "id": team_id,
                    "name": short_name, 
                    "seed": true_seed,
                    "score": team.get("score", "0"),
                    "winner": team.get("winner", False),
                    "logo": logo_url, # <-- NEW
                })

            clean_games.append({
                "id": event.get("id"),
                "date": game_date,
                "name": event.get("name", "Unknown Matchup"),
                "status": status,
                "is_live": is_live, 
                "network": network, 
                "teams": teams,
            })

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

    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch data from ESPN for group {group_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch data from ESPN: {str(e)}")