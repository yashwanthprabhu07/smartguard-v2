import requests
import json
import os

# The 4 machines the hackathon provides
MACHINES = ["CNC_01", "CNC_02", "PUMP_03", "CONVEYOR_04"]

# Where to save the downloaded data
DATA_FOLDER = "data"

# Make sure the data folder exists (create it if not)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Loop through each machine and download its history
for machine_id in MACHINES:
    print(f"Downloading history for {machine_id}...")

    # Call the server's /history endpoint for this machine
    url = f"http://localhost:3000/history/{machine_id}"
    response = requests.get(url)

    # Check if the request succeeded
    if response.status_code != 200:
        print(f"  ❌ Failed! Status code: {response.status_code}")
        continue

    # Parse the JSON response
    data = response.json()
    readings = data["readings"]

    # Save to a file inside the data/ folder
    file_path = os.path.join(DATA_FOLDER, f"{machine_id}.json")
    with open(file_path, "w") as f:
        json.dump(readings, f, indent=2)

    print(f"  ✅ Saved {len(readings)} readings → {file_path}")

print("\nDone! All history downloaded.")