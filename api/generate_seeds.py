import requests
from bs4 import BeautifulSoup
import json
import re
import os

# --- CONFIGURATION ---
YEAR = "2026"

# Dictionary mapping our App's exact conference names to Wikipedia's URL formatting
# Dictionary mapping ESPN's exact full conference names to Wikipedia's URL formatting
CONFERENCES = {
    # The Majors
    "Atlantic Coast Conference": "ACC",
    "Big East Conference": "Big_East",
    "Big Ten Conference": "Big_Ten",
    "Big 12 Conference": "Big_12",
    "Southeastern Conference": "SEC",

    # Mid-Majors
    "Atlantic 10 Conference": "Atlantic_10",
    "American Conference": "American_Conference",
    "Coastal Athletic Association": "CAA",
    "Metro Conference": "MAAC", # ESPN maps the MAAC to "Metro Conference"
    "Sun Belt Conference": "Sun_Belt_Conference",
    "Big Sky Conference": "Big_Sky_Conference",
    "Big South Conference": "Big_South_Conference",
    "Conference USA": "Conference_USA",
    "Horizon League": "Horizon_League",
    "Mountain West Conference": "Mountain_West_Conference",
    "Missouri Valley Conference": "Missouri_Valley_Conference",
    "Patriot League": "Patriot_League",
    "Southern Conference": "Southern_Conference",
    "America East Conference": "America_East",
    "Atlantic Sun Conference": "ASUN",
    "Big West Conference": "Big_West_Conference",
    "Ivy League": "Ivy_League",
    "Mid-American Conference": "MAC",
    "Mid-Eastern Athletic Conference": "MEAC",
    "Northeast Conference": "Northeast_Conference",
    "Summit League": "Summit_League",
    "Southwestern Athletic Conference": "SWAC",
    "United Athletic Conference": "WAC", # ESPN maps the WAC to "United Athletic Conference"
    "Ohio Valley Conference": "Ohio_Valley_Conference",
    "Southland Conference": "Southland_Conference",
    "West Coast Conference": "West_Coast_Conference"
}

def generate_seeds():
    seeds_data = {}
    print(f"🏀 Generating {YEAR} Tournament Seeds from Wikipedia...\n")

    for conf_name, wiki_name in CONFERENCES.items():
        print(f"Scraping {conf_name}...")
        
        # Format the standard Wikipedia URL for conference tournaments
        url = f"https://en.wikipedia.org/wiki/{YEAR}_{wiki_name}_men%27s_basketball_tournament"
        
        # 1. Fetch the page
        headers = {'User-Agent': 'Mozilla/5.0'} # Wikipedia likes it when you announce a user-agent
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print(f"  ❌ Failed to fetch page. Status: {response.status_code}")
            continue
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 2 & 3. Smarter Search: Find the table that has "Seed" as a header
        tables = soup.find_all("table", class_="wikitable")
        table = None
        
        for t in tables:
            first_th = t.find("th")
            # Check if the first header column contains the word 'Seed'
            if first_th and "Seed" in first_th.text:
                table = t
                break
                
        if not table:
            print(f"  ❌ Could not find a table containing seeds.")
            continue
            
        conf_seeds = {}
        
        # 4. Extract rows
        rows = table.find_all("tr")
        for row in rows[1:]: # Skip the header row
            cols = row.find_all(["td", "th"])
            
            if len(cols) >= 2:
                # Clean the Seed (strip out letters or weird formatting)
                raw_seed = cols[0].text.strip()
                seed_match = re.search(r'\d+', raw_seed)
                
                # Clean the Team Name (remove Wikipedia citations like "[a]")
                team_name = cols[1].text.strip()
                team_name = re.sub(r'\[.*?\]', '', team_name) # Removes [a]
                team_name = re.sub(r'[^\w\s\-\(\)]', '', team_name).strip() # Removes ‡, †, #
                
                if seed_match and team_name:
                    conf_seeds[team_name] = seed_match.group()
                    
        seeds_data[conf_name] = conf_seeds
        print(f"  ✅ Successfully mapped {len(conf_seeds)} teams.")

    # 5. Save the dictionary to seeds.json
    output_path = os.path.join(os.path.dirname(__file__), "seeds.json")
    with open(output_path, "w") as f:
        json.dump(seeds_data, f, indent=4)
        
    print(f"\n🎉 Success! seeds.json saved to {output_path}")

if __name__ == "__main__":
    generate_seeds()