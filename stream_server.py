from flask import Flask, Response, request
import json
import time
import random

app = Flask(__name__)

# 🔥 Global mode control
fault_mode = "normal"

def generate_data(machine_id):
    global fault_mode

    while True:
        # Normal data
        temp = random.uniform(50, 65)
        vibration = random.uniform(1, 3)

        # Inject faults
        if fault_mode == "overheat":
            temp = random.uniform(85, 95)

        elif fault_mode == "vibration":
            vibration = random.uniform(7, 10)

        data = {
            "machine_id": machine_id,
            "temperature_C": temp,
            "vibration_mm_s": vibration,
            "rpm": random.randint(2900, 3000),
            "current_A": random.uniform(15, 25)
        }

        yield f"data: {json.dumps(data)}\n\n"
        time.sleep(1)


# 📡 STREAM API
@app.route("/stream/<machine_id>")
def stream(machine_id):
    return Response(generate_data(machine_id), mimetype="text/event-stream")


# 🎮 CONTROL API (THIS WAS MISSING)
@app.route("/set_mode")
def set_mode():
    global fault_mode
    fault_mode = request.args.get("mode", "normal")
    print(f"⚙️ Mode changed to: {fault_mode}")
    return {"status": "ok", "mode": fault_mode}


if __name__ == "__main__":
    print("🚀 Stream server running on http://127.0.0.1:3000")
    app.run(port=3000, threaded=True)