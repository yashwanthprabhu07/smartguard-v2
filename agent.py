import json
import threading
import requests
import sseclient
from groq import Groq
from collections import deque
import os

# ─── CONFIG ───────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "your_groq_api_key_here")  # Set env var or replace this
SERVER = "http://localhost:3000"
MACHINES = ["CNC_01", "CNC_02", "PUMP_03", "CONVEYOR_04"]
WINDOW_SIZE = 20
CHECK_EVERY = 10
# ──────────────────────────────────────────────────────

client = Groq(api_key=GROQ_API_KEY)
windows = {m: deque(maxlen=WINDOW_SIZE) for m in MACHINES}
counters = {m: 0 for m in MACHINES}
alerted = {m: False for m in MACHINES}


def ask_groq(machine_id, readings):
    summary = []
    for r in readings:
        summary.append(
            f"temp={r['temperature_C']}°C, vib={r['vibration_mm_s']}mm/s, "
            f"rpm={r['rpm']}, current={r['current_A']}A"
        )
    data_text = "\n".join(summary)

    prompt = f"""You are an industrial machine health expert.
Machine: {machine_id}
Last {len(readings)} sensor readings (newest last):
{data_text}

Analyze the trend. Is this machine developing a fault?
Reply in this exact JSON format:
{{
  "status": "healthy" or "warning" or "critical",
  "reason": "one sentence explanation",
  "action": "recommended action for engineer"
}}
Only reply with the JSON. No extra text."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )

    raw = response.choices[0].message.content.strip()
    return json.loads(raw)


def post_alert(machine_id, reason, reading):
    try:
        requests.post(f"{SERVER}/alert", json={
            "machine_id": machine_id,
            "reason": reason,
            "reading": reading
        })
        print(f"  🚨 ALERT posted for {machine_id}: {reason}")
    except Exception as e:
        print(f"  ❌ Failed to post alert: {e}")


def schedule_maintenance(machine_id):
    try:
        requests.post(f"{SERVER}/schedule-maintenance", json={
            "machine_id": machine_id
        })
        print(f"  🔧 Maintenance scheduled for {machine_id}")
    except Exception as e:
        print(f"  ❌ Failed to schedule maintenance: {e}")


def monitor(machine_id):
    url = f"{SERVER}/stream/{machine_id}"
    print(f"✅ Connecting to {machine_id}...")

    response = requests.get(url, stream=True)
    client_sse = sseclient.SSEClient(response)

    for event in client_sse.events():
        try:
            reading = json.loads(event.data)
            windows[machine_id].append(reading)
            counters[machine_id] += 1

            if counters[machine_id] % CHECK_EVERY == 0 and len(windows[machine_id]) >= 10:
                print(f"🔍 Analyzing {machine_id}...")
                result = ask_groq(machine_id, list(windows[machine_id]))
                status = result.get("status", "healthy")
                reason = result.get("reason", "")
                action = result.get("action", "")
                print(f"  [{machine_id}] {status.upper()} — {reason}")

                if status in ("warning", "critical") and not alerted[machine_id]:
                    post_alert(machine_id, f"{reason} Action: {action}", reading)
                    if status == "critical":
                        schedule_maintenance(machine_id)
                    alerted[machine_id] = True

                if status == "healthy":
                    alerted[machine_id] = False

        except Exception as e:
            print(f"  ⚠️ Error on {machine_id}: {e}")


# Start one thread per machine
threads = []
for machine in MACHINES:
    t = threading.Thread(target=monitor, args=(machine,), daemon=True)
    t.start()
    threads.append(t)

print("🤖 SmartGuard AI Agent running... Press Ctrl+C to stop.\n")
for t in threads:
    t.join()