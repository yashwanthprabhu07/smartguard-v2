import requests
import sseclient
import json
import joblib
import winsound
import time

from agent import smart_agent

from flask import Flask, jsonify
from flask_cors import CORS
from threading import Thread

# -------------------------------
# FLASK SETUP
# -------------------------------
app = Flask(__name__)
CORS(app)

latest_data = {}

@app.route("/data")
def get_data():
    return jsonify(latest_data)

def run_server():
    app.run(port=5000)


# -------------------------------
# FEATURES (must match training)
# -------------------------------
FEATURES = ["temperature_C", "vibration_mm_s", "rpm", "current_A"]

# -------------------------------
# LOAD MODEL
# -------------------------------
print("🧠 Loading model for PUMP_03...")
model = joblib.load("models/PUMP_03.pkl")
print("✅ Model loaded.\n")

# -------------------------------
# CONNECT TO STREAM
# -------------------------------
url = "http://127.0.0.1:3000/stream/PUMP_03"
print(f"📡 Connecting to {url}...\n")

response = requests.get(url, stream=True)
client = sseclient.SSEClient(response)

# -------------------------------
# HEALTH SCORE
# -------------------------------
def calculate_health_score(score):
    value = int((1 - abs(score)) * 100)
    return max(0, min(100, value))

# -------------------------------
# FAILURE COUNTDOWN (simple rules)
# -------------------------------
def estimate_failure_time(temp, vibration):
    if temp > 85:
        return "🚨 < 1 hour"
    elif vibration > 7:
        return "⚠️ ~ 2 hours"
    elif vibration > 5:
        return "~ 6 hours"
    else:
        return "Normal"


# -------------------------------
# START FLASK SERVER
# -------------------------------
Thread(target=run_server).start()


# -------------------------------
# MAIN LOOP
# -------------------------------
for event in client.events():
    try:
        reading = json.loads(event.data)

        # Prepare model input
        features = [[reading[f] for f in FEATURES]]

        anomaly_score = model.decision_function(features)[0]
        health_score = calculate_health_score(anomaly_score)

        temp = reading["temperature_C"]
        vibration = reading["vibration_mm_s"]

        # 🧠 Agent decision
        result = smart_agent(health_score, temp, vibration)

        # ⏳ Failure estimation
        failure_time = estimate_failure_time(temp, vibration)

        # 🤖 Auto-action simulation
        action_log = "None"
        if result["status"] == "Critical":
            action_log = "Machine shutdown initiated"
            winsound.Beep(1500, 700)

        elif result["status"] == "Warning":
            action_log = "Maintenance ticket created"
            winsound.Beep(800, 300)

        # 📊 Update API data
        latest_data.update({
            "machine": reading["machine_id"],
            "temperature": temp,
            "vibration": vibration,
            "health_score": health_score,
            "status": result["status"],
            "fault": result.get("fault", "-"),
            "reason": result.get("reason", "-"),
            "confidence": result.get("confidence", "-"),
            "action": result.get("action", "-"),
            "failure_time": failure_time,
            "system_action": action_log
        })

        # 🖥️ Console (for demo drama)
        print(f"\n🔧 {reading['machine_id']}")
        print(f"Temp: {temp:.2f} | Vib: {vibration:.2f}")
        print(f"Health: {health_score} | Status: {result['status']}")
        print(f"Reason: {result.get('reason','-')}")
        print(f"Action: {action_log}")
        print(f"Failure ETA: {failure_time}")

    except Exception as e:
        print("Error:", e)