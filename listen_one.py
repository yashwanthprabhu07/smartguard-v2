import requests
import sseclient
import json
import joblib

# The sensor fields, in the exact order the model was trained on
FEATURES = ["temperature_C", "vibration_mm_s", "rpm", "current_A"]

# Load the trained model for CNC_01
print("🧠 Loading model for CNC_01...")
model = joblib.load("models/CNC_01.pkl")
print("✅ Model loaded.\n")

# Connect to the live stream
url = "http://localhost:3000/stream/CNC_01"
print(f"📡 Connecting to {url}...\n")

response = requests.get(url, stream=True)
client = sseclient.SSEClient(response)

# Process each incoming reading
for event in client.events():
    reading = json.loads(event.data)

    # Extract the 4 sensor values in the right order
    features = [[reading[f] for f in FEATURES]]

    # Ask the model: normal or anomalous?
    prediction = model.predict(features)[0]   # +1 or -1
    score = model.decision_function(features)[0]  # higher = more normal

    # Pick a nice label based on prediction
    if prediction == 1:
        label = "✅ normal  "
    else:
        label = "⚠️ ANOMALY "

    # Print it
    print(
        f"🔧 {reading['machine_id']}  "
        f"temp={reading['temperature_C']:>6.2f}  "
        f"vib={reading['vibration_mm_s']:>5.2f}  "
        f"rpm={reading['rpm']:>5}  "
        f"I={reading['current_A']:>5.2f}  "
        f"{label}  "
        f"(score: {score:+.3f})"
    )