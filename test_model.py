import joblib

# Load the CNC_01 model
model = joblib.load("models/CNC_01.pkl")

# Feature order: [temperature_C, vibration_mm_s, rpm, current_A]

# A "normal" CNC_01 reading (close to baseline: 72, 1.8, 1480, 12.5)
normal_reading = [[72, 1.8, 1480, 12.5]]
pred = model.predict(normal_reading)[0]
score = model.decision_function(normal_reading)[0]
print(f"Normal reading   → prediction: {pred:+d}   score: {score:+.3f}")

# A clearly broken reading (bearing wear signature: high temp, high vib)
broken_reading = [[95, 6.5, 1200, 18]]
pred = model.predict(broken_reading)[0]
score = model.decision_function(broken_reading)[0]
print(f"Broken reading   → prediction: {pred:+d}   score: {score:+.3f}")

# A borderline reading (slightly elevated)
borderline = [[80, 3.0, 1450, 14]]
pred = model.predict(borderline)[0]
score = model.decision_function(borderline)[0]
print(f"Borderline read  → prediction: {pred:+d}   score: {score:+.3f}")

print("\nLegend:  +1 = normal   -1 = anomaly   score: higher = more normal")