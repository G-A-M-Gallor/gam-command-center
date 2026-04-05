#!/usr/bin/env python3
"""
יצירת 3 Frames בכל אחד מ-11 הלוחות
"""
import requests
import os

TOKEN = os.environ.get("MIRO_TOKEN", "eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_K10ilCustEuvNhR0n_y0KwO1AWY")

BOARDS = [
    {"id": "uXjVGnJ7Rng=", "name": "🏗️ App 1 — GAM Job Board"},
    {"id": "uXjVGnIIXzg=", "name": "👥 App 2 — Origami CRM"},
    {"id": "uXjVGnJOaww=", "name": "🧠 App 3 — vBrain Semantic Engine"},
    {"id": "uXjVGnIIX8Q=", "name": "🔄 App 4 — Workflow OS"},
    {"id": "uXjVGnJNW-Y=", "name": "📊 App 5 — Analytics & Reports"},
    {"id": "uXjVGnJ7RgQ=", "name": "💬 App 6 — Conversation Hub"},
    {"id": "uXjVGnJ7RgA=", "name": "💼 App 7 — Site Toolkit"},
    {"id": "uXjVGnJNW-I=", "name": "🔧 App 8 — Dev Infrastructure"},
    {"id": "uXjVGnJ7Rgw=", "name": "🔒 App 9 — Auth & Security"},
    {"id": "uXjVGnJNW-4=", "name": "🤖 App 10 — ChatGPT Integration"},
    {"id": "uXjVGnIIX88=", "name": "🎨 App 11 — Miro Visual Layer"},
]

FRAMES = [
    {"title": "🏗️ אפיון App", "y": 0,    "height": 800},
    {"title": "✅ Tasks",         "y": 900,  "height": 600},
    {"title": "📊 Metrics",       "y": 1600, "height": 600},
]

headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

for board in BOARDS:
    print(f"\n📄 {board['name']}")
    for frame in FRAMES:
        resp = requests.post(
            f"https://api.miro.com/v2/boards/{board['id']}/frames",
            headers=headers,
            json={
                "data": {"title": frame["title"], "format": "custom"},
                "position": {"x": 0, "y": frame["y"]},
                "geometry": {"width": 1200, "height": frame["height"]}
            }
        )
        if resp.status_code == 201:
            frame_id = resp.json()["id"]
            print(f"  ✅ {frame['title']} → {frame_id}")
        else:
            print(f"  ❌ {frame['title']}: {resp.status_code} {resp.text[:100]}")