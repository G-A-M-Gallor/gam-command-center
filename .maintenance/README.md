# Professional Code Cleanup Framework — vBrain.io

## מערכת ניקוי קוד מקצועית

מערכת מקיפה לניקוי וביקורת קוד באופן אוטומטי, מקצועי ושיטתי.

## 🎯 מטרות המערכת

- **זיהוי בעיות איכות קוד** — קוד מת, ייבואים לא בשימוש, בעיות TypeScript
- **ניקוי אוטומטי** — תיקון בעיות בטוחות ללא התערבות
- **דיווח מקצועי** — JSON reports עם מטריקות מפורטות
- **אינטגרציה** — Git hooks, CI/CD, Cron jobs, הודעות
- **ביקורת שוטפת** — יומי/שבועי/חודשי לפי קונפיגורציה

## 📁 קבצי המערכת

```
.maintenance/
├── cleanup-audit.sh          # סקריפט ביקורת ראשי
├── cleanup-tools.json        # הגדרות כלים וסלים
├── cleanup-config.json       # קונפיגורציה פרויקט-ספציפית
├── cleanup-scheduler.sh      # מתזמן cron jobs
├── install-hooks.sh          # התקנת Git hooks
├── reports/                  # דוחות JSON
├── logs/                    # לוגים של runs
└── README.md               # התיעוד הזה
```

## 🚀 התחלה מהירה

### התקנה בסיסית

```bash
# הפוך הסקריפטים לbאלה לביצוע
chmod +x .maintenance/*.sh

# הרץ ביקורת ראשונה
./.maintenance/cleanup-audit.sh --report-only

# התקן Git hooks
./.maintenance/install-hooks.sh

# התקן תזמון אוטומטי
./.maintenance/cleanup-scheduler.sh install
```

### ביקורת ידנית

```bash
# ביקורת עם דוח בלבד
./.maintenance/cleanup-audit.sh --report-only

# ביקורת עם תיקונים אוטומטיים
./.maintenance/cleanup-audit.sh --fix
```

## 🔧 קונפיגורציה

### סלים ומטריקות

ערוך `.maintenance/cleanup-config.json`:

```json
{
  "thresholds": {
    "unused_exports": 10,        // מקסימום exports לא בשימוש
    "unused_imports": 5,         // מקסימום imports לא בשימוש
    "large_files": 5,           // מקסימום קבצים גדולים
    "tech_debt_markers": 20     // מקסימום TODO/FIXME/XXX
  }
}
```

### תזמון אוטומטי

```json
{
  "cleanup_schedule": {
    "daily": {
      "enabled": true,
      "time": "06:00",
      "checks": ["tech_debt_markers", "typescript_errors"]
    },
    "weekly": {
      "enabled": true,
      "day": "sunday",
      "time": "08:00",
      "checks": ["unused_dependencies", "large_files"]
    }
  }
}
```

## 📊 בדיקות שמבוצעות

### Dead Code Analysis
- **Unused Exports** — ייצואים שלא נמצאים בשימוש (ts-prune)
- **Unused Imports** — ייבואים שלא נמצאים בשימוש (unimported)

### File Analysis
- **Large Files** — קבצים גדולים מדי (>500 שורות)
- **Empty Files** — קבצים ריקים
- **Duplicate Files** — קבצים זהים (hash MD5)

### Dependency Analysis
- **Unused Dependencies** — תלויות שלא נמצאות בשימוש (depcheck)
- **Outdated Dependencies** — תלויות מיושנות (npm outdated)

### Code Quality
- **Tech Debt Markers** — TODO, FIXME, XXX, HACK, @ts-ignore
- **ESLint Issues** — בעיות lint
- **TypeScript Errors** — שגיאות TypeScript

### Project Structure
- **Deep Nesting** — תיקיות עמוקות מדי (>8 levels)
- **Naming Violations** — הפרות naming conventions

### Git Analysis
- **Large Files in History** — קבצים גדולים בhistory
- **Frequently Changed Files** — קבצים שמשתנים הרבה (>100 שינויים)

## 🔗 Git Hooks

מותקנים ב-.git/hooks/ באמצעות `install-hooks.sh`:

### pre-commit
- בדיקת TypeScript errors
- ESLint על קבצים ב-stage
- בדיקת מספר TODO markers

### pre-push
- ביקורת מלאה לפני push
- חסימה אם יש שגיאות קריטיות

### post-merge
- npm install אם package.json השתנה
- התראה אם migrations השתנו

## 📋 דוחות ולוגים

### דוחות JSON
נשמרים ב-`.maintenance/reports/`:

```json
{
  "audit_timestamp": "2026-03-29T09:34:59Z",
  "results": {
    "unused_exports": {
      "status": "fail",
      "count": 344,
      "threshold": 10,
      "details": ["file1.ts", "file2.ts"]
    }
  },
  "summary": {
    "total_checks": 12,
    "passed": 8,
    "failed": 4
  }
}
```

### לוגים
נשמרים ב-`.maintenance/logs/` לכל run.

## ⚙️ תזמון ו-Cron

### התקנת Cron Jobs

```bash
./.maintenance/cleanup-scheduler.sh install
```

זה מוסיף לcrontab (לפי הקונפיגורציה):
- יומי בשעה 06:00
- שבועי בימים ראשון בשעה 08:00
- חודשי ביום 1 בשעה 09:00

### בדיקת סטטוס

```bash
./.maintenance/cleanup-scheduler.sh status
```

### הסרת Cron Jobs

```bash
./.maintenance/cleanup-scheduler.sh uninstall
```

## 🔔 הודעות

תמיכה ב:
- **Slack Webhooks**
- **Email** (עתידי)
- **Discord** (עתידי)

הגדר ב-`cleanup-config.json`:

```json
{
  "notifications": {
    "slack_webhook": "https://hooks.slack.com/...",
    "failure_only": true
  }
}
```

## 🛠️ תיקונים אוטומטיים

המערכת יכולה לתקן בעיות באופן אוטומטי:

### תיקונים בטוחים
- ESLint --fix
- מחיקת קבצים ריקים
- Prettier formatting
- ניקוי package-lock.json

### תיקונים לא בטוחים
- מחיקת unused imports (מושבת כברירת מחדל)
- מחיקת unused exports (מושבת כברירת מחדל)

## 📈 אינטגרציה עם vBrain Admin

הוסף ל-`src/app/dashboard/admin/data.ts`:

```typescript
{
  id: 'maintenance',
  title: 'Code Maintenance',
  category: 'tools',
  description: 'Professional code cleanup system',
  path: '/dashboard/admin/maintenance',
  icon: '🔧',
  status: 'stable'
}
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
- name: Code Quality Audit
  run: |
    chmod +x ./.maintenance/cleanup-audit.sh
    ./.maintenance/cleanup-audit.sh --report-only
```

### Vercel Build Hooks

```json
{
  "scripts": {
    "prebuild": "./.maintenance/cleanup-audit.sh --report-only"
  }
}
```

## 🧹 כיצד לעבוד עם המערכת

### זרימת עבודה יומית

1. **לפני קידוד** — הרץ ביקורת מהירה
2. **במהלך קידוד** — Git hooks יגנו עליך
3. **לפני commit** — pre-commit hook יבדוק
4. **לפני push** — pre-push hook יבדוק
5. **אחרי merge** — post-merge hook ינקה

### זרימת עבודה שבועית

1. בדוק דוח השבועי
2. טפל בבעיות קריטיות
3. עדכן סלים אם נדרש
4. בדוק מטריקות איכות

### זרימת עבודה חודשית

1. בדוק דוח החודשי המלא
2. נתח מגמות בזמן
3. עדכן קונפיגורציה אם נדרש
4. נקה דוחות ישנים

## 🎯 יתרונות המערכת

### עבור המפתח
- **מניעה** — Git hooks מונעים בעיות לפני שהן נכנסות
- **פידבק מיידי** — יודע על בעיות מיד
- **תיקונים אוטומטיים** — פחות עבודת נקיון ידנית

### עבור הפרויקט
- **איכות קוד גבוהה** — פחות tech debt
- **ביצועים טובים** — קבצים קטנים יותר, פחות קוד מת
- **תחזוקה קלה** — קוד נקי וסדיר

### עבור הצוות
- **קונסיסטנציה** — כל הצוות עובד עם אותן בדיקות
- **שקיפות** — דוחות ברורים על מצב הקוד
- **אוטומציה** — פחות עבודה ידנית

## 📚 הרחבות עתידיות

- אינטגרציה עם Sentry לשגיאות
- מטריקות ביצועים (bundle size, load time)
- אינטגרציה עם SonarQube
- דוחות מתקדמים ב-admin panel
- AI-powered code suggestions
- אוטומציה מלאה של תיקונים

---

**📝 עדכון אחרון:** 29 מרץ 2026
**🏗️ גרסה:** 1.0.0
**👨‍💻 יוצר:** Claude AI for vBrain.io