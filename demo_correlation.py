"""
Demo script to show multi-feature correlation vs. single-feature scoring.
Run this during the demo to show judges how the system handles noisy data.
"""

import joblib
import numpy as np

# Load the trained Isolation Forest model for CNC_02
model = joblib.load("models/CNC_02.pkl")

print("=" * 70)
print("  Multi-Feature Correlation Demo")
print("=" * 70)
print("\nScenario 1: High temp ONLY (sensor noise)")
print("-" * 70)

# High temp, but normal vibration/rpm/current
reading_noise = [[90, 2.5, 3000, 20]]  # [temp, vib, rpm, current]
score_noise = model.decision_function(reading_noise)[0]
confidence_noise = min(100, abs(score_noise / 0.3) * 100) if score_noise < 0 else 0

print(f"  Temperature:  90°C    (HIGH)")
print(f"  Vibration:    2.5 mm/s (normal)")
print(f"  RPM:          3000     (normal)")
print(f"  Current:      20A      (normal)")
print(f"\n  → IF Score: {score_noise:.4f}")
print(f"  → Confidence: {confidence_noise:.1f}%")
print(f"  → Status: {'⚠️ WARNING' if score_noise < -0.05 else '✅ HEALTHY'}")

print("\n" + "=" * 70)
print("Scenario 2: High temp + High vib + High current (REAL FAULT)")
print("-" * 70)

# All features elevated together
reading_fault = [[92, 7.8, 3200, 26]]
score_fault = model.decision_function(reading_fault)[0]
confidence_fault = min(100, abs(score_fault / 0.3) * 100) if score_fault < 0 else 0

print(f"  Temperature:  92°C    (HIGH)")
print(f"  Vibration:    7.8 mm/s (HIGH)")
print(f"  RPM:          3200     (elevated)")
print(f"  Current:      26A      (HIGH)")
print(f"\n  → IF Score: {score_fault:.4f}")
print(f"  → Confidence: {confidence_fault:.1f}%")
print(f"  → Status: {'🚨 CRITICAL' if score_fault < -0.15 else '⚠️ WARNING' if score_fault < -0.05 else '✅ HEALTHY'}")

print("\n" + "=" * 70)
print("KEY INSIGHT:")
print("-" * 70)
print(f"Single feature anomaly (temp only):  {confidence_noise:.1f}% confidence")
print(f"Multi-feature anomaly (all together): {confidence_fault:.1f}% confidence")
print(f"\nDifference: {confidence_fault - confidence_noise:.1f}% MORE confident when features correlate!")
print("=" * 70)