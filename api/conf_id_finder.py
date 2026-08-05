import requests

def fetch_espn_scoreboards(group_ids, date):
    """
    Loops through a list of group_ids, queries the ESPN College Basketball
    Scoreboard API, and prints the first event/item returned for each group.
    
    :param group_ids: List of group ID numbers or strings to iterate over.
    :param date: Date string formatted as YYYYMMDD.
    """
    
    for group_id in group_ids:
        # Format the URL directly with the current group_id and date
        api_url = (
            f"https://site.api.espn.com/apis/site/v2/sports/basketball/"
            f"mens-college-basketball/scoreboard"
            f"?groups={group_id}&dates={date}&limit=50"
        )
        
        print(f"\n--- Fetching Scoreboard for Group ID: {group_id} ---")
        
        try:
            # Make the GET request to the formatted URL
            response = requests.get(api_url)
            response.raise_for_status()
            data = response.json()
            
            # ESPN's API stores the games in an 'events' list
            events = data.get("events", [])
            
            if events:
                for event in events:
                    print(event.get("name"))

                # # Extract the very first event in the list
                # first_event = events[0]
                
                # # Pull out key details for a clean preview
                # game_name = first_event.get("name", "Unknown Game")
                # game_date = first_event.get("date", "Unknown Time")
                # status = first_event.get("status", {}).get("type", {}).get("detail", "Unknown Status")
                
                # print(f"First Game Found: {game_name}")
                # print(f"Status:           {status}")
                # print(f"Date/Time (UTC):  {game_date}")
                
                # Uncomment the line below if you want to print the entire raw dictionary of the first item:
                # print(f"\nRaw First Item:\n{first_event}")
            else:
                print("No games/events returned for this group ID on this date.")
                
        except requests.exceptions.RequestException as e:
            print(f"Request failed for Group ID {group_id}. Error: {e}")
        except ValueError:
            print(f"Response for Group ID {group_id} was not valid JSON.")

# ==========================================
# Example Usage
# ==========================================
if __name__ == "__main__":
    # List of conference/group IDs to loop through
    # (e.g., 50 = ACC, 7 = Big Ten, 8 = Big 12)
    MY_GROUP_IDS = [9,30]
    
    # ESPN API date format is YYYYMMDD
    TARGET_DATE = "20260303-20260317"
    
    fetch_espn_scoreboards(MY_GROUP_IDS, TARGET_DATE)