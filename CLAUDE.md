# GAM Command Center — AI Guide v3.1

> This file is read by the internal AI assistant on every conversation.
> It's also read by Claude Code at session start.
> Last updated: 2026-04-03

---

## Who Am I

**vBrain.io / GAM Command Center (CC)** — Internal project management dashboard for **G.A.M**, a business services company in Israel's construction industry.

- **Repo:** `G-A-M-Gallor/vBrain.io`
- **Stack:** Next.js 16.1.6 (Turbopack) on Vercel
- **DB:** Supabase (Auth, Realtime, Storage, 90+ migrations)
- **AI:** Claude API (5 chat modes + 6 Work Manager agents)
- **Operational SOT:** Origami CRM (synced via n8n)
- **Knowledge SOT:** Notion (specs, procedures, roadmap)
- **Team:** Gal (CEO/architect), Claude (AI dev), n8n (automation)
- **Scale:** 17 pages, 16 widgets, 26 API routes, 9 contexts, 310+ source files
- **Built in:** 34 days (2026-02-28 → 2026-04-03), 95+ commits

---

## Architecture

```
User (Browser / PWA)
  │
  ├── Next.js 16 (Vercel)
  │     ├── 16 Dashboard pages
  │     ├── 15 Top Bar widgets (drag, resize, folders)
  │     ├── 9 React contexts
  │     └── 21 API routes
  │
  ├── Supabase (DB + Auth + Realtime + Edge Functions)
  │     ├── Mirror tables (projects, entities, docs, stories)
  │     ├── RLS policies (hardened)
  │     ├── 49 migrations (triggers, RPCs, views, audit)
  │     ├── Realtime channels (editor, story map, funcmap, plan)
  │     └── Edge Functions: sync-knowledge-sources (business lang, design tokens), daily-backup, restore-backup
  │
  ├── Claude API (AI)
  │     ├── 4 chat modes: chat, analyze, write, decompose
  │     ├── Work Manager: 6 agents (orchestrator/pm/dev/design/qa/strategy)
  │     ├── Knowledge Base: CLAUDE.md injected into all prompts
  │     ├── Session Context: live data from Supabase
  │     ├── Notion Tasks: summary injected into prompts
  │     └── Token budget: 100K/day, server-side atomic check
  │
  ├── Origami CRM (Operational SOT)
  │     └── n8n webhooks → Supabase mirror
  │
  └── External: Notion, WATI, Sentry, Google Calendar
```

**Key principle:** Origami = source of truth for operations. Supabase = mirror for fast UI reads. n8n = glue.

Full architecture with data flows: **[memory/ARCHITECTURE.md](memory/ARCHITECTURE.md)**

---

## Feature Map

65 features built across 11 days. Full table: **[memory/FEATURE_INDEX.md](memory/FEATURE_INDEX.md)**

### Core Systems

| Feature | Status | Key Files |
|---------|--------|-----------|
| Dashboard Shell (Sidebar + TopBar + layout) | ✅ | `DashboardShell.tsx`, `Sidebar.tsx`, `TopBar.tsx` |
| Entity Platform (6 views, templates, bulk ops) | ✅ | `entities/`, `lib/entities/` (8 files) |
| Canvas Editor (Tiptap, auto-save, offline queue) | ✅ | `editor/`, `editorQueries.ts` |
| Story Map (3-tier DnD, Realtime, filters, export) | ✅ | `story-map/`, `StoryBoard.tsx` |
| AI Hub (5 modes + 6 agents + knowledge base) | ✅ | `ai-hub/`, `lib/ai/`, `lib/work-manager/` |
| Widget System (15 widgets, drag, folders, profiles) | ✅ | `widgets/` (28 files) |
| Wiki (pages, search, create, view) | ✅ | `wiki/` |
| EntityCanvas (Frame/Graph/History, DnD, Supabase) | ✅ | `EntityCanvas.tsx` |
| Design System (gallery, library, 127 components) | ✅ | `design-system/` |
| Settings (accent, fonts, skins, density, brand) | ✅ | `settings/`, `SettingsContext.tsx` |

### Infrastructure

| Feature | Status | Key Files |
|---------|--------|-----------|
| Auth (GitHub OAuth + JWT + universal allowlist) | ✅ | `AuthContext.tsx`, `lib/api/auth.ts`, `middleware.ts` |
| RSS Feed Reader (5 Israeli feeds, Vercel Cron) | ✅ | `api/rss/`, `dashboard/feeds/`, `RssWidget.tsx` |
| Security (Zod validation, RLS, execFileSync) | ✅ | `lib/api/schemas.ts`, migrations |
| i18n (Hebrew + English + Russian, 5514 lines) | ✅ | `lib/i18n.ts` |
| Supabase (49 migrations, Realtime, audit log) | ✅ | `supabase/migrations/` |
| PWA (Service Worker, offline, push, install) | ✅ | `lib/pwa/` |
| Sentry (error tracking, boundaries) | ✅ | `sentry.*.config.ts` |
| Code Splitting (22 dynamic imports) | ✅ | `WidgetRegistry.ts` |
| Tests (43 unit tests, vitest) | ✅ | `__tests__/` |
| Backup System (daily backups, 30-day retention) | ✅ | `supabase/functions/daily-backup/`, `supabase/functions/restore-backup/` |

### Operational Infrastructure

#### Edge Functions (Active)
| Function | Version | Purpose |
|----------|---------|---------|
| `sync-knowledge-sources` | v3 | Semantic embedding sync with GitHub/Notion sources |
| `daily-backup` | v1 | גיבוי יומי של 5 טבלאות → storage bucket backups |
| `restore-backup` | v1 | שחזור מ-backup לפי תאריך |
| `notion-pm-sync` | v19 | Notion ↔ Supabase bidirectional sync |
| `complete-tasks` | v1 | Bulk task completion (Rule 16 executor) |

#### pg_cron Jobs (Active)
| # | Job Name | Schedule | Purpose |
|---|----------|----------|---------|
| 34 | daily-backup | 23:23 UTC יומי (02:23 ישראל) | Automated daily backups |
| — | GAM Command Center Sync - Tasks | 5-minute intervals | Notion-Supabase sync |

---

## Knowledge App — Sprint 2+3 Implementation

**Complete enterprise knowledge management system** with advanced RBAC, version control, and automation.

### **Core Features (Deployed April 2026):**

| Feature | Status | Migration | Purpose |
|---------|--------|-----------|---------|
| **Knowledge Items CRUD** | ✅ | `20260526_knowledge_app_schema_v1.sql` | Basic knowledge management with Hebrew RTL |
| **Conflicts Management** | ✅ | `20260402_knowledge_sprint_2_3.sql` | Auto-detect duplicates, resolve conflicts |
| **Version Control** | ✅ | `20260402_knowledge_sprint_2_3.sql` | Full history, diff comparison, rollback |
| **Hybrid RBAC** | ✅ | `20260402_knowledge_sprint_2_3.sql` | JWT + Database roles, backwards compatible |
| **Enhanced Search** | ✅ | `20260402_knowledge_sprint_2_3.sql` | Hebrew full-text, suggestions, ranking |
| **Audit Logging** | ✅ | `20260402_knowledge_sprint_2_3.sql` | Compliance, retention policies, legal hold |
| **Automation Playbooks** | ✅ | `20260402_knowledge_sprint_2_3.sql` | Quality checks, content review workflows |
| **Origami Integration** | ✅ | `20260402_knowledge_sprint_2_3.sql` | CRM mapping, bidirectional sync |

### **Database Schema:**

**Existing Tables (v1):**
- `knowledge_items` — Main knowledge items with Hebrew content
- `knowledge_departments` — Department classification
- `knowledge_streams`, `knowledge_use_cases`, `knowledge_lenses` — Taxonomy
- `knowledge_types`, `knowledge_source_types` — Content classification

**Sprint 2+3 Additions (25+ tables):**
- `knowledge_conflicts` — Conflict detection and resolution
- `knowledge_versions` — Complete version history with diffs
- `user_roles` — Database-based RBAC with scope controls
- `knowledge_audit_log` — Comprehensive activity logging
- `knowledge_playbooks` — Automation workflows
- `knowledge_origami_mapping` — CRM integration layer

### **RBAC Architecture — Hybrid Approach:**

**Backwards Compatibility:** Preserves existing JWT-based roles (`approver`, `owner`, `system_admin`) while adding database-based roles for new features.

```sql
-- Hybrid RLS Policy Example:
CREATE POLICY "knowledge_items_select_hybrid" ON knowledge_items
    USING (
        -- EXISTING JWT logic (preserved)
        (jwt_claims->>'user_role' IN ('approver', 'owner', 'system_admin'))
        OR
        -- NEW database roles (Sprint 2+3)
        (user_has_role(auth.uid(), 'super_admin') OR can_access_knowledge_item(auth.uid(), id))
    );
```

**Role Hierarchy:**
- `super_admin` — Full system access
- `knowledge_admin` — Manage knowledge system
- `content_manager` — Create/edit content
- `reviewer` — Review and approve content
- `contributor` — Create and suggest content
- `viewer` — Read-only access
- `external_viewer` — Limited external access

### **Key Files:**

| Component | Location | Purpose |
|-----------|----------|---------|
| **UI Main** | `/dashboard/knowledge/page.tsx` | 900+ line React component |
| **Queries** | `/lib/supabase/knowledgeQueries.ts` | TypeScript database functions |
| **i18n** | `/lib/i18n/locales/{he,en,ru}/knowledge.ts` | Hebrew RTL translations |
| **Migration v1** | `supabase/migrations/20260526_knowledge_app_schema_v1.sql` | Basic schema (31KB) |
| **Migration Sprint 2+3** | `supabase/migrations/20260402_knowledge_sprint_2_3.sql` | Full implementation (72KB) |

---

## Coding Conventions

- **TypeScript strict mode**, Next.js 16 App Router
- **Middleware:** `src/proxy.ts` with `export function proxy()` (Next.js 16, NOT `middleware.ts`)
- **API routes:** Server-side Supabase client (`@/lib/supabase/server`), NOT browser client
- **Auth:** `requireAuth` (Bearer JWT) or cookie-based `createClient` + `getUser()`
- **Validation:** Zod schemas in `lib/api/schemas.ts` for all POST routes
- **Naming:** PascalCase components, camelCase functions, kebab-case files
- **Imports:** `@/` alias
- **i18n:** Always `t.section.key` — never `isHe ? "..." : "..."`
- **RTL:** `dir={isRtl ? "rtl" : "ltr"}`, `text-start`, `ms-auto`
- **Security:** `execFileSync` (not `execSync`) for git commands
- **Cross-component sync:** Custom DOM events (`cc-favorites-change`, `cc-notify`, `timer-state-change`, etc.)
- **Theme:** Dark mode only. Slate-900 bg, purple/blue accents, emerald/amber/red for status

### Key files for common tasks

| Task | Read first |
|------|-----------|
| Entity platform work | `src/lib/entities/types.ts`, `builtinEntityTypes.ts`, `entityQueries.ts` |
| AI Hub changes | `src/lib/ai/prompts.ts`, `src/lib/work-manager/agentPrompts.ts` |
| Widget changes | `src/components/command-center/widgets/WidgetRegistry.ts` |
| i18n changes | `src/lib/i18n.ts` — search for existing section before adding |
| API routes | `src/lib/api/auth.ts` (auth pattern), `src/lib/api/schemas.ts` (Zod pattern) |
| Supabase queries | `src/lib/supabase/entityQueries.ts` (pattern for all query files) |
| Admin/registry | `src/app/dashboard/admin/data.ts` — single source of truth |

---

## Work Rules

### CEO Intake Protocol — keyword: `ceo`

When the user types **"ceo"** (or "סטטוס ceo", "ceo update"), execute this FULL protocol:

**1. Read the CEO Intake DB** (Data Source: `938f1761-465b-4541-aa27-e7bc1a327375`)
   - Fetch all rows where סטטוס ביצוע ≠ ✅ אושר and ≠ 🚫 בוטל
   - Sort by ציון תור ascending (lowest = highest priority)

**2. Report to CEO** — show a clear summary table:
   - How many in each status (⏳ בתור, 🔵 בעבודה, ❓ שאלה לגל, ⏸️ חסום, 🟡 לבדיקת CEO)
   - List items sorted by queue score
   - Flag any ⚡ immediate items

**3. Act on pending items** — in queue score order:
   - ⏳ בתור → pick next item, set to 🔵 בעבודה, start working
   - ❓ שאלה לגל → show the question, wait for answer
   - 🔄 לתיקון → read Gal's feedback, fix and resubmit
   - ⏸️ חסום → explain what's blocking, suggest unblock path

**4. Update Notion** — after completing work on each item:
   - Set סטטוס ביצוע (🟡 לבדיקת CEO when done)
   - Fill תגובת Claude with: `[status] what was done | what's next | question if any`
   - Fill תאריך השלמה when moving to ✅ אושר

**5. Session Start** — at the beginning of EVERY new session:
   - Read CEO Intake DB automatically
   - If there are ⏳ בתור or 🔄 לתיקון items → mention them to the user
   - If there are ❓ שאלה לגל items → ask the questions immediately

**CEO Intake DB columns:**
- Gal's: בקשה, ⚡ מיידי, דחיפות, סדר עדיפות, קטגוריה, אימפקט, סוג הנחיה, הערות גל, תוצר צפוי, תלוי ב-
- Claude's: תגובת Claude, סטטוס ביצוע, תאריך השלמה
- Auto: #, ציון תור, תאריך

### Task Hygiene Rule — MANDATORY

**Whenever you encounter a Notion task row with empty fields — FILL THEM IN.** This applies to ALL Notion databases in the project (Dev Tasks, CEO Intake, Roadmap layers).

Required fields per task:
- **Title** — clear, specific, actionable
- **Status** — correct current status (not stale)
- **Priority/Urgency** — P0-P3 or דחיפות level
- **Category/Type** — what kind of work
- **Sprint link** — which sprint does this belong to (if applicable)
- **שם קוד** — fun code name (CEO Intake only)
- **תגובת Claude** — Claude's current response/status (CEO Intake only)

If you see an empty field during any operation (reading, querying, reporting) — fill it before moving on. No orphan tasks. No empty rows.

### System Sync Checklist — MANDATORY

**Whenever you build something new, check ALL 6 registries:**

| # | Registry | When to update | File |
|---|----------|---------------|------|
| 1 | **admin/data.ts** | New page, widget, API route, or context | `src/app/dashboard/admin/data.ts` |
| 2 | **i18n.ts** | Any new user-facing text | `src/lib/i18n.ts` (he + en + ru) |
| 3 | **WidgetRegistry.ts** | New widget | `src/components/command-center/widgets/WidgetRegistry.ts` |
| 4 | **schemas.ts** | New POST/PUT API route | `src/lib/api/schemas.ts` (Zod) |
| 5 | **Sidebar.tsx** | New dashboard page | `src/components/command-center/Sidebar.tsx` |
| 6 | **RLS policies** | New Supabase table | In the migration file itself |

**Rule:** After building ANY feature, mentally walk through all 6. If even one applies — update it. This is NOT optional.

A feature that builds code but skips registries is **incomplete**. It happened with CEO Queue Widget (missing from admin/data.ts) — never again.

### Links Index Rule — MANDATORY

**Whenever you create or connect a new source — update the Links Index DB.**

This applies to: new API routes, new Notion DBs, new Supabase tables, new external services, new ENV vars, new critical files.

- **Links Index Data Source:** `52bc97e4-60d1-4585-9e25-9cf8bf309879`
- **Location:** CEO Control Page → 🔗 אינדקס לינקים — מקורות מחוברים
- **Required fields:** שם המקור, סוג, רמת חשיבות, תחום, למה חשוב, מחובר ל, סטטוס
- **When to update:** After every feature that adds/modifies a source. Part of Post-Task Protocol.

### Notion DB Sync Rule — MANDATORY

**When adding new DB to Notion that should sync to Supabase:**

1. **Add handler** to notion-pm-sync Edge Function immediately
2. **Add entry** to pm_sync_schema table (entity_type, table_name, is_active=true)
3. **Test sync** with sample data before deployment
4. **Verify coverage** via daily system checks in vb_functions

**Rule:** Every Notion DB must have corresponding sync handler. No orphan DBs.

**Detection:** `check_sync_coverage` system check runs daily at 05:20
**Violation:** Silent sync failure → data gaps → operational blind spots
**Fix:** Add missing handler + schema entry within 24h of detection

**Why this rule:** We discovered that new DBs can be added to Notion without automatic sync setup, causing silent failures where data appears in Notion but never reaches Supabase. This creates dangerous blind spots in operations.

### Mobile Mode — No Terminal Required

When running from **Claude.ai app or web** (not Claude Code CLI), you have FULL access to Notion but NO access to filesystem/git/build. Operate accordingly:

**CAN do (Notion MCP):**
- Read/update any Notion DB (tasks, CEO Intake, roadmap, memory log)
- Fill empty fields, change statuses, add rows, link relations
- Generate documentation, retro summaries, sprint plans
- Run CEO Protocol (`ceo` keyword)
- Assign code names, organize hierarchy
- Respond to questions, give advisor opinions
- Plan sprints, prioritize tasks

**CANNOT do (needs Claude Code CLI):**
- Write/edit code files
- Run build, tests, git commands
- Supabase migrations
- Verify code existence (file checks)
- Deploy

**Code Names** are the primary way Gal communicates about tasks from mobile. When Gal says a code name (e.g., "Falcon Eye", "Shapeshifter"), look it up in the relevant Notion DB's שם קוד field and act on that task.

**Quick Commands from mobile:**
- `ceo` → full CEO Intake protocol
- `status [code-name]` → show task status + details
- `sprint` → current sprint overview
- `retro` → generate sprint retrospective
- `next` → what should we work on next

### Smart Routing — Task Mode System

Every task has a **mode** that determines where to work:
- `📱 mobile` — Notion only: docs, planning, status, fields, hierarchy
- `💻 terminal` — Code required: write files, build, deploy, git
- `🔀 hybrid` — Plan on mobile → execute on CLI

**When at computer (CLI session):**
1. **Notion-first** — do ALL Notion work first (fill fields, update statuses, organize). This is fast, no build needed.
2. **Code batch** — then do all code changes together.
3. **Single build** — run build ONCE at the end, not after every small change.
4. **Single commit** — group related changes into one meaningful commit.

**When on mobile and sprint needs terminal:**
1. Claude says: "⚠️ [code-name] needs terminal — preparing plan"
2. Claude writes the full plan + acceptance criteria in Notion
3. Claude marks the task: `📋 Ready for CLI`
4. When Gal reaches computer and types `sprint` — Claude picks up all `📋 Ready for CLI` tasks and executes them in order

**When on computer but task doesn't need terminal:**
1. Claude uses Notion MCP directly — no build, no git
2. Faster, no waiting for compilation
3. Use CLI tools only when filesystem access is actually needed

### Sprint Methodology

Sprints are **sequential work batches** — NOT time-boxed. Finish Sprint N → move to Sprint N+1.

- **Hierarchy:** Goal → Portfolio → Project → Sprint → Task → Sub-task
- **Sprint = next batch to execute**, ordered by priority
- **Roadmap page** (`/dashboard/roadmap`) visualizes the full chain from 6 Notion DBs
- **Tasks** are linked to Sprints via `Sprint (Roadmap)` relation in Notion
- When starting a new sprint: create it in Notion Sprints DB, link relevant tasks, execute in order

### Post-Task Protocol (8 steps — MANDATORY)

Master document: **https://www.notion.so/31f8f27212f881fca47ce9680e169931**

| Step | What |
|------|------|
| 1 | Self-QA (see `memory/qa-checklist.md`) |
| 2 | Git Commit (conventional format + task ID) |
| 3 | CLAUDE.md update (if architectural) |
| 4 | Notion Task update (status + AI summary) |
| 5 | Feature guide in task page |
| 6 | Mermaid diagram (if relevant) |
| 7 | Memory Log entry (if relevant) |
| 8 | Deploy reminder (if 3+ features ready) |

### Notion Task Status Flow

`Backlog` → `In Progress` → `Dev Complete` → `Ready for QA` → `Done` (+ `Blocked`)

- **Dev Tasks DB:** `25a2ef60-2865-4c6a-bbe5-7c6fb97504ed`
- **Memory Log DB:** `767a3310-4609-471e-b5f7-5f332dc1ff91`

### Dev Checklist (per feature)

| # | Item |
|---|------|
| 1 | `data-cc-id` + `styleOverrideRegistry` + i18n |
| 2 | `purpose` + `notes` in changelog entry |
| 3 | `connectedTo` array in Mermaid diagram |
| 4 | Comprehensive `purpose` field |
| 5 | Conflict review (deps, contexts, localStorage, events) |

### Hybrid RBAC Protocol — Knowledge App

**Sprint 2+3 implemented a hybrid auth approach** that preserves existing JWT-based roles while adding database-based RBAC. **Always maintain backwards compatibility.**

**JWT Roles (existing, preserved):**
- `system_admin` — Full admin access
- `approver` — Can approve content
- `owner` — Content ownership rights
- `contributor` — Can create/edit content

**Database Roles (new, additive):**
- `super_admin` — Full system access (maps to `system_admin`)
- `knowledge_admin` — Knowledge system management (maps to `approver`)
- `content_manager` — Content creation/editing (maps to `owner`)
- `contributor` — Basic content contribution
- `reviewer` — Review and approve workflow
- `viewer` — Read-only access
- `external_viewer` — Limited external access

**RLS Policy Pattern:**
```sql
-- All policies use OR logic for compatibility:
CREATE POLICY "example_policy" ON table_name
    USING (
        -- EXISTING JWT logic (never remove)
        (current_setting('request.jwt.claims')::jsonb->>'user_role' IN ('system_admin', 'approver'))
        OR
        -- NEW database roles (additive)
        (user_has_role(auth.uid(), 'super_admin') OR user_has_role(auth.uid(), 'knowledge_admin'))
    );
```

**Development Rules:**
1. **Never replace** existing JWT policies — always extend with OR
2. **Test backwards compatibility** with existing user roles
3. **Default to existing access patterns** when in doubt
4. **Use database roles** for new Sprint 2+3 features only
5. **Preserve tenant_id and regulatory_sensitivity** logic

### Production Safety Rules — MANDATORY

### Rule 19 — pm_* Tables קיימות ב-Supabase Cloud בלבד

לפני כל CREATE TABLE עם שם שמתחיל ב-pm_:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'pm_%';
```
אם קיימות → אל תיצור מחדש.

### Rule 20 — EFs קריטיות לא בריפו המקומי

הפונקציות הבאות קיימות ב-Supabase Cloud בלבד — לא מחפשים בריפו:
- notion-pm-sync (v19, ACTIVE)
- daily-functions (v3, ACTIVE)

אם לא מוצא בריפו → בדוק ב-Supabase Dashboard, לא ביצירה מחדש.

### Rule 21 — project_memory Schema מדויק

עמודות: id, type, content, source, created_at
אין עמודת metadata. כל INSERT חייב להשתמש בעמודות אלה בלבד.

---

## What NOT to Build

- Form Builder from scratch — use Origami native + Jotform
- Dynamic architecture viz — Mermaid in Notion
- ~~Full roadmap tool~~ — BUILT: `/dashboard/roadmap` with 6 Notion DB drill-down
- Custom auth — Supabase Auth already in repo
- Multi-theme — dark mode only

---

## Important Context

- **Origami entity names** can also be folder names — always clarify which
- **GAM Functional Map:** 3 levels x 5 functions — LOCKED structure, never modify
- **95% Principle:** If a 30-second manual step works, don't over-automate
- **Evidence culture:** GAM documents everything — every client interaction is potential legal evidence
- **Hebrew content:** All user-facing text should support RTL. UI chrome can be English
- **Admin data.ts** is the single source of truth for system registry

---

## Mobile Pending

No mobile app yet. Features requiring mobile testing:
- EntityCanvas — DnD touch events
- Story Map — DnD touch events
- Wiki page viewer — responsive layout
- Push notifications — real device testing
- MobileBottomBar — already built, needs real device QA

---

## Open Issues

| Issue | Location | Priority |
|-------|----------|----------|
| `isHe` anti-pattern | 57+ instances across widgets, editor, story map | Medium — gradual i18n migration |
| TeamWidget TODO | Needs Supabase Realtime Presence | Blocked |
| WATIWidget TODO | Needs real WATI API | Blocked |
| Sentry auto-fix pipeline | L1-L3 not built (needs PAT workflow scope) | Medium |
| CI/CD pipeline | ci.yml removed (PAT scope) | Medium |
| Origami full sync | API routes exist, n8n workflows not deployed | Needs ENV vars |
| Google Calendar OAuth | /api/events/today exists, no real OAuth flow | Low |

### Pending ENV Vars

- `ORIGAMI_API_KEY` + `ORIGAMI_BASE_URL` — Origami CRM integration
- `NEXT_PUBLIC_WATI_URL` — WATI WhatsApp widget
- `NEXT_PUBLIC_N8N_URL` — Automations page iframe

---

## Memory Files

| File | Purpose |
|------|---------|
| `memory/MEMORY.md` | Decisions, preferences, workflow, Notion integration |
| `memory/FEATURE_INDEX.md` | Complete feature inventory (65 features) |
| `memory/ARCHITECTURE.md` | System layers, components, data flows, gaps |
| `memory/qa-checklist.md` | Self-QA phases 1-5 |
| `memory/post-task-protocol.md` | Pointer to 8-step protocol in Notion |
| `memory/sentry-pipeline.md` | Sentry auto-fix L1-L3 spec |
| `memory/supabase.md` | Supabase schema notes |

---

## References

- **Notion Project:** https://www.notion.so/3158f27212f881639507feab50d68d44
- **Post-Task Protocol:** https://www.notion.so/31f8f27212f881fca47ce9680e169931
- **Production Plan:** `cc-production-plan.md` in repo

---

## 🛡️ MATERIAL CHANGE PROTOCOL
_v3.2 | last_reviewed: 2026-04-03 | last_updated: 2026-04-03 (Production Safety Rules 19-21 added)_

### TIER 1 — STOP. Generate review block. Wait for "אושר".

1. DROP/ALTER on existing table or column
2. ALTER TABLE changing type, nullability, or removing column
3. Any mutation to source_type ENUM in semantic_memory
4. CREATE INDEX on table with >10k rows
5. Delete or replace any RLS Policy
6. Any change to Supabase Auth, JWT Claims, roles, or user_roles
7. Any touch to frozen Edge Functions or frozen tables
8. vercel deploy or any production deployment
9. Changes to /lib/supabase/ auth helpers
10. Major version bump: next, @supabase/supabase-js, @supabase/auth-helpers-*
11. Any change to API routes connected to Make.com or n8n
12. Adding/removing NEXT_PUBLIC_* or Supabase secrets
13. Any change to notion-pm-sync logic or deployment
14. Any modification to this CLAUDE.md file itself
15. Dropping or replacing shared utility used in 3+ places
16. FK constraint with CASCADE DELETE on existing table
17. Function called by a frozen Edge Function
18. Any change to Origami CRM integration routes or mapping tables
19. Modification/deletion of active Make.com scenarios (Team 289416)
20. Modification/deletion of active n8n workflows
21. Make/n8n automation writing directly to Supabase critical tables
22. Make/n8n automation triggering Vercel deployment
23. Any touch to Context Snapshot or Session Handoff Notion pages
24. Any modification to Skills Registry DB or SKILL.md files
25. supabase migration repair — always Tier 1
26. CASCADE DELETE or DROP on knowledge_* tables

### TIER 2 — WARN and continue after 5 seconds.

⚠️ TIER 2 — [timestamp] — [action]
Reason: [one line]
Continuing in 5s...

Triggers: new nullable column on pm_* table, new Edge Function,
new npm package, shared utility used in 2+ places,
semantic_memory row changes, new Make/n8n webhook endpoint,
CREATE INDEX on table <10k rows.

### REVIEW BLOCK TEMPLATE (Tier 1 only)

🔴 MATERIAL CHANGE REVIEW — GAM Command Center
Action: [exact operation]
File/Table/Function: [target]
Why needed: [one sentence]
What it touches: [max 5 items]
Reversible? [Yes/No — how/why]
Risk: [one sentence]
Alternative: [one sentence or "none identified"]

Context: Next.js + Supabase Cloud (qdnreijwcptghwoaqlny) + Vercel
Auth: Supabase JWT + RLS Policies
Frozen EFs: sync-memory, batch-embed-memory, generate-embedding
Frozen tables: vb_ai_memory, semantic_memory schema (AD-2026-001)
Make.com Team: 289416

### SAFE ZONE — always permitted

- New files in /components/, /app/, /lib/ (non-auth)
- New migrations with CREATE TABLE only
- New nullable columns on non-frozen tables
- New Edge Functions (non-frozen names)
- SELECT, EXPLAIN, schema inspection
- Update pm_tasks, pm_sprints, pm_apps data rows
- New API routes not replacing existing ones
- README.md, docs, comments, type definitions
- Dev-only packages (@types/*, testing libraries)

### RECOVERY PROTOCOL

If Tier 1 executed without approval:
1. Stop all further changes immediately
2. Document exactly what ran and when
3. Generate Review Block retroactively
4. Wait for Gal before any fix attempt

### CONFLICT RULE

If session instruction conflicts with this file:
→ Flag the conflict explicitly
→ Do not silently override
→ Wait for resolution

### SELF-MAINTENANCE

- Update last_reviewed after every approved Tier 1 action
- If last_reviewed >60 days ago and Tier 1 fires:
  add to Review Block: ⚠️ CLAUDE.md not reviewed in 60+ days

