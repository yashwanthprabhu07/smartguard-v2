import joblib

# Load all 4 models
models = {
    "CNC_01":      joblib.load("models/CNC_01.pkl"),
    "CNC_02":      joblib.load("models/CNC_02.pkl"),
    "PUMP_03":     joblib.load("models/PUMP_03.pkl"),
    "CONVEYOR_04": joblib.load("models/CONVEYOR_04.pkl"),
}

# Baselines (what healthy looks like)
baselines = {
    "CNC_01":      [72, 1.8, 1480, 12.5],
    "CNC_02":      [68, 1.5, 1490, 11.8],
    "PUMP_03":     [55, 2.2, 2950, 18.0],
    "CONVEYOR_04": [45, 0.9,  720,  8.5],
}

# Faulty readings (big drift from baseline)
faults = {
    "CNC_01":      [95, 6.5, 1200, 18.0],   # bearing wear signature
    "CNC_02":      [115, 2.0, 1490, 18.0],  # thermal runaway
    "PUMP_03":     [55, 8.5, 2600, 22.0],   # cavitation
    "CONVEYOR_04": [60, 3.5, 720, 12.0],    # vibration spike
}

print(f"{'Machine':<13} {'Scenario':<10} {'Prediction':<12} {'Score'}")
print("-" * 60)

for mid, model in models.items():
    normal = [baselines[mid]]
    broken = [faults[mid]]

    n_pred  = model.predict(normal)[0]
    n_score = model.decision_function(normal)[0]
    b_pred  = model.predict(broken)[0]
    b_score = model.decision_function(broken)[0]

    n_label = "✅ normal" if n_pred == 1 else "⚠️ ANOMALY"
    b_label = "✅ normal" if b_pred == 1 else "⚠️ ANOMALY"

    print(f"{mid:<13} {'baseline':<10} {n_label:<12} {n_score:+.3f}")
    print(f"{mid:<13} {'faulty':<10} {b_label:<12} {b_score:+.3f}")
    print()