# GAM Command Center — AI Guide

> This file is read by the internal AI assistant on every conversation.
> It's also read by Claude Code at session start.
> Last updated: 2026-03-10

---

## Who Am I

**vBrain.io / GAM Command Center (CC)** — Internal project management dashboard for **G.A.M**, a business services company in Israel's construction industry.

- **Repo:** `G-A-M-Gallor/vBrain.io`
- **Stack:** Next.js 16.1.6 (Turbopack) on Vercel
- **DB:** Supabase (Auth, Realtime, Storage, 49 migrations)
- **AI:** Claude API (5 chat modes + 6 Work Manager agents)
- **Operational SOT:** Origami CRM (synced via n8n)
- **Knowledge SOT:** Notion (specs, procedures, roadmap)
- **Team:** Gal (CEO/architect), Claude (AI dev), n8n (automation)
- **Scale:** 16 pages, 15 widgets, 21 API routes, 9 contexts, 291 source files
- **Built in:** 11 days (2026-02-28 → 2026-03-10), 91 commits

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
  ├── Supabase (DB + Auth + Realtime)
  │     ├── Mirror tables (projects, entities, docs, stories)
  │     ├── RLS policies (hardened)
  │     ├── 49 migrations (triggers, RPCs, views, audit)
  │     └── Realtime channels (editor, story map, funcmap, plan)
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
| Auth (GitHub OAuth + JWT + allowlist) | ✅ | `AuthContext.tsx`, `lib/api/auth.ts` |
| Security (Zod validation, RLS, execFileSync) | ✅ | `lib/api/schemas.ts`, migrations |
| i18n (Hebrew + English + Russian, 5514 lines) | ✅ | `lib/i18n.ts` |
| Supabase (49 migrations, Realtime, audit log) | ✅ | `supabase/migrations/` |
| PWA (Service Worker, offline, push, install) | ✅ | `lib/pwa/` |
| Sentry (error tracking, boundaries) | ✅ | `sentry.*.config.ts` |
| Code Splitting (22 dynamic imports) | ✅ | `WidgetRegistry.ts` |
| Tests (43 unit tests, vitest) | ✅ | `__tests__/` |

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

---

## What NOT to Build

- Form Builder from scratch — use Origami native + Jotform
- Dynamic architecture viz — Mermaid in Notion
- Full roadmap tool — Notion Projects handles this
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
| `vb_ai_memory` table | Supabase table exists, no code uses it. Can be dropped. | Low |
| `console.log` in prod | 2 instances in ai-hub/page.tsx | Low |
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
