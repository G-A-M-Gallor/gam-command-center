# Automations (אוטומציות) — מדריך עיצוב עצמאי

> עיצוב עצמאי למערכת אוטומציה שאינו תלוי ב-vBrain.io

## 🤖 זהות עיצובית עצמאית

### צבעי Automations:
- **Primary:** `#FF6B1A` (כתום עמוק)
- **Secondary:** `#FF8A3D` (כתום בהיר)
- **Dark:** `#1A1A1A` (רקע עיקרי)
- **Surface:** `#2A2A2A` (משטחים)
- **Text:** `#FFFFFF` / `#E5E5E5` (טקסט)

### עקרונות עיצוב:
1. **פשטות automation-focused** — הכל מתמקד ביעילות אוטומציה
2. **ללא סידבארים מורכבים** — רק top bar פשוט
3. **אייקונים ייעודיים** — automation & workflow specific
4. **RTL נכון** — עברית זורמת טבעית
5. **עצמאי לחלוטין** — אין קשר ל-vBrain.io

---

## 🛠 כלי עיצוב מהיר

### התחלה מהירה:
```bash
# יצירת תיקיות
./automations-design-tools.sh setup

# יצירת feature חדש
./automations-design-tools.sh new automation-templates "templates library for common automation workflows"

# שיפור קיים
./automations-design-tools.sh improve workflow-builder "add keyboard shortcuts and better node grouping"

# וריאנט mobile
./automations-design-tools.sh variant workflow-list.pen workflow-list-mobile "mobile version with touch controls"
```

---

## 🎨 3 המסכים הראשיים

### 1. Workflow List (רשימת אוטומציות)
**המסך הראשי של Automations**

**אלמנטים:**
- Top bar: לוגו Automations + חיפוש + user menu
- Main grid: כרטיסי workflows עם status badges
- Filters sidebar: סינון לפי status, type, tags
- Create Automation button (כתום בולט)

**Colors:**
- Active automations: `#10B981` (ירוק)
- Draft automations: `#F59E0B` (צהוב)
- Disabled automations: `#EF4444` (אדום)

### 2. Workflow Builder (עורך אוטומציות)
**Canvas לבניית automations**

**אלמנטים:**
- Top bar: שם automation + save status + test/deploy
- Left sidebar: פלטת nodes לפי קטגוריות
- Main canvas: nodes מחוברים עם קווים
- Right panel: הגדרות node נבחר

**Node Types:**
- **Triggers** (כתום): webhook, schedule, email
- **Actions** (כחול): send email, API call, data transform
- **Conditions** (צהוב): if/then logic
- **Delays** (אפור): wait, pause

### 3. Workflow Runs (מוניטור אוטומציות)
**מעקב אחר ביצוע אוטומציות**

**אלמנטים:**
- KPI cards: total runs, success rate, avg duration
- Runs table: expandable עם timeline פנימי
- Filters: status, automation, date range
- Real-time updates

**Status Colors:**
- Success: `#10B981` (ירוק)
- Failed: `#EF4444` (אדום)
- Running: `#3B82F6` (כחול)
- Cancelled: `#6B7280` (אפור)

---

## 📱 RTL ועברית

### עקרונות RTL:
```css
/* Container */
dir="rtl"

/* Text alignment */
text-start  /* במקום text-left */
text-end    /* במקום text-right */

/* Margins */
ms-auto     /* במקום ml-auto */
me-4        /* במקום mr-4 */

/* Canvas exceptions */
/* Canvas flows left-to-right גם ב-RTL */
.automations-canvas {
  direction: ltr;
}
```

### טקסטים בעברית:
- **כותרות:** "רשימת אוטומציות", "עורך אוטומציות", "מעקב ריצות"
- **פעולות:** "צור אוטומציה חדשה", "שמור", "הפעל", "עצור"
- **Statuses:** "פעיל", "טיוטה", "מושבת", "בביצוע", "הושלם", "נכשל"

---

## 🚀 תהליך עבודה יומי

### 1. יצירת feature חדש (10 דק):
```bash
./automations-design-tools.sh new [feature-name] "[תיאור Feature]"
```

### 2. שיפור קיים (5 דק):
```bash
./automations-design-tools.sh improve [feature-name] "[שיפורים ספציפיים]"
```

### 3. וריאנטים (7 דק):
```bash
./automations-design-tools.sh variant [base].pen [variant-name] "[שינויים]"
```

---

## 💻 מימוש לקוד

### 1. Export עיצובים:
הכל מיוצא ל-PNG עבור reference

### 2. מבנה React מומלץ:
```
src/
├── components/
│   └── automations/
│       ├── workflow-list/
│       ├── workflow-builder/
│       └── workflow-runs/
└── styles/
    └── automations.css    # צבעי Automations עצמאיים
```

### 3. CSS Variables:
```css
:root {
  --automations-primary: #FF6B1A;
  --automations-secondary: #FF8A3D;
  --automations-dark: #1A1A1A;
  --automations-surface: #2A2A2A;
  --automations-success: #10B981;
  --automations-warning: #F59E0B;
  --automations-error: #EF4444;
}
```

### 4. Component דוגמה:
```tsx
// AutomationCard.tsx
export function AutomationCard({ automation }: { automation: Automation }) {
  return (
    <div className="bg-automations-surface border border-automations-surface/20 rounded-lg p-4 hover:bg-automations-surface/80">
      <div className="flex items-center justify-between mb-2">
        <StatusBadge status={automation.status} />
        <TriggerIcon type={automation.triggerType} />
      </div>
      <h3 className="text-white font-medium">{automation.name}</h3>
      <p className="text-automations-text/70 text-sm">
        ריצה אחרונה: {automation.lastRun ? formatDate(automation.lastRun) : 'עדיין לא הופעל'}
      </p>
    </div>
  )
}
```

---

## 📊 הבדלים מ-vBrain.io

| היבט | vBrain.io | Automations עצמאי |
|------|-----------|-------------|
| **צבעים** | Purple/Blue | Orange/Amber |
| **Layout** | Sidebar + Top | Top bar only |
| **Focus** | Dashboard מערכת | Automation platform |
| **Navigation** | Complex | Minimal |
| **Typography** | Fraunces/DM Sans | Inter |
| **Icons** | Mixed | Automation-specific |

---

## 🔗 קישורים

- **Template:** `automations-system-template.pen`
- **Exports:** `automations-designs/exports/`
- **Implementation:** `automations-implementation-guide.md`

**זמן חיסכון: 3-5 שעות עיצוב ליום!** 🤖