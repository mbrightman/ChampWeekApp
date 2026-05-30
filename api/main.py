from fastapi import FastAPI, HTTPException
import requests
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI(title="Champ Week API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOURNAMENT_SEEDS = {}
seed_file_path = os.path.join(os.path.dirname(__file__), "seeds.json")

try:
    with open(seed_file_path, "r") as file:
        TOURNAMENT_SEEDS = json.load(file)
        print("Successfully loaded seeds.json!")
except FileNotFoundError:
    print("WARNING: seeds.json not found. Seeds will not display.")


@app.get("/api/bracket/{group_id}")
def get_bracket_data(group_id: str, date: str):
    url = f"https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups={group_id}&dates={date}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        raw_data = response.json()

        clean_games = []
        events = raw_data.get("events", [])

        for event in events:
            # Safely navigate the deeply nested ESPN JSON
            game_name = event.get("name", "Unknown Matchup")
            status = event.get("status", {}).get("type", {}).get("shortDetail", "TBD")
            game_date = event.get("date", "") # NEW: Grab the timestamp!
            
            # Dig into the competitors array for team details
            competitors = event.get("competitions", [{}])[0].get("competitors", [])
            teams = []
            
            for team in competitors:
                team_name = team.get("team", {}).get("displayName", "TBD")

                conference_map = {'2':'ACC','4':'Big East','7':'Big Ten','8':'Big 12','3':'A10','23':'SEC'}
                conference_name = conference_map.get(group_id, "Unknown")

                seed_team_name = team.get("team", {}).get("shortDisplayName", "TBD")
                true_seed = TOURNAMENT_SEEDS.get(conference_name, {}).get(seed_team_name, "-")

                teams.append({
                    "name": team_name,
                    "seed": true_seed,
                    "score": team.get("score", "0"),
                    "winner": team.get("winner", False)
                })
            
            # Add the simplified game object to our list
            clean_games.append({
                "id": event.get("id"),
                "date": game_date, # NEW: Pass it to React
                "name": game_name,
                "status": status,
                "teams": teams
            })
        
        return {
            "conference_id": group_id,
            "date_pulled": date,
            "total_games": len(clean_games),
            "games": clean_games
        }
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data from ESPN: {str(e)}")