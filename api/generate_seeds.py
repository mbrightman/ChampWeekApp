import requests
from bs4 import BeautifulSoup
import json
import re
import os

# --- CONFIGURATION ---
YEAR = "2026"

# Dictionary mapping our App's conference names to Wikipedia's URL formatting
CONFERENCES = {
    "ACC": "ACC",
    "Big East": "Big_East",
    "Big Ten": "Big_Ten",
    "SEC": "SEC",
    "Big 12": "Big_12",
    "A10": "Atlantic_10"
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