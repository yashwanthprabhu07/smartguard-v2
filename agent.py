def smart_agent(health_score, temp, vibration):

    # 🚨 Critical condition
    if temp > 85:
        return {
            "status": "Critical",
            "fault": "Overheating",
            "reason": "Temperature exceeded safe threshold",
            "confidence": "92%",
            "action": "Immediate shutdown required"
        }

    if vibration > 7:
        return {
            "status": "Warning",
            "fault": "High vibration",
            "reason": "Possible bearing wear or imbalance",
            "confidence": "87%",
            "action": "Inspect bearings and alignment"
        }

    # ML-based
    if health_score > 60:
        return {
            "status": "Healthy",
            "reason": "All parameters within normal range",
            "confidence": "95%",
            "action": "No action needed"
        }

    elif health_score > 30:
        return {
            "status": "Warning",
            "reason": "Anomaly trend detected",
            "confidence": "75%",
            "action": "Schedule maintenance"
        }

    else:
        return {
            "status": "Critical",
            "reason": "Severe anomaly detected",
            "confidence": "90%",
            "action": "Immediate inspection required"
        }