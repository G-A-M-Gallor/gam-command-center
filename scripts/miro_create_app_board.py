#!/usr/bin/env python3
"""
צור לוח App חדש ב-Miro
שימוש: python3 scripts/miro_create_app_board.py "App Name"

הנוהל הקבוע:
1. יוצר board חדש דרך Miro REST API
2. מדפיס את ה-URL וה-Board ID
3. המשתמש מוסיף את הלוח ל-Space ידנית (30 שניות)
"""

import requests
import sys
import os
from datetime import datetime

MIRO_TOKEN = os.environ.get("MIRO_TOKEN", "")

if not MIRO_TOKEN:
    # נסה לקרוא מ-Vault
    import subprocess
    result = subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://qdnreijwcptghwoaqlny.supabase.co/rest/v1/rpc/get_secret",
        "-H", f"Authorization: Bearer {os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')}",
        "-H", "Content-Type: application/json",
        "-d", '{"secret_name": "miro_token"}'
    ], capture_output=True, text=True)
    import json
    data = json.loads(result.stdout)
    MIRO_TOKEN = data[0]["secret"] if data else ""

if not MIRO_TOKEN:
    print("❌ MIRO_TOKEN לא נמצא ב-Vault. הוסף אותו תחת השם 'miro_token'.")
    sys.exit(1)

app_name = sys.argv[1] if len(sys.argv) > 1 else "New App"

resp = requests.post(
    "https://api.miro.com/v2/boards",
    headers={"Authorization": f"Bearer {MIRO_TOKEN}", "Content-Type": "application/json"},
    json={"name": app_name, "description": f"Miro board for {app_name} - GAM Command Center"}
)

if resp.status_code == 201:
    board = resp.json()
    print(f"✅ לוח נוצר: {board['name']}")
    print(f"🔗 URL: https://miro.com/app/board/{board['id']}")
    print(f"📦 Board ID: {board['id']}")
    print(f"")
    print(f"📂 עכשיו: כנס ללוח והעבר ל-Space ידנית (30 שניות)")
    print(f"🔗 Space: https://miro.com/app/dashboard/space/3LYsSNN2a5Zg6u1dbeWO0b")
else:
    print(f"❌ שגיאה: {resp.status_code} {resp.text}")