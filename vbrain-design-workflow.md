# vBrain.io Design Workflow מדריך עבודה יומיומי

## 🌅 תחילת יום עבודה (5 דקות)

### תכנון המשימות:
```bash
./design-tools.sh new daily-priorities "today's task board with priorities, time estimates, status indicators"
```

---

## ⚡ פיתוח feature חדש (10-15 דקות)

### 1. עיצוב ראשוני:
```bash
./design-tools.sh new [feature-name] "[תיאור מפורט של התכונה]"
```

**דוגמאות:**
```bash
# מערכת התראות
./design-tools.sh new notifications "notification center with real-time updates, filters, mark as read"

# ניהול הרשאות
./design-tools.sh new permissions "role-based permissions with user groups, resource access, audit log"

# דוחות מתקדמים
./design-tools.sh new advanced-reports "charts, filters, export options, scheduled reports"
```

### 2. שיפינים ואיטרציות:
```bash
./design-tools.sh improve [feature-name] "[שיפורים ספציפיים]"
```

### 3. וריאנטים (mobile/desktop):
```bash
./design-tools.sh variant [feature-name].pen [feature-name]-mobile "mobile version with touch-friendly UI"
```

---

## 🔧 שיפור features קיימים (10 דקות)

### Entity Platform:
```bash
./design-tools.sh improve entity-platform "add drag & drop functionality, better performance indicators"
```

### Canvas Editor:
```bash
./design-tools.sh improve canvas-editor "add layer management, collaborative cursors, version history"
```

### Story Map:
```bash
./design-tools.sh improve story-map "add timeline view, milestone tracking, dependencies visualization"
```

### AI Hub:
```bash
./design-tools.sh improve ai-hub "add conversation history, agent management, custom prompts library"
```

---

## 📱 עיצוב responsive (15 דקות)

### טאבלט:
```bash
./design-tools.sh variant [feature].pen [feature]-tablet "tablet layout with sidebar navigation"
```

### נייד:
```bash
./design-tools.sh variant [feature].pen [feature]-mobile "mobile layout with bottom navigation, touch gestures"
```

---

## 🎯 מקרים ספציפיים נפוצים

### לקוח מבקש שינוי:
```bash
./design-tools.sh variant current-design.pen client-requested "implement client feedback: [specific changes]"
```

### A/B testing:
```bash
./design-tools.sh variant base-design.pen variant-a "bold colors, larger buttons"
./design-tools.sh variant base-design.pen variant-b "minimalist, subtle interactions"
```

### עיצוב לפיצ'ר urgnt:
```bash
./design-tools.sh new urgent-fix "quick fix for [problem] with clear error messages, recovery options"
```

---

## 📊 סיכום יום (5 דקות)

### רשימת מה שנוצר:
```bash
./design-tools.sh list
```

### יצירת דוח יומי:
```bash
./design-tools.sh new daily-summary "summary of today's designs, progress, next priorities"
```

---

## 🚀 טיפים לעבודה יעילה

### 1. השתמשו בשפה מפורטת בפרומפטים:
❌ "create login screen"
✅ "create Hebrew RTL login screen with email/password fields, remember me checkbox, forgot password link, social login options, dark theme"

### 2. תמיד ציינו RTL ועברית:
```
"Hebrew RTL layout with proper text alignment and navigation flow"
```

### 3. התבססו על הebrTemplate:
כל עיצוב חדש מתחיל מהtemplate הבסיסי לקונסיסטנטיות

### 4. ייצאו תמיד ברזולוציה גבוהה:
```bash
pencil --in design.pen --export high-res.png --export-scale 2
```

### 5. שמרו היסטוריה:
```bash
# לפני שינויים גדולים
cp current-design.pen current-design-backup.pen
```

---

## 📞 אינטגרציה עם פיתוח

### 1. לפני התחלת קוד:
- ✅ עיצוב מאושר ומיוצא כ-PNG
- ✅ כל הטקסטים בעברית ונבדקים
- ✅ RTL flow ברור ומתוכנן

### 2. במהלך פיתוח:
- השוו לעיצוב המיוצא
- יצרו וריאנטים לפתרון בעיות
- עדכנו עיצוב אם צריך שינויים

### 3. לפני push:
- עיצוב סופי מיוצא לתיעוד
- וריאנטים נשמרים לעתיד

---

## 🎨 ארגון קבצים

```
vbrain-designs/
├── templates/           # Templates בסיסיים
├── features/           # עיצובי תכונות חדשות
├── improvements/       # שיפורים לקיימים
├── components/         # רכיבי UI לשימוש חוזר
└── exports/           # תמונות מיוצאות לפיתוח
```

**זמן חיסכון משוער: 2-4 שעות עיצוב ליום!** ⚡