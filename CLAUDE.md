# GAM Command Center — CLAUDE.md v3.1
> קרא את כל הדף לפני שאתה עושה כלום. זה ה-source of truth שלך.
> עודכן: 03.04.2026

---

## 1. זהות המערכת

**GAM Command Center** — מפעל פרטי של גל. לא מוצר למכירה.

| פרמטר | ערך |
|---|---|
| Supabase Project | `qdnreijwcptghwoaqlny` |
| GitHub | `G-A-M-Gallor/gam-command-center` |
| Deploy | Vercel — team vBrain |
| Framework | Next.js App Router + TypeScript |
| DB | Supabase (Postgres + Edge Functions + pg_cron) |
| Context Snapshot | https://www.notion.so/32c8f27212f881e9b4b7fdbdfeeeb98a |
| Session Handoff | https://www.notion.so/3328f27212f881458de6d710264b5b23 |
| Decisions Log | https://www.notion.so/9f0ecc260edb4aa6b821344a36630577 |

---

## 2. 5 עקרונות שלא לשבור

1. **Config over Code** — לוח/App חדש = שורה ב-DB. ללא קוד.
2. **Tenant-First** — כל טבלה יש `tenant_id` / `workspace_id`.
3. **Rendering Separation** — Data / Logic / UI / Design = שכבות נפרדות.
4. **DB-First** — Schema drives code. לא הפוך.
5. **Change-Friendly** — שינוי = עדכון config/Notion, לא שכתוב קוד.

---

## 3. Rule 16 — עדכון Task Status (חובה)

כשמסיים משימה — עדכן סטטוס דרך `complete-tasks` Edge Function:

```bash
curl -X POST \
  https://qdnreijwcptghwoaqlny.supabase.co/functions/v1/complete-tasks \
  -H "x-cron-secret: gam-cron-2026-sync-secret-x9k" \
  -H "Content-Type: application/json" \
  -d '{
    "task_ids": ["notion-id-1", "notion-id-2"],
    "completed_by": "claude-code",
    "session": "session-name"
  }'
```

**כללים:**
- תמיד להשתמש ב-`complete-tasks` — לא בNotion MCP ישיר לעדכון סטטוס
- שולח מערך של `notion_id` — הפונקציה מעדכנת Supabase + Notion במקביל
- מחזירה `{ updated, failed, db_updated }` — לוודא `failed: 0`

לאיתור `notion_id` של טאסק:
```sql
SELECT notion_id, title FROM pm_tasks WHERE title ILIKE '%keyword%' AND deleted_at IS NULL;
```

---

## 4. Rule 17 — CLAUDE.md לכל App

כל App ב-Notion חייב דף בן `CLAUDE.md`. מסונכרן אוטומטית ל-`pm_apps.claude_md_content` כל 3 דקות דרך `notion-pm-sync`.

---

## 5. Material Change Protocol — Tier System

### 🔴 Tier 1 — עצור מיד (אל תבצע ללא אישור מפורש מגל)

| # | טריגר | סיבה |
|---|---|---|
| 1 | `vercel deploy` / `vercel --prod` | עולה כסף, דורש אישור |
| 2 | `supabase functions deploy` על פונקציה קיימת ב-production | עלול לדרוס גרסה פעילה |
| 3 | כל write ל-`vb_ai_memory` | FROZEN — trigger חוסם, אל תנסה |
| 4 | קריאה לפונקציות קפואות: `sync-memory`, `batch-embed-memory`, `generate-embedding` | מחזירות 403, לא לנסות |
| 5 | הוספת `source_type` ENUM value חדש ל-`semantic_memory` | דורש migration + Decisions Log entry |
| 6 | שינוי `embedding_model` מ-`gemini-embedding-001` | AD-2026-001 — נעול |
| 7 | שינוי `EMBEDDING_DIMS` מ-768 | AD-2026-001 — נעול |
| 8 | DROP/RENAME על pm_* טבלאות | שובר sync pipeline |
| 9 | מחיקת bulk מ-`semantic_memory` ללא סיבה מוצהרת | בלתי הפיך |
| 10 | שינוי schema של `knowledge_sources_config` ללא migration | שובר SE S3 sync |

### 🟠 Tier 2 — התרע לפני ביצוע (ציין בהודעה לגל)

| # | טריגר |
|---|---|
| 11 | יצירת Edge Function חדשה |
| 12 | הוספת pg_cron job חדש |
| 13 | שינוי שם Vault key |
| 14 | שינוי התנהגות `notion-pm-sync` |
| 15 | שינוי `search_brain_smart()` RPC |
| 16 | שינוי RLS policies על pm_* |
| 17 | עדכון `complete-tasks` Edge Function |
| 18 | עדכון `sync-knowledge-sources` Edge Function |
| 19 | הוספת/הסרת מקור מ-`knowledge_sources_config` |
| 20 | שינוי Notion integration connections |
| 21 | שינוי `auto_classify_domains()` |
| 22 | הוספת טבלה חדשה למשפחת pm_* |
| 23 | שינוי Session Handoff format |
| 24 | שינוי chunk_size_policy |
| 25 | הוספת domain classification חדש |

### ✅ Safe Zone — בצע בחופשיות

- כל `SELECT` query
- קריאה מ-Notion / Supabase
- עדכון task status דרך `complete-tasks`
- יצירת דפים חדשים ב-Notion
- חיפוש סמנטי דרך `search_brain_smart`
- יצירת migration חדש (שינוי schema) — מותר, מומלץ
- deploy Edge Function **חדשה** (לא קיימת) — מותר

---

## 6. Infrastructure — Edge Functions

### פעילות ✅

| Function | Version | תפקיד |
|---|---|---|
| `notion-pm-sync` | v19 | Notion → Supabase pm_* sync (כל 3 דקות) |
| `embed-semantic` | v7 | PM tables → Gemini embeddings → semantic_memory |
| `crawl-notion-pages` | v4 | Notion pages → semantic_memory |
| `sync-notion-knowledge` | v13 | Notion knowledge sync |
| `sync-knowledge-sources` | v4 | 17 knowledge sources → semantic_memory (SE S3) |
| `complete-tasks` | v1 | Rule 16 — bulk task status updater |
| `cron-health-monitor` | v5 | Health monitoring |
| `semantic-query` | v3 | POST API לחיפוש סמנטי |
| `daily-backup` | v1 | גיבוי יומי של 5 טבלאות → storage bucket backups |
| `restore-backup` | v1 | שחזור מ-backup לפי תאריך |

### קפואות 🔴 (אל תיגע — מחזירות 403)

- `sync-memory`
- `batch-embed-memory`
- `generate-embedding`

---

## 7. Semantic Memory — AD-2026-001

**מודל יחיד:** `gemini-embedding-001` (768d) — לא לשנות.
**API key location:** Supabase Vault → `get_secret('gemini_api_key')`
**Primary search:** `search_brain_smart()` RPC — לא ליצור אלטרנטיבות.
**`vb_ai_memory`:** FROZEN — trigger חוסם כל write.

### source_type ENUM (14 ערכים — לא לשנות ללא migration)
`task | sprint | project | app | goal | portfolio | team | knowledge_item | notion_page | claude_md | decision | function | ai_memory | wiki_article | wiki_glossary | course`

### Constraints (NOT NULL)
- `content_hash` — SHA-256 של content
- `domain` — DEFAULT 'unclassified'
- `embedding_model` — חייב להיות `gemini-embedding-001`

---

## 8. pg_cron Jobs

| jobid | שם | לוח זמנים |
|---|---|---|
| 13 | GAM Command Center Sync - Tasks | כל 3 דקות |
| 17 | embed-semantic | :11 ו-:43 כל שעה |
| 20 | crawl-notion-pages | :07 ו-:54 כל שעה |
| 24 | auto-classify-domains | :25 ו-:55 כל שעה |
| 25 | update-smart-scores | :35 כל שעה |
| 26 | daily-brief | 7:00 ישראל |
| 27 | health_check_semantic_memory | 05:00 UTC יומי |
| 33 | knowledge-sources-sync-daily | 05:00 UTC יומי |
| 34 | daily-backup | 23:23 UTC יומי (02:23 ישראל) |

---

## 9. Vault Keys

| שם | תוכן |
|---|---|
| `notion_api_key_new` | Notion Integration Token — MCP gam-command-center-push |
| `cron_sync_secret` | `gam-cron-2026-sync-secret-x9k` |
| `gemini_api_key` | Gemini embedding-001 API key |

---

## 10. PM System — Notion Collection IDs

| Entity | Collection ID |
|---|---|
| Apps | `fb708d62-c4bf-47e5-a882-2cbc3b330227` |
| Projects | `109b843c-67e1-4866-923c-fe598c5c01f5` |
| Sprints | `df56c661-8f2d-4c44-b397-ab7b36ee8934` |
| Tasks | `0e83150a-1a03-4d63-bb7b-dded95493847` |

---

## 11. Recovery Protocol

**אם הפעלת Tier 1 בטעות:**
1. עצור מיד
2. תעד מה בוצע בדיוק
3. אל תנסה לתקן לבד — דווח לגל
4. לא לכסות — שקיפות מלאה

**אם אין לך CLI / כלי נדרש:**
- עצור ובקש — אל תנסה לדמות או להמציא
- ציין בדיוק מה חסר

**אם לא בטוח:**
- שאל לפני שאתה מבצע
- "לא בטוח" = Tier 2 לפחות

---

## 12. Make.com

- Team ID: `289416`
- ~40 active scenarios
- **כלל:** Make = External connections בלבד
- כל לוגיק פנימי → Supabase Edge Functions

---

## 13. כללים כלליים

- **אין Vercel deploy** ללא אישור מגל
- **Supabase migrations + Edge Functions** = מותר בלי אישור
- **DB-First** — schema drives code
- **No new source_type ENUM** ללא migration + Decisions Log
- **Notion integrations:** תמיד שני חיבורים — ראשי "MCP gam-command-center-push" + גיבוי "Supabase...task & goals"