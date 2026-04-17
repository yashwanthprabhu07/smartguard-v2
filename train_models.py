import json
import os
import joblib
from sklearn.ensemble import IsolationForest

# The 4 machines
MACHINES = ["CNC_01", "CNC_02", "PUMP_03", "CONVEYOR_04"]

# The 4 sensor fields we care about
FEATURES = ["temperature_C", "vibration_mm_s", "rpm", "current_A"]

# Folder paths
DATA_FOLDER = "data"
MODELS_FOLDER = "models"

# Create models/ folder if it doesn't exist
os.makedirs(MODELS_FOLDER, exist_ok=True)

# Train one model per machine
for machine_id in MACHINES:
    print(f"\n🔧 Training model for {machine_id}...")

    # 1. Load the history file for this machine
    history_path = os.path.join(DATA_FOLDER, f"{machine_id}.json")
    with open(history_path, "r") as f:
        readings = json.load(f)

    print(f"   Loaded {len(readings)} total readings")

    # 2. Keep only HEALTHY readings (status == "running")
    #    We want the model to learn what normal looks like
    healthy = [r for r in readings if r["status"] == "running"]
    print(f"   Filtered to {len(healthy)} healthy readings (baseline)")

    # 3. Extract the 4 sensor values from each healthy reading
    #    Result: a list of lists, like [[72.5, 1.82, 1483, 12.45], [71.9, ...], ...]
    training_data = [[r[feature] for feature in FEATURES] for r in healthy]

    # 4. Create and train the Isolation Forest
    model = IsolationForest(
        contamination=0.02,   # assume ~2% of readings might be outliers
        random_state=42       # makes results reproducible
    )
    model.fit(training_data)
    print(f"   ✅ Model trained")

    # 5. Save the trained model to disk
    model_path = os.path.join(MODELS_FOLDER, f"{machine_id}.pkl")
    joblib.dump(model, model_path)
    print(f"   💾 Saved to {model_path}")

print("\n✨ All 4 models trained and saved!")