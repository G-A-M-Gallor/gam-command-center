---
name: uncodixfy
description: Prevents generic AI/Codex UI patterns when generating frontend code. Use whenever generating HTML, CSS, React, or any frontend UI code.
---

Before writing ANY frontend code, follow every rule below.

## Hard No — Never Do These
- No oversized rounded corners (20px-32px)
- No pill overload
- No glassmorphism / frosted panels
- No soft corporate gradients
- No gradient backgrounds on buttons
- No eyebrow labels (uppercase + letter-spacing like "MARCH SNAPSHOT")
- No hero sections inside dashboards
- No transform animations on hover (translateX, scale)
- No dramatic box shadows (0 24px 60px rgba...)
- No KPI card grid as default dashboard layout
- No colored glows or blurs as decoration
- No decorative copy or section notes
- No `<small>` subheaders above headlines
- No big rounded `<span>` elements
- Colors: no blue drift — dark muted tones preferred

## Keep It Normal
- Sidebars: 248px, solid background, simple border-right
- Buttons: solid fill, 6-8px radius, no gradients
- Cards: 8px radius, 1px border, shadow max 8px blur
- Inputs: solid border, simple focus ring
- Typography: Geist (already in project), 14px body, clear hierarchy
- Spacing: 4/8/12/16/24/32px scale
- Transitions: 120ms ease, opacity/color only

## Colors — Always Use CSS Variables
Use --theme-* variables from src/lib/themes.ts.
Never hardcode colors. Never invent new combinations.

## Internal Check Before Writing UI
1. List default AI patterns you'd normally use
2. Cross-reference with banned list
3. Replace with normal implementation
4. Then write the code
