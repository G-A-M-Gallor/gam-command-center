# CLAUDE.md — GAM Command Center
**version: 3.1 | date: 03.04.2026 | status: approved — push to GitHub**
> קרא דף זה בתחילת כל session. זה ה-source of truth לכל עבודה על הפרויקט.
---
## 0. Project Identity
**GAM Command Center** = המפעל הפרטי של גל. לא מוצר למכירה. מכאן יוצאים:
- **gam.co.il** — לוח עובדים + משרות + matching (ראשון, דחוף)
- **vBrain SaaS** — מוח פרטי לכל אחד (100₪/חודש)
- **לוחות מקצועיים** + רשת חברתית קטנה
**הצוות:** גל + AI (Claude.ai, Claude Code, Scout). Hani (Origami), Ido (infra).
---
## 1. Stack (נעול)
| רכיב | בחירה |
|------|--------|
| Framework | Next.js App Router |
| DB | Supabase (qdnreijwcptghwoaqlny) |
| Deploy | Vercel (team vBrain) |
| Auth | OTP 019 SMS + Resend magic link |
| Automations | Supabase native (pg_cron + Edge Functions) |
| Source of Truth | Notion → Supabase sync |
| Repo | G-A-M-Gallor/gam-command-center |
| AI | Claude.ai • Claude Code + Scout |
---
## 2. 5 עקרונות שלא לשבור
1. **Config over Code** — לוח חדש = שורה ב-DB. ללא קוד.
2. **Tenant-First** — כל טבלה יש `tenant_id`.
3. **DB-First** — כל תוכן חדש = DB. דף = נרטיב בלבד.
4. **Change-Friendly** — שינוי = עדכון config, לא שכתוב.
5. **Rendering Separation** — Data / Logic / UI / Design = שכבות נפרדות.
---
## 3. AI Operating Rules
**Rule 1:** קרא Context Snapshot לפני כל session: https://www.notion.so/32c8f27212f881e9b4b7fdbdfeeeb98a
**Rule 2:** Notion = Source of Truth. לעולם לא Supabase → Notion.
**Rule 3:** כל sync הוא Notion → Supabase בלבד.
**Rule 4:** אסור Vercel deploy ללא אישור מפורש מגל.
**Rule 5:** Supabase migrations + Edge Functions = מותר ללא אישור.
**Rule 6:** Make.com = חיבורים חיצוניים בלבד. כל לוגיקה פנימית = Supabase.
**Rule 7:** Error Policy = 3 retries → fail → log → alert.
**Rule 8:** כל שינוי `.env.local` → גל מעדכן Vercel dashboard בנפרד.
**Rule 9:** Naming Convention — שם זהה בכל הצדדים (Supabase, Notion, Vercel, GitHub).
**Rule 10:** לפני יצירת קוד חדש — בדוק אם קיים. אל תיצור duplicate.
**Rule 11:** כל Edge Function = Deno/TypeScript + error handling + CORS + logs.
**Rule 12:** כל migration = `IF NOT EXISTS` + rollback comment + descriptive name.
**Rule 13:** RLS מופעל על כל טבלה. אף פעם לא `USING(true)` בלי סיבה מתועדת.
**Rule 14:** אסור לכתוב secrets בקוד. הכל דרך `Deno.env.get()` + Supabase Vault.
**Rule 15:** Session Handoff = תמיד בסיום session עם Claude Code.
**Rule 16:** Claude Code מעדכן task status בNotion + Supabase בסיום task (הושלם/בהתקדמות/תקוע).
**Rule 17:** כל App חייב CLAUDE.md — דף ילד בNotion. מסונכרן ל-`pm_apps.claude_md_content` כל 3 דקות.
---
## 4. Material Change Protocol v3.1
> **מהו Material Change?** שינוי שמשפיע על יציבות, אבטחה, עלויות, או ארכיטקטורה של המערכת.
### Tier 1 — דורש אישור מפורש מגל לפני ביצוע
1. כל Vercel deploy
2. שינוי environment variables ב-Vercel / production
3. מחיקת טבלה / עמודה עם נתונים
4. שינוי schema של `semantic_memory` (AD-2026-001)
5. שינוי או הפעלה מחדש של Frozen Edge Functions (`sync-memory`, `batch-embed-memory`, `generate-embedding`)
6. כתיבה ל-`vb_ai_memory` (מוקפא — trigger חוסם)
7. שינוי RLS policies על טבלאות עם נתוני משתמשים
8. שינוי auth flow (OTP, magic link, JWT)
9. שינוי `cron_sync_secret` או כל secret קריטי ב-Vault
10. הוספת source_type חדש ל-`semantic_memory` ENUM
11. שינוי embedding model (נעול ל-gemini-embedding-001 בלבד)
12. מחיקת cron job קיים
13. שינוי Make.com scenarios שמחוברים ל-Fireberry או Origami
14. כל שינוי במבנה pm_* tables שמשפיע על notion-pm-sync
15. שינוי Multi-tenant architecture
### Tier 2 — בצע + עדכן גל מיד אחרי
1. הוספת cron job חדש
2. הוספת Edge Function חדשה לproduction
3. שינוי retention policy של backup או semantic_memory
4. הוספת webhook חיצוני חדש (Make / n8n)
5. שינוי Storage bucket permissions
6. הוספת index חדש על טבלה גדולה (>1000 rows)
7. שינוי notion-pm-sync logic שמשפיע על pm_sync_schema
8. Deploy של Workflow OS engine לproduction
9. הוספת App חדש ל-Apps DB
### Safe Zone — תמיד OK ללא שאלה
1. Supabase migration (ADD column, CREATE TABLE IF NOT EXISTS)
2. Deploy Edge Function חדשה (לא שינוי קיימת)
3. עדכון תוכן Notion (דפים, DBs, CLAUDE.md)
4. קריאה מ-Supabase (SELECT בלבד)
5. עדכון task status ב-Notion / Supabase (Rule 16)
6. הוספת שורות ל-vb_functions, pm_sync_schema
7. הוספת records לכל DB config
8. כתיבה ל-backup_logs, project_memory, semantic_memory (תוכן)
9. עדכון CLAUDE.md של App
### Recovery — מה לעשות כשמשהו נשבר
1. **עצור מיד** — אל תנסה לתקן ללא הבנה מלאה
2. **תעד** — הכנס ל-`project_memory` עם `source='incident'`
3. **בדוק backup_logs** — האם יש גיבוי מהיום?
4. **Flag לגל** — העלה בשיחה הבאה ב-Claude.ai
5. **אל תמחק** — soft delete בלבד (`deleted_at = now()`)
6. **Rollback migration** — רק אחרי אישור גל
---
## 5. Frozen Assets — אסור לגעת
### Edge Functions (FROZEN — מחזירות 403):
- `sync-memory`
- `batch-embed-memory`
- `generate-embedding`
### Tables (FROZEN):
- `vb_ai_memory` — trigger חוסם כל כתיבה
### Schema (נעול):
- `semantic_memory.source_type` ENUM — 14 ערכים בלבד
- `semantic_memory.embedding_model` — gemini-embedding-001 בלבד
---
## 6. Cron Map (מלא, נוכחי)
| jobid | שם | לוח זמנים UTC | ישראל |
|-------|-----|---------------|-------|
| 34 | daily-backup | 23:23 | 02:23 AM |
| 21 | cleanup-semantic-memory | 00:17 | 03:17 AM |
| 11 | cleanup-http-responses | 04:00 | 07:00 AM |
| 27 | health_check_semantic_memory | 05:00 | 08:00 AM |
| 13 | GAM PM Sync (Notion→Supabase) | כל 3 דקות | — |
| 17 | embed-semantic | :11, :43 כל שעה | — |
| 20 | crawl-notion-pages | :07, :54 כל שעה | — |
| 24 | auto-classify-domains | :25, :55 כל שעה | — |
| 25 | update-smart-scores | :35 כל שעה | — |
| 14 | daily-functions (system checks) | 02:20 | 05:20 AM |
| 26 | daily-brief | 04:00 | 07:00 AM |
---
## 7. Key Edge Functions
| Function | תפקיד | Auth |
|----------|--------|------|
| `daily-backup` | גיבוי יומי 5 טבלאות | x-cron-secret |
| `restore-backup` | שחזור מגיבוי (dry_run first) | service role |
| `notion-pm-sync` (v17) | Notion→Supabase sync | x-cron-secret |
| `embed-semantic` (v7) | PM→embeddings | cron |
| `crawl-notion-pages` (v4) | Notion pages→embeddings | cron |
| `semantic-query` (v3) | חיפוש סמנטי API | public |
| `daily-functions` (v3) | 29 system checks | cron |
| `auto-classify-domains` (v3) | domain classification | cron |
| `update-task-status` (v3) | dual-write Notion+Supabase | gam-status-update-2026 |
---
## 8. Vault Keys (שמות — לא ערכים)
- `notion_api_key_new` — Notion Integration Token
- `cron_sync_secret` — auth header לcron jobs
- `gemini_api_key` — Gemini embedding-001
- `BACKUP_ENCRYPTION_KEY` — AES-256-GCM לגיבויים
- `BACKUP_ALERT_EMAIL` — התראות גיבוי
---
## 9. Apps DB (11 Apps)
| App | תפקיד | סטטוס |
|-----|--------|-------|
| 🌐 gam.co.il | אתר ראשי | בפיתוח |
| 🧠 Scout | AI interface | בפיתוח |
| 🧰 Site Toolkit | כלי אפיון | בפיתוח |
| ⚙️ פונקציות | לוגיקה עסקית | בפיתוח |
| ⭐ המלצות | recommendations | בפיתוח |
| 🛠️ CC Toolkit | כלים פנימיים | בפיתוח |
| 🔄 Workflow OS | אוטומציות | בפיתוח |
| 🧠 Semantic Memory | vBrain engine | פעיל |
| 📚 CC Courses | קורסים | בפיתוח |
| 🤖 ChatGPT Integration | AI workstation | בפיתוח |
| 🎨 Miro Visual Layer | ויזואליזציה | בפיתוח |
---
## 10. Semantic Memory Rules (AD-2026-001)
- **Unified Search Index:** `semantic_memory` = הטבלה היחידה
- **450+ active chunks**
- **Model:** gemini-embedding-001 (768d) — אף מודל אחר אסור
- **Primary search:** `search_brain_smart()` — לא `search_brain()`
- **Writers:** embed-semantic v7, crawl-notion-pages v4, ingest-manual v2
- **Health cron:** job 27, daily 05:00 UTC
- **Deprecated:** search_tasks(), search_project_memory(), ai.threads/messages
---
## 11. PM Hierarchy
```javascript
App → Goal → Portfolio → Project → Sprint → Task
```
- כל רמה יודעת את כל הרמות מעליה
- Sync: Notion → Supabase (pm_* tables), כל 3 דקות
- 86 מיפויים פעילים ב-pm_sync_schema
- Rule 16: Claude Code מעדכן status בסיום כל task
---
## 12. Working with This Repo
```bash
# Deploy EF
npx supabase functions deploy FUNCTION_NAME --project-ref qdnreijwcptghwoaqlny

# Migration
npx supabase db push --project-ref qdnreijwcptghwoaqlny

# Secrets
npx supabase secrets set KEY=value --project-ref qdnreijwcptghwoaqlny

# NEVER
# npx vercel deploy  ← דורש אישור גל
```
---
*CLAUDE.md v3.1 | 03.04.2026 | GAM Command Center*
*Material Change Protocol: 15 Tier 1 triggers + 9 Tier 2 + 9 Safe Zone + Recovery*