import requests
import json
import os

def save_conference_mappings(conference_dict, output_filename="espn_conference_mappings.json"):
    """
    Helper function to save the conference ID to conference name mapping to a JSON file.
    """
    try:
        with open(output_filename, "w", encoding="utf-8") as json_file:
            json.dump(conference_dict, json_file, indent=4)
        print(f"Success! Conference mappings saved to '{os.path.abspath(output_filename)}'")
    except IOError as e:
        print(f"Failed to save the conference JSON file: {e}")

def fetch_and_save_d1_team_mappings():
    """
    Queries the ESPN Standings API (v2 endpoint) to get an accurate mapping
    of every D1 Team to their true Conference ID, and saves team and conference JSON files.
    """
    
    API_URL = "https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings?season=2026"
    
    print("Fetching mappings from ESPN Standings...\n")
    
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        data = response.json()
        
        conferences = data.get('children', [])
        
        teams_mapping = {}
        conference_mapping = {}  # New dictionary for the conference mappings
        
        for conf in conferences:
            conf_id = conf.get('id', 'N/A')
            conf_name = conf.get('name', 'Unknown Conference')
            
            # Populate the conference dictionary
            if conf_id != 'N/A':
                conference_mapping[conf_id] = conf_name
            
            entries = conf.get('standings', {}).get('entries', [])
            
            for entry in entries:
                team = entry.get('team', {})
                team_name = team.get('displayName', 'Unknown')
                team_id = team.get('id', 'N/A')
                
                teams_mapping[team_id] = {
                    "team_name": team_name,
                    "team_id": team_id,
                    "conference_id": conf_id,
                    "conference_name": conf_name
                }
                
        # Save the team mappings
        team_output_filename = "espn_d1_team_mappings.json"
        with open(team_output_filename, "w", encoding="utf-8") as json_file:
            json.dump(teams_mapping, json_file, indent=4)
            
        print(f"Success! Mappings for {len(teams_mapping)} teams have been saved to '{os.path.abspath(team_output_filename)}'")
        
        # Call the helper function to save the conference mappings
        save_conference_mappings(conference_mapping)
                
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch data from ESPN: {e}")
    except KeyError:
        print("Unexpected JSON structure returned by the API.")
    except IOError as e:
        print(f"Failed to save the team JSON file: {e}")

if __name__ == "__main__":
    fetch_and_save_d1_team_mappings()