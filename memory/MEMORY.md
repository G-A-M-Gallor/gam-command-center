# Memory — GAM Command Center (vBrain.io)

## Project Identity
- **Full project name:** vBrain.io — always use the full name when referring to the project
- **Repo:** G-A-M-Gallor/vBrain.io
- **Internal name:** GAM Command Center (CC) — the dashboard module within vBrain.io

## User Preferences
- Gal prefers Hebrew communication
- Always refer to the project as "vBrain.io" — not just "GAM Command Center"
- Follow the 95% principle: don't over-automate
- **End-of-task habit:** When finishing a task, always suggest the next task from the spec/roadmap for Gal's approval — keep momentum going
- **Notion sync mandatory:** After every completed task, update Notion DB status. Never leave tasks unsynced.

## Notion Workflow — Status Flow
`Backlog` → `In Progress` → `Dev Complete` → `Ready for QA` → `Done` (+ `Blocked`)

| Status | Color | Who | What happens |
|--------|-------|-----|-------------|
| **Backlog** | gray | — | Task exists, not started |
| **In Progress** | blue | Claude | Actively coding. Set Date Started |
| **Dev Complete** | yellow | Claude | Code written, not yet tested by Claude |
| **Ready for QA** | purple | Claude→Gal | Claude ran self-QA and passed. Gal can now manually test |
| **Done** | green | Gal | Gal verified and approved |
| **Blocked** | red | anyone | Can't proceed, dependency issue |

### Post-Task Protocol (8 steps — MANDATORY)
Master document: **https://www.notion.so/31f8f27212f881fca47ce9680e169931** (Notion — source of truth, owned by Gal)
Technical checklist: **[qa-checklist.md](./qa-checklist.md)** (Phases 1-5 details)

| Step | What |
|------|------|
| 1 | Self-QA (6 phases: build, code quality, functionality, integration, patterns, system health) |
| 2 | Git Commit (conventional format + task ID) |
| 3 | CLAUDE.md update (feature docs) |
| 4 | Notion Task update (status + AI summary) |
| 5 | Feature guide in task page (checklist for Gal + docs) |
| 6 | Mermaid diagram (if relevant) |
| 7 | Memory Log entry (if relevant) |
| 8 | Deploy reminder (if 3+ features ready) |

### Rules
- When Claude finishes coding → set **Dev Complete**
- Run full Post-Task Protocol → if Self-QA passes → set **Ready for QA**
- Only Gal moves to **Done** after manual verification
- Build or Security fail → STOP, fix, rerun
- Protocol document owned by Gal — changes only by him

## Notion Integration
- **Development Tasks DB:** https://www.notion.so/25a2ef6028654c6abbe57c6fb97504ed?v=9d21d5dfefd848d1a2b0a087d3202cce
  - **DB ID:** `25a2ef60-2865-4c6a-bbe5-7c6fb97504ed` / Data Source: `453d2402-8c33-4a9a-a6b2-c677a109bc05`
  - **Title:** 🏗 vBrain — Development Layers & Tasks
  - **Columns:** Task (title), Status (Backlog/In Progress/Done/Blocked), Type (Feature/Bug/Tech Debt/Security/QA/Docs/Research), Layer (0-5), Priority (P0-P3), Effort (XS-XXL), Estimate pts (1/2/3/5/8/13), Owner (גל/עידו/Claude/גל+עידו), Date Started, Date Done, Delivers, Depends On, Blocks (self-relation), Notes, Acceptance Criteria, Spec Link, Sprint, Epic, Cycle Time (formula)
  - **Rule — THIS IS THE TASK LIST:** Read it at session start. When starting a task → set Status: In Progress + Date Started. When done → Status: Done + Date Done. Always stay synced.
- **Memory Log DB (לוג עדכונים):** https://www.notion.so/767a33104609471eb5f75f332dc1ff91?v=2d45a4d6307e45269dd48dc7f15f11fe
  - **DB ID:** `767a3310-4609-471e-b5f7-5f332dc1ff91`
  - **Columns:** נושא (title), הסכמה / כלל (rich_text), איך לזהות בשיחה (rich_text), סטטוס (status: Draft/Active/Deprecated), תאריך סיכום (date), איפה זה מיושם (rich_text), ישות מערכת (relation)
  - **Rule:** THIS is the ONLY place for update logs. Never write to the old Memory Log page.
  - **When to WRITE:** After every git commit — add/update rows for what was committed. Fill gaps if any previous entries are missing.
  - **When to READ:** Once per day, or whenever a new session starts — fetch the DB to sync context and avoid duplicates.

## Architecture Notes
- See CLAUDE.md for full architecture
- Admin page (src/app/dashboard/admin/page.tsx) is the system registry — contains all component/route/widget/context metadata inline
- WidgetRegistry.ts is the canonical registry pattern to follow for new registries
- Dev Checklist system added 2026-03-06 — CHANGELOG_CHECKLISTS in admin page

## Key Decisions Log
- 2026-03-06: Chose In-App Component Library approach (over Storybook/Ladle/shadcn registry) for the design system
- 2026-03-06: Added Error Boundaries (dashboard + global)
- 2026-03-06: Dev Checklist system — 5-item quality gate per feature
- 2026-03-07: Senior architect audit — 12 tasks, 11 completed, 1 pending (Sentry)
- 2026-03-07: Sentry + auto-fix pipeline approved — 3 levels (see sentry-pipeline.md)

## ENV Vars — All Set
- All required env vars configured in .env.local

## Removed Features
- 2026-03-09: **Formily page + 3 form widgets** removed (origami-forms, form-submissions, form-scanner). Entity platform replaces Formily for CRUD. Origami sync API routes kept for future n8n integration.
- 2026-03-09: **Formily references fully cleaned** — all 15 references removed from 11 files (nav, shortcuts, search, favorites, audit, i18n, admin data, storyMapData). Zero references remain. Shortcuts renumbered (Cmd+7→Architecture, Cmd+8→Plan).

## Sentry (Installed 2026-03-08)
- **DSN:** configured in .env.local (NEXT_PUBLIC_SENTRY_DSN + SENTRY_DSN)
- **SDK:** @sentry/nextjs installed and wired
- **Files:** sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts, src/instrumentation.ts, src/app/global-error.tsx
- **next.config.ts:** wrapped with withSentryConfig
- **error.tsx:** wired with Sentry.captureException

## Sentry Auto-Fix Pipeline (Next Steps)
- **Blocker:** PAT needs `workflow` scope to push .github/workflows/ci.yml
- **Level 1:** Sentry webhook → n8n → Claude API analyzes error → creates GitHub Issue with diagnosis
- **Level 2:** + Claude reads source file via GitHub API, writes suggested fix code in Issue body
- **Level 3:** + Claude Code SDK spawns agent → reads repo → writes fix → runs tests → opens PR
- **Dependencies:** #81 (DSN) → #82 (install SDK) → #83 (wire error boundaries) → #85 (L1) → #86 (L2) → #87 (L3)
- **Task #84:** Push CI workflow (needs PAT workflow scope)

## Fixes Applied (2026-03-09)
- **Field save feedback:** NoteMeta shows spinner during save, red error on failure (savingField/saveError state)
- **Rectangular layout:** Entity detail page uses full-width 3-column field grid + sidebar tools strip below (columns prop on NoteMeta)
- **AI Hub scroll:** Fixed height constraint `h-[calc(100vh-48px)]` + `min-h-0` + `overflow-hidden` on sidebar — history and chat scroll independently

## Completed Features (2026-03-10)
- **EntityCanvas:** Integrated into entity detail page. 3 modes (Frame/Graph/History), @dnd-kit DnD, Supabase persistence via `meta.__canvas_blocks`, block type picker (folder/field/field_group/note/plugin), field block reads meta values, folder block queries note_relations. Dynamic import for code splitting.

## Known Tech Debt
- **isHe anti-pattern:** 57+ instances of `isHe ? "עברית" : "English"` instead of `t.section.key`. Breaks Russian. Main files: DocumentListView, VersionHistory, TeamWidget, WATIWidget, KPIWidget. Needs gradual i18n migration.
- **console.log in production:** 2 instances in ai-hub/page.tsx (WorkManager action logs, lines ~991/1000). Not harmful, just noisy in DevTools.
- **TODOs:** TeamWidget:44 (Supabase Realtime presence), WATIWidget:33 (real WATI API) — blocked by external deps.

## Future Ideas (from Gal)
- Add button options inside the system + ability to place/mount them (mentioned 2026-03-09)

## Completed Architect Audit (2026-03-07)
- JWT auth on all 9 API routes (src/lib/api/auth.ts)
- Zod validation on AI chat, embeddings (src/lib/api/schemas.ts)
- 43 unit tests: 26 useAutoSave + 17 offlineQueue (vitest)
- Optimistic locking with conflict detection in editor
- Real pgTAP RLS tests (SET LOCAL ROLE, throws_ok)
- Code splitting: 22 dynamic imports in WidgetRegistry + editor + story-map
- Removed puppeteer (350MB), fallback UUIDs, duplicate types
- Widget error boundaries + scoped WeeklyPlannerProvider
- Fixed E2E false positives (removed if(isVisible) wrappers)
- Fixed vb_records trigger (was referencing non-existent updated_at column)
