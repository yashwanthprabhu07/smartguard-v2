"""
SmartGuard — Unified AI Agent with WhatsApp Alerts
===================================================
 
Monitors all 4 machines with hybrid IF+LLM detection and sends WhatsApp alerts
via Twilio when Critical/Warning status is detected.
 
Setup:
1. Set environment variables:
    $env:TWILIO_ACCOUNT_SID = "your_twilio_account_sid"
    $env:TWILIO_AUTH_TOKEN = "your_twilio_auth_token"
    $env:TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"
    $env:TWILIO_WHATSAPP_TO = "whatsapp:+91xxxxxxxxxx"
    $env:GROQ_API_KEY = "your_groq_key"
 
2. Run:
   python smartguard_agent.py
"""
 
import json
import os
import platform
import sqlite3
import threading
import time
from collections import deque
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
 
import joblib
import requests
import sseclient
from flask import Flask, jsonify
from flask_cors import CORS
 
# ── Optional LLM (Groq) ───────────────────────────────────────────────
try:
    from groq import Groq
    _GROQ_AVAILABLE = True
except ImportError:
    $env:TWILIO_ACCOUNT_SID = "your_twilio_account_sid"
    $env:TWILIO_AUTH_TOKEN = "your_twilio_auth_token"
    _GROQ_AVAILABLE = False
    $env:TWILIO_WHATSAPP_TO = "whatsapp:+91xxxxxxxxxx"
# ── Optional Windows beep ─────────────────────────────────────────────
try:
    import winsound
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
    _IS_WINDOWS = False
 
# ── Optional WhatsApp (Twilio) ────────────────────────────────────────
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
 
 
# ════════════════════════════════════════════════════════════════════
# CONFIG
# ════════════════════════════════════════════════════════════════════
 
MACHINES = ["CNC_01", "CNC_02", "PUMP_03", "CONVEYOR_04"]
FEATURES = ["temperature_C", "vibration_mm_s", "rpm", "current_A"]
STREAM_BASE = os.environ.get("STREAM_URL", "http://127.0.0.1:3000")
MODELS_DIR = Path("models")
DB_PATH = Path("smartguard.db")
 
SUSPICIOUS_THRESHOLD = -0.05
CRITICAL_THRESHOLD = -0.15
WINDOW_SIZE = 15
LLM_COOLDOWN_SECONDS = 30
 
GROQ_KEY = os.environ.get("GROQ_API_KEY", "")
_llm_client = Groq(api_key=GROQ_KEY) if (_GROQ_AVAILABLE and GROQ_KEY) else None
 
# WhatsApp config
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
TWILIO_WHATSAPP_TO = os.environ.get("TWILIO_WHATSAPP_TO", "")
 
_twilio_client = None
if TWILIO_AVAILABLE and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_TO:
    try:
        _twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        print(f"✅ WhatsApp enabled → {TWILIO_WHATSAPP_TO}")
    except Exception as e:
        print(f"⚠️ Twilio init failed: {e}")
 
 
# ════════════════════════════════════════════════════════════════════
# WHATSAPP ALERTER
# ════════════════════════════════════════════════════════════════════
 
def send_whatsapp_alert(machine_id, status, fault, temperature, vibration, eta):
    """Send WhatsApp alert via Twilio. Returns True if sent."""
    if _twilio_client is None:
        return False
 
    emoji = "🚨" if status == "Critical" else "⚠️"
    message = f"""{emoji} *SmartGuard Alert*
 
*Machine:* {machine_id}
*Status:* {status.upper()}
*Fault:* {fault}
 
*Readings:*
• Temp: {temperature:.1f}°C
• Vibration: {vibration:.2f} mm/s
 
*Estimated failure:* {eta}
 
*Time:* {datetime.now().strftime('%H:%M:%S')}"""
 
    try:
        msg = _twilio_client.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            body=message,
            to=TWILIO_WHATSAPP_TO,
        )
        print(f"  📱 WhatsApp sent: {msg.sid[:8]}... → {machine_id} {status}")
        return True
    except Exception as e:
        print(f"  ❌ WhatsApp failed: {e}")
        return False
 
 
# ════════════════════════════════════════════════════════════════════
# DATABASE
# ════════════════════════════════════════════════════════════════════
 
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                ts             TEXT NOT NULL,
                machine_id     TEXT NOT NULL,
                temperature    REAL,
                vibration      REAL,
                rpm            REAL,
                current_a      REAL,
                if_score       REAL,
                health_score   INTEGER,
                confidence     REAL,
                status         TEXT,
                fault          TEXT,
                reasoning      TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_predictions_machine_ts "
            "ON predictions (machine_id, ts DESC)"
        )
 
 
@contextmanager
def db_conn():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
 
 
def log_prediction(record):
    try:
        with db_conn() as conn:
            conn.execute(
                """
                INSERT INTO predictions
                    (ts, machine_id, temperature, vibration, rpm, current_a,
                     if_score, health_score, confidence, status, fault, reasoning)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record["ts"],
                    record["machine_id"],
                    record["temperature"],
                    record["vibration"],
                    record["rpm"],
                    record["current_a"],
                    record["if_score"],
                    record["health_score"],
                    record["confidence"],
                    record["status"],
                    record["fault"],
                    record["reasoning"],
                ),
            )
    except Exception as e:
        print(f"   ⚠ DB log failed: {e}")
 
 
# ════════════════════════════════════════════════════════════════════
# ISOLATION FOREST
# ════════════════════════════════════════════════════════════════════
 
class MachineBrain:
    def __init__(self, machine_id):
        self.machine_id = machine_id
        self.model = self._load_model()
        self.window = deque(maxlen=WINDOW_SIZE)
        self.last_llm_call = 0.0
        self.last_fault = "-"
 
    def _load_model(self):
        path = MODELS_DIR / f"{self.machine_id}.pkl"
        if not path.exists():
            print(f"   ⚠ No model for {self.machine_id} at {path}")
            return None
        return joblib.load(path)
 
    def score(self, reading):
        if self.model is None:
            temp = reading["temperature_C"]
            vib = reading["vibration_mm_s"]
            pseudo = -(max(0, temp - 60) / 40 + max(0, vib - 2.5) / 8)
            return pseudo, min(100, abs(pseudo) * 200)
 
        x = [[reading[f] for f in FEATURES]]
        if_score = float(self.model.decision_function(x)[0])
 
        if if_score >= 0:
            confidence = 0.0
        else:
            confidence = min(100.0, (-if_score / 0.3) * 100)
 
        return if_score, confidence
 
    def should_escalate_to_llm(self, if_score):
        if if_score > SUSPICIOUS_THRESHOLD:
            return False
        if time.time() - self.last_llm_call < LLM_COOLDOWN_SECONDS:
            return False
        return True
 
 
# ════════════════════════════════════════════════════════════════════
# LLM REASONING
# ════════════════════════════════════════════════════════════════════
 
def reason_with_llm(machine_id, window):
    if _llm_client is None:
        return _rule_based_reasoning(window[-1])
 
    summary_lines = [
        f"t-{len(window) - i}: temp={r['temperature_C']:.1f}°C, "
        f"vib={r['vibration_mm_s']:.2f}mm/s, "
        f"rpm={r['rpm']:.0f}, "
        f"current={r['current_A']:.2f}A"
        for i, r in enumerate(window)
    ]
    data_text = "\n".join(summary_lines)
 
    prompt = f"""You are an industrial predictive maintenance expert.
 
Machine: {machine_id}
Last {len(window)} sensor readings (oldest first):
{data_text}
 
An ML anomaly detector flagged this reading sequence as suspicious.
Analyze the TREND and reply in strict JSON:
{{
  "fault": "short fault name",
  "reason": "one sentence explanation",
  "action": "concrete action for engineer"
}}
JSON only."""
 
    try:
        resp = _llm_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").removeprefix("json").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"   ⚠ LLM failed ({e}). Falling back to rules.")
        return _rule_based_reasoning(window[-1])
 
 
def _rule_based_reasoning(reading):
    temp = reading["temperature_C"]
    vib = reading["vibration_mm_s"]
 
    if temp > 85:
        return {
            "fault": "Overheating",
            "reason": f"Temperature at {temp:.1f}°C is well above safe range.",
            "action": "Shut down and inspect cooling system.",
        }
    if vib > 7:
        return {
            "fault": "Severe vibration",
            "reason": f"Vibration at {vib:.2f} mm/s indicates bearing wear.",
            "action": "Stop machine and check bearings.",
        }
    if temp > 75 or vib > 5:
        return {
            "fault": "Developing fault",
            "reason": f"Temp {temp:.1f}°C and vibration {vib:.2f} mm/s trending high.",
            "action": "Schedule inspection within 24 hours.",
        }
    return {
        "fault": "Anomaly",
        "reason": "Sensor pattern deviates from healthy baseline.",
        "action": "Monitor closely.",
    }
 
 
# ════════════════════════════════════════════════════════════════════
# AUTO-ACTIONS
# ════════════════════════════════════════════════════════════════════
 
def beep(tone_hz=1000, duration_ms=400):
    if _IS_WINDOWS:
        try:
            winsound.Beep(tone_hz, duration_ms)
        except Exception:
            pass
 
 
def dispatch_alert(brain, status, fault, reason, temperature, vibration, eta, is_status_change):
    """Dispatch alerts: beep + WhatsApp on status change. Returns action summary."""
    if status == "Critical":
        beep(1500, 600)
        action = "Machine shutdown initiated"
    elif status == "Warning":
        beep(900, 300)
        action = "Maintenance ticket created"
    else:
        return "None"
 
    # Send WhatsApp ONLY on status change (prevents spam while staying Critical/Warning)
    if status in ("Warning", "Critical") and is_status_change:
        send_whatsapp_alert(
            machine_id=brain.machine_id,
            status=status,
            fault=fault,
            temperature=temperature,
            vibration=vibration,
            eta=eta
        )
 
    return action
 
 
def classify(if_score, temperature, vibration):
    if temperature > 85 or vibration > 7:
        return "Critical"
    if if_score < CRITICAL_THRESHOLD:
        return "Critical"
    if if_score < SUSPICIOUS_THRESHOLD:
        return "Warning"
    if temperature > 75 or vibration > 5:
        return "Warning"
    return "Healthy"
 
 
def health_score_from(if_score, temperature, vibration):
    base = 100
    if if_score < 0:
        base -= min(50, int(-if_score * 300))
    if temperature > 60:
        base -= min(30, int((temperature - 60) * 1.5))
    if vibration > 2.5:
        base -= min(30, int((vibration - 2.5) * 6))
    return max(0, min(100, base))
 
 
# ════════════════════════════════════════════════════════════════════
# FLASK API
# ════════════════════════════════════════════════════════════════════
 
api = Flask(__name__)
CORS(api)
 
_state_lock = threading.Lock()
_latest = {m: {} for m in MACHINES}
 
 
@api.route("/data")
def all_data():
    with _state_lock:
        return jsonify(dict(_latest))
 
 
@api.route("/data/<machine_id>")
def one_machine(machine_id):
    with _state_lock:
        return jsonify(_latest.get(machine_id, {}))
 
 
@api.route("/history/<machine_id>")
def history(machine_id):
    with db_conn() as conn:
        rows = conn.execute(
            """SELECT ts, temperature, vibration, health_score, status, if_score
               FROM predictions WHERE machine_id = ?
               ORDER BY id DESC LIMIT 100""",
            (machine_id,),
        ).fetchall()
    return jsonify([
        {
            "ts": r[0],
            "temperature": r[1],
            "vibration": r[2],
            "health_score": r[3],
            "status": r[4],
            "if_score": r[5],
        }
        for r in rows
    ])
 
 
@api.route("/stats")
def stats():
    with db_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        alerts = conn.execute(
            "SELECT COUNT(*) FROM predictions WHERE status != 'Healthy'"
        ).fetchone()[0]
        by_machine = {
            m: conn.execute(
                "SELECT COUNT(*) FROM predictions WHERE machine_id = ?", (m,)
            ).fetchone()[0]
            for m in MACHINES
        }
    return jsonify({
        "total_predictions": total,
        "total_alerts": alerts,
        "by_machine": by_machine,
    })
 
 
def run_api():
    api.run(host="0.0.0.0", port=5000, threaded=True, use_reloader=False)
 
 
# ════════════════════════════════════════════════════════════════════
# MONITOR LOOP
# ════════════════════════════════════════════════════════════════════
 
def monitor_machine(brain):
    url = f"{STREAM_BASE}/stream/{brain.machine_id}"
    print(f"  ✓ {brain.machine_id} → {url}")
 
    while True:
        try:
            resp = requests.get(url, stream=True, timeout=10)
            client = sseclient.SSEClient(resp)
 
            for event in client.events():
                try:
                    reading = json.loads(event.data)
                    _process_reading(brain, reading)
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    print(f"   ⚠ {brain.machine_id} error: {e}")
 
        except Exception as e:
            print(f"   ⚠ {brain.machine_id} stream lost: {e}. Reconnecting...")
            time.sleep(3)
 
 
def _process_reading(brain, reading):
    brain.window.append(reading)
 
    if_score, confidence = brain.score(reading)
    temp = reading["temperature_C"]
    vib = reading["vibration_mm_s"]
 
    status = classify(if_score, temp, vib)
    health = health_score_from(if_score, temp, vib)
 
    # Check if status changed (for WhatsApp triggering)
    prev_status = getattr(brain, "_last_status", "Healthy")
    is_status_change = (status != prev_status)
 
    if brain.should_escalate_to_llm(if_score) and len(brain.window) >= 5:
        brain.last_llm_call = time.time()
        reasoning = reason_with_llm(brain.machine_id, list(brain.window))
        brain.last_fault = reasoning["fault"]
        action = dispatch_alert(
            brain, status, reasoning["fault"], reasoning["reason"], 
            temp, vib, 
            "< 1 hour" if status == "Critical" else "~ 6 hours",
            is_status_change
        )
    elif status == "Healthy":
        reasoning = {
            "fault": "-",
            "reason": "All readings within learned healthy baseline.",
            "action": "None",
        }
        brain.last_fault = "-"
        action = "None"
    else:
        reasoning = _rule_based_reasoning(reading)
        action = dispatch_alert(
            brain, status, reasoning["fault"], reasoning["reason"], 
            temp, vib, 
            "< 1 hour" if status == "Critical" else "~ 6 hours",
            is_status_change
        )
 
    if temp > 85 or if_score < -0.2:
        eta = "< 1 hour"
    elif vib > 7:
        eta = "~ 2 hours"
    elif status == "Warning":
        eta = "~ 6 hours"
    else:
        eta = "Normal"
 
    ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
    record = {
        "ts": ts,
        "machine_id": brain.machine_id,
        "temperature": round(temp, 2),
        "vibration": round(vib, 2),
        "rpm": reading["rpm"],
        "current_a": round(reading["current_A"], 2),
        "if_score": round(if_score, 4),
        "health_score": health,
        "confidence": round(confidence, 1),
        "status": status,
        "fault": reasoning["fault"],
        "reasoning": reasoning["reason"],
        "action": reasoning["action"],
        "system_action": action,
        "failure_eta": eta,
    }
 
    log_prediction(record)
    with _state_lock:
        _latest[brain.machine_id] = record
 
    # Print only on status change
    if is_status_change:
        tag = {"Healthy": "🟢", "Warning": "🟡", "Critical": "🔴"}[status]
        print(f"\n{tag} [{brain.machine_id}] {status.upper()} "
              f"(health={health}, conf={confidence:.0f}%)")
        print(f"   Fault: {reasoning['fault']}")
        print(f"   Why:   {reasoning['reason']}")
        print(f"   Act:   {action}")
        print(f"   ETA:   {eta}")
        brain._last_status = status
 
 
# ════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════
 
def main():
    print("=" * 60)
    print("  SmartGuard Unified Agent + WhatsApp")
    print("=" * 60)
    print(f"  LLM backend : {'Groq LLaMA 3.3 70B' if _llm_client else 'OFF (rules)'}")
    print(f"  Audio alerts: {'ON' if _IS_WINDOWS else 'OFF'}")
    print(f"  WhatsApp    : {'ON' if _twilio_client else 'OFF'}")
    print(f"  Stream URL  : {STREAM_BASE}")
    print(f"  DB path     : {DB_PATH.resolve()}")
    print("=" * 60)
 
    init_db()
    print(f"\n🗄  DB ready")
 
    t = threading.Thread(target=run_api, daemon=True, name="api")
    t.start()
    print("🌐 API on http://localhost:5000")
 
    print("\n🤖 Starting monitors:")
    brains = [MachineBrain(m) for m in MACHINES]
    threads = []
    for brain in brains:
        th = threading.Thread(
            target=monitor_machine, args=(brain,),
            daemon=True, name=f"mon-{brain.machine_id}"
        )
        th.start()
        threads.append(th)
 
    print("\n✅ All systems running. Ctrl+C to stop.\n")
 
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down.")
 
 
if __name__ == "__main__":
    main()