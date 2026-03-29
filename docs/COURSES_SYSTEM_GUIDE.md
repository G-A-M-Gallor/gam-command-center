# מערכת הקורסים - מדריך הפעלה

## סקירה כללית

מערכת ניהול קורסים עם אינטגרציה מלאה ל-Google Drive, תמיכה בטרנסקריפציה ו-AI לסיכומים.

### ✨ עדכון חדש - Google Drive Integration UI
נוספה אינטרפייס משתמש מלא לחיבור Google Drive:
- כפתור חיבור ל-Google Drive בטופס יצירת קורס
- זרימת OAuth 2.0 בחלון פופ-אפ
- אינדיקטור מצב חיבור (מחובר/לא מחובר)
- תמיכה מלאה בסנכרון אוטומטי של קבצי וידיאו מהתיקיה

---

## הגדרת המערכת

### 1. משתני סביבה נדרשים

```bash
# Google OAuth & Drive API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_TOKEN_ENCRYPTION_KEY=64_character_hex_string

# Supabase (כבר קיים)
DATABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. טבלאות במסד הנתונים

המערכת יוצרת 3 טבלאות:

```sql
-- קורסים עיקריים
public.courses
  - id (uuid)
  - user_id (uuid)
  - name (text)
  - platform (udemy/youtube/coursera/vimeo/local)
  - status (planned/active/paused/completed)
  - drive_folder_id (text) - ID של תיקיה ב-Drive
  - drive_folder_url (text) - קישור לתיקיה
  - google_account_id (uuid) - חשבון Google מחובר

-- שיעורים בקורס
public.lessons
  - id (uuid)
  - course_id (uuid)
  - title (text)
  - lesson_number (integer)
  - status (pending/downloaded/transcribed/summarized/reviewed)
  - drive_file_id (text) - ID של קובץ ב-Drive
  - drive_file_url (text) - קישור לקובץ
  - transcript_text (text) - טקסט מתומלל
  - summary_text (text) - סיכום AI
  - flashcards (jsonb) - כרטיסיות זיכרון

-- התקדמות משתמשים
public.lesson_progress
  - lesson_id (uuid)
  - user_id (uuid)
  - watched_duration_minutes (integer)
  - completed_at (timestamp)
```

---

## השימוש במערכת

### שלב 1: יצירת קורס עם Google Drive

**דרך הממשק החדש:**
1. **גש לדף vCloud** → לשונית "קורסים"
2. **לחץ ➕ "הוסף קורס"**
3. **מלא פרטי הקורס** (שם, פלטפורמה, תיאור וכו')
4. **חיבור Google Drive:**
   - אם לא חובר: לחץ "התחבר ל-Google Drive"
   - יפתח חלון OAuth → אשר הרשאות
   - אחרי האישור יופיע ✅ "חובר בהצלחה ל-Google Drive"
5. **לחץ "צור קורס"**

### שלב 2: סנכרון תיקיית Drive

אחרי יצירת הקורס, המערכת תאפשר לך:
- **לחבר תיקיה מ-Drive** בעת יצירת הקורס
- **לסנכרן קבצים אוטומטית** מהתיקיה
- **לראות כפתור Drive** בכרטיס הקורס (אם מחובר)

### שלב 3: API ישיר (למפתחים)

```bash
POST /api/courses
{
  "name": "קורס React מתקדם",
  "emoji": "⚛️",
  "platform": "udemy",
  "language": "he",
  "description": "קורס מקיף ב-React עם hooks ו-context",
  "drive_folder_id": "google-drive-folder-id",
  "tags": ["react", "javascript", "frontend"]
}
```

### שלב 3: סינכרון שיעורים מ-Drive

```bash
POST /api/courses/{courseId}/sync-drive
{
  "google_account_id": "uuid-של-חשבון",
  "drive_folder_id": "id-של-תיקיה"
}
```

**המערכת תעשה אוטומטית:**
- 🔍 **חיפוש קבצי וידאו** (mp4, avi, mov, mkv וכו')
- 🔢 **זיהוי מספר שיעור** מהשם
- 📊 **חילוץ מטה-דטה** (גודל, פורמט)
- ✅ **יצירת רשומות שיעור** במסד הנתונים

### שלב 4: עבודה עם שיעורים

```bash
# רשימת שיעורים
GET /api/courses/{courseId}/lessons

# עדכון סטטוס שיעור
PUT /api/lessons/{lessonId}
{
  "status": "transcribed",
  "transcript_text": "התוכן המתומלל...",
  "transcribed_at": "2026-03-26T10:00:00Z"
}
```

---

## זיהוי אוטומטי של שיעורים

המערכת מזהה מספרי שיעור מהשמות לפי הדפוסים הבאים:

```bash
"001 - מבוא ל-React.mp4"          → שיעור 1
"Lesson 05 - Components.mp4"       → שיעור 5
"02. State Management.mp4"         → שיעור 2
"Chapter 3 - Hooks.mp4"           → שיעור 3
"Part 7.mp4"                       → שיעור 7
```

**אם לא נמצא מספר:** המערכת תקצה מספר רצף אוטומטי.

---

## API Routes מלא

### קורסים

```bash
GET    /api/courses              # רשימת קורסים
POST   /api/courses              # יצירת קורס חדש
GET    /api/courses/{id}         # פרטי קורס
PUT    /api/courses/{id}         # עדכון קורס
DELETE /api/courses/{id}         # מחיקת קורס
```

### שיעורים

```bash
GET    /api/courses/{id}/lessons       # שיעורים בקורס
POST   /api/courses/{id}/lessons       # הוספת שיעור ידני
POST   /api/courses/{id}/sync-drive    # סינכרון מ-Drive
PUT    /api/lessons/{id}               # עדכון שיעור
DELETE /api/lessons/{id}               # מחיקת שיעור
```

### התקדמות

```bash
GET    /api/lessons/{id}/progress     # התקדמות משתמש
PUT    /api/lessons/{id}/progress     # עדכון התקדמות
```

---

## תהליך עבודה מלא

### 1. הכנה ראשונית
- ✅ חבר חשבון Google Drive
- ✅ ארגן קבצי וידאו בתיקיות נפרדות לכל קורס
- ✅ וודא שמות קבצים כוללים מספרי שיעור

### 2. יצירת קורס
- ✅ צור קורס חדש במערכת
- ✅ קשר לתיקיית Drive
- ✅ הגדר תגיות ותיאור

### 3. סינכרון תוכן
- ✅ הפעל סינכרון מ-Drive
- ✅ בדוק שכל השיעורים נוספו
- ✅ תקן מספור שיעורים במידת הצורך

### 4. עיבוד תוכן (פיצ'רים עתידיים)
- 🔄 טרנסקריפציה עם Gemini API
- 🔄 יצירת סיכומים עם Claude API
- 🔄 יצירת כרטיסיות זיכרון

### 5. למידה ומעקב
- ✅ צפייה בשיעורים
- ✅ מעקב התקדמות
- ✅ הוספת הערות אישיות

---

## פתרון בעיות נפוצות

### שגיאת אימות Google Drive

**⚠️ חשוב: Google OAuth Credentials**

לפני שימוש בכפתור "התחבר ל-Google Drive", יש להגדיר:

1. **יצירת פרויקט Google Cloud Console:**
   ```bash
   https://console.cloud.google.com/
   → יצור פרויקט חדש → הפעל Drive API
   ```

2. **עדכון משתני הסביבה ב-.env.local:**
   ```bash
   NEXTAUTH_URL="https://vbrain.io"
   GOOGLE_CLIENT_ID="your-actual-client-id-here"
   GOOGLE_CLIENT_SECRET="your-actual-client-secret-here"
   ```

3. **הגדרת Redirect URI ב-Google Console:**
   ```bash
   https://vbrain.io/api/google/callback
   ```

**אם מופיעה שגיאה:**
```bash
# בדוק שהמשתנים הגדרו נכון
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# בדוק לוג השגיאות
npm run dev
# ואז חפש שגיאות בקונסול
```

### שיעורים לא מזוהים
```bash
# בדוק שמות קבצים - צריכים להכיל מספרים
"01-intro.mp4" ✅
"lesson-01.mp4" ✅
"introduction.mp4" ❌ (אין מספר)
```

### בעיות הרשאות Drive
```bash
# וודא שיש הרשאות לתיקיה
# תיקיה צריכה להיות נגישה למשתמש המחובר
# בדוק שה-drive_folder_id נכון
```

### שיעורים כפולים
```bash
# המערכת מונעת כפילויות לפי drive_file_id
# אם יש כפילויות - מחק ידנית מהמסד
```

---

## קבצים חשובים במערכת

```bash
# מיגרציה - יצירת טבלאות
supabase/migrations/20260525_courses_system.sql

# שאילתות מסד נתונים
src/lib/courses/courseQueries.ts

# Google Drive API
src/lib/google/driveUtils.ts

# הצפנת טוקנים
src/lib/google/crypto.ts

# API Routes
src/app/api/courses/route.ts
src/app/api/courses/[id]/lessons/route.ts
src/app/api/courses/[id]/sync-drive/route.ts

# ממשק משתמש
src/components/pm/CoursesScreen.tsx
```

---

## מטה-דטה שימושית

### פורמטי וידאו נתמכים
- MP4, AVI, MOV, MKV, WMV, FLV, WebM

### הגבלות
- גודל קובץ: ללא הגבלה (תלוי ב-Google Drive)
- מספר שיעורים: ללא הגבלה
- מספר קורסים: ללא הגבלה למשתמש

### ביצועים
- סינכרון Drive: ~100 קבצים/דקה
- טרנסקריפציה: תלוי באורך וידאו
- AI סיכום: ~30 שניות לשיעור

---

## טיפים לשימוש מיטבי

1. **ארגון תיקיות**: תיקיה נפרדת לכל קורס
2. **שמות קבצים**: תמיד תכלול מספר שיעור
3. **גודל קבצים**: דחוס וידאו לגודל סביר (עד 1GB)
4. **תיוג**: השתמש בתגיות לסיווג נושאים
5. **גיבוי**: הטקסט המתומלל נשמר במסד - לא צריך גיבוי נפרד

---

**📞 תמיכה**: אם יש בעיות או שאלות - פנה דרך מערכת התמיכה או העלה Issue ב-GitHub.

**🔄 עדכונים**: המערכת תתעדכן אוטומטית עם פיצ'רים חדשים.