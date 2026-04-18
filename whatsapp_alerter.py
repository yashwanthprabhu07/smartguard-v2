"""
WhatsApp Alerter for SmartGuard

Sends alerts via Twilio WhatsApp Sandbox when critical/warning events happen.

SETUP (15 minutes):
1. Sign up: https://www.twilio.com/try-twilio (free trial, no credit card for sandbox)
2. Get your Account SID and Auth Token from the Twilio Console
3. Activate WhatsApp Sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   - Scan QR code with your phone's WhatsApp
   - Send the join code (e.g., "join <word>-<word>")
4. Set these env vars:
   
   Windows PowerShell:
    $env:TWILIO_ACCOUNT_SID = "your_twilio_account_sid"
   $env:TWILIO_AUTH_TOKEN = "your_token"
   $env:TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"  # Twilio sandbox number
   $env:TWILIO_WHATSAPP_TO = "whatsapp:+919876543210"    # Your WhatsApp (with country code)

5. Run this script standalone to test:
   python whatsapp_alerter.py

6. To integrate with your agent:
   from whatsapp_alerter import send_whatsapp_alert
   
   # In your alert dispatch code:
   send_whatsapp_alert(
       machine_id="CNC_02",
       status="Critical",
       fault="Bearing overheating",
       temperature=94,
       vibration=8.5,
       eta="< 1 hour"
   )
"""

import os
from datetime import datetime

try:
    from twilio.rest import Client  # type: ignore
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False


ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
FROM_NUMBER = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
TO_NUMBER = os.environ.get("TWILIO_WHATSAPP_TO", "")

_client = None
if TWILIO_AVAILABLE and ACCOUNT_SID and AUTH_TOKEN and TO_NUMBER:
    try:
        _client = Client(ACCOUNT_SID, AUTH_TOKEN)
    except Exception as e:
        print(f"⚠️ Twilio init failed: {e}")


def send_whatsapp_alert(
    machine_id: str,
    status: str,
    fault: str,
    temperature: float,
    vibration: float,
    eta: str,
) -> bool:
    """Send a WhatsApp alert. Returns True if sent, False otherwise."""
    if _client is None:
        print(f"⚠️ WhatsApp alert skipped (Twilio not configured): {machine_id} {status}")
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
        msg = _client.messages.create(
            from_=FROM_NUMBER,
            body=message,
            to=TO_NUMBER,
        )
        print(f"✅ WhatsApp sent: {msg.sid} → {machine_id} {status}")
        return True
    except Exception as e:
        print(f"❌ WhatsApp send failed: {e}")
        return False


def test_alert():
    """Standalone test — run `python whatsapp_alerter.py` to verify setup."""
    print("=" * 60)
    print("  SmartGuard WhatsApp Alerter — Test")
    print("=" * 60)
    print(f"  Twilio available: {TWILIO_AVAILABLE}")
    print(f"  Account SID set:  {bool(ACCOUNT_SID)}")
    print(f"  Auth Token set:   {bool(AUTH_TOKEN)}")
    print(f"  From (WhatsApp):  {FROM_NUMBER}")
    print(f"  To (your phone):  {TO_NUMBER}")
    print(f"  Client ready:     {_client is not None}")
    print("=" * 60)

    if _client is None:
        print("\n❌ Twilio not configured. Set these env vars:\n")
        print("Windows PowerShell:")
        print('  $env:TWILIO_ACCOUNT_SID = "your_twilio_account_sid"')
        print('  $env:TWILIO_AUTH_TOKEN = "your_token"')
        print('  $env:TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"')
        print('  $env:TWILIO_WHATSAPP_TO = "whatsapp:+919876543210"')
        print("\nLinux/Mac:")
        print('  export TWILIO_ACCOUNT_SID="your_twilio_account_sid"')
        print('  export TWILIO_AUTH_TOKEN="your_token"')
        print('  export TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"')
        print('  export TWILIO_WHATSAPP_TO="whatsapp:+919876543210"')
        print("\nThen re-run this script.")
        return

    print("\n📱 Sending test alert...")
    success = send_whatsapp_alert(
        machine_id="TEST_MACHINE",
        status="Critical",
        fault="Test alert from SmartGuard setup",
        temperature=94.5,
        vibration=8.2,
        eta="< 1 hour",
    )

    if success:
        print("\n✅ Test successful! Check your WhatsApp.")
        print("   To integrate into your agent, import send_whatsapp_alert()")
    else:
        print("\n❌ Test failed. Check the error above.")
        print("   Common issues:")
        print("   - Wrong Account SID / Auth Token")
        print("   - WhatsApp sandbox not joined (scan QR in Twilio console)")
        print("   - TO number doesn't include country code (e.g., +91 for India)")


if __name__ == "__main__":
    test_alert()
