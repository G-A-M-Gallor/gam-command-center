# ARCHITECTURE.md — vBrain.io

> System architecture snapshot. Read this to understand how everything connects.
> Last verified: 2026-03-10

---

## System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser / PWA)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    NEXT.JS 16 (Vercel)                    │  │
│   │                                                           │  │
│   │   ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│   │   │Dashboard │  │ AI Hub   │  │ Entities │  │  Wiki   │ │  │
│   │   │  Home    │  │ 5 modes  │  │ 6 views  │  │         │ │  │
│   │   └─────────┘  └──────────┘  └──────────┘  └─────────┘ │  │
│   │   ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│   │   │ Editor  │  │Story Map │  │Func Map  │  │ + 8 more│ │  │
│   │   └─────────┘  └──────────┘  └──────────┘  └─────────┘ │  │
│   │                                                           │  │
│   │   ┌──────────────── Top Bar ─────────────────────────┐   │  │
│   │   │  15 widgets (drag, resize, hover, folders)        │   │  │
│   │   └──────────────────────────────────────────────────┘   │  │
│   │                                                           │  │
│   │   ┌──────────── 9 Contexts ──────────────────────────┐   │  │
│   │   │  Auth │ Settings │ Widget │ Canvas │ Shortcuts... │   │  │
│   │   └──────────────────────────────────────────────────┘   │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                    21 API Routes                                 │
│                              │                                   │
├──────────────────────────────┼──────────────────────────────────┤
│                              ▼                                   │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ Supabase │  │  Claude  │  │  Notion  │  │    Sentry    │  │
│   │ DB+Auth  │  │   API    │  │  Tasks   │  │   Tracking   │  │
│   │ Realtime │  │ 5 modes  │  │ Wiki SOT │  │              │  │
│   │ Storage  │  │ 6 agents │  │          │  │              │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│   │ Origami  │  │   n8n    │  │   WATI   │                     │
│   │   CRM    │◄─┤  Glue    │  │ WhatsApp │                     │
│   │(Ops SOT) │  │ Webhooks │  │  Flows   │                     │
│   └──────────┘  └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### UI Layer (Next.js 16 + Turbopack on Vercel)

| Component | תפקיד | קבצים | מחובר ל |
|-----------|-------|-------|---------|
| **DashboardShell** | Layout wrapper — TopBar + Sidebar + content | `DashboardShell.tsx` | SettingsContext, WidgetContext, AuthContext |
| **Sidebar** | Grouped nav, favorites, collapse, dark theme | `Sidebar.tsx` | SettingsContext, i18n, localStorage |
| **TopBar** | Widget grid bar — DnD, resize, folders | `TopBar.tsx`, `WidgetWrapper.tsx` | WidgetContext, DndContext |
| **PageHeader** | Shared header — title, pin-to-favorites, git controls | `PageHeader.tsx` | i18n, custom events |
| **15 Widgets** | Search, AI, Timer, Notifications, KPI, etc. | `widgets/*.tsx` | WidgetRegistry.ts, WidgetContext |
| **MobileBottomBar** | Bottom nav for mobile | `MobileBottomBar.tsx` | SettingsContext |

### Data Layer (Supabase)

| Component | תפקיד | קבצים | מחובר ל |
|-----------|-------|-------|---------|
| **Auth** | GitHub OAuth, JWT tokens, session management | `AuthContext.tsx`, `lib/api/auth.ts` | All API routes |
| **Entity Queries** | CRUD for all entity types | `entityQueries.ts`, `fieldQueries.ts` | Entity pages, API routes |
| **Realtime** | Live updates for docs, stories, funcmap, plan | `*Realtime.ts` (4 files) | Editor, Story Map, FuncMap, Plan |
| **Activity Logger** | Server-side audit trail | `activityLogger.ts` | Entity API, Work Manager |
| **49 Migrations** | Full schema — tables, RLS, triggers, RPCs, views | `supabase/migrations/` | All data operations |

### AI Layer (Claude API)

| Component | תפקיד | קבצים | מחובר ל |
|-----------|-------|-------|---------|
| **Chat Modes** | 4 modes — chat, analyze, write, decompose | `prompts.ts`, `api/ai/chat/route.ts` | AI Hub, AIWidget |
| **Work Manager** | 6 agents — orchestrator, pm, dev, design, qa, strategy | `agentPrompts.ts`, `detectAgent.ts`, `api/work-manager/route.ts` | AI Hub mode 5 |
| **Knowledge Base** | CLAUDE.md injected into system prompts | `knowledgeBase.ts` | Chat route, Work Manager route |
| **Token Budget** | 100K/day limit, atomic RPC check | `tokenTracker.ts`, `aiUsageQueries.ts` | All AI routes |
| **Semantic Search** | pgvector + Voyage AI embeddings | `embeddings.ts`, `api/embeddings/` | SearchWidget |
| **Session Context** | Live data from Supabase injected into prompts | `api/work-manager/route.ts` | Work Manager |

### Entity Platform

| Component | תפקיד | קבצים | מחובר ל |
|-----------|-------|-------|---------|
| **Types & Fields** | Entity type definitions, global field library | `builtinEntityTypes.ts`, `builtinFields.ts`, `types.ts` | All entity pages |
| **6 Views** | Table, Board, List, Calendar, Gantt, Timeline | `components/entities/views/` | Entity list page |
| **Actions** | Action registry, handlers, permission gates | `actionRegistry.ts`, `actionHandlers.ts`, `resolveActions.ts` | Entity detail, bulk bar |
| **EntityCanvas** | Frame/Graph/History modes with DnD | `EntityCanvas.tsx` | Entity detail page |
| **Templates** | Pre-built entity type templates | `TemplatePicker.tsx`, `TemplateEditor.tsx` | Entity type creation |

---

## Data Flows

### Flow 1: User → AI Chat → Response
```
Browser                    Server                     External
  │                          │                           │
  ├─── POST /api/ai/chat ──►│                           │
  │    {messages, mode,      │                           │
  │     contexts}            │                           │
  │                          ├── requireAuth (JWT) ─────►│ Supabase
  │                          ├── checkBudget (RPC) ─────►│ ai_usage table
  │                          ├── loadSessionContext ────►│ session_context
  │                          ├── getKnowledgeContext()   │ (CLAUDE.md cache)
  │                          ├── getTasksSummary() ─────►│ Notion API
  │                          │                           │
  │                          ├── Build system prompt:    │
  │                          │   base + contexts +       │
  │                          │   session + knowledge +   │
  │                          │   notion tasks            │
  │                          │                           │
  │                          ├── Stream to Claude ──────►│ Anthropic API
  │◄── SSE: text chunks ────┤◄── Stream response ──────┤
  │◄── SSE: done + usage ───┤                           │
  │                          ├── updateBudget ──────────►│ Supabase
  └                          └                           └
```

### Flow 2: Origami → n8n → Supabase (Sync)
```
Origami CRM          n8n                    Supabase
  │                    │                       │
  ├── Record change ──►│                       │
  │                    ├── Transform data      │
  │                    ├── POST /api/origami/  │
  │                    │   sync ──────────────►│
  │                    │                       ├── Upsert project
  │                    │                       ├── Calculate health score
  │                    │                       ├── Log activity
  │                    │                       └
  └                    └
```

### Flow 3: Entity CRUD (Create)
```
Browser                    Server                     Supabase
  │                          │                           │
  ├─ POST /api/entities/ ──►│                           │
  │   [type]                 ├── requireAuth ───────────►│
  │   {title, meta, type}   ├── Zod validate            │
  │                          ├── INSERT note_records ───►│
  │                          ├── Apply system fields ───►│
  │                          ├── Log activity ──────────►│ activity_log
  │◄── {id, ...entity} ────┤                           │
  │                          │                           │
  │  (Realtime subscription) │                           │
  │◄─────── UPDATE event ───┤◄── Broadcast ────────────┤
  └                          └                           └
```

### Flow 4: Work Manager Agent Routing
```
User message
  │
  ├── detectAgent(message)
  │     ├── keyword: "בדיקה/QA/test"     → qa agent (Haiku)
  │     ├── keyword: "עיצוב/UI/design"    → design agent (Sonnet)
  │     ├── keyword: "קוד/debug/API"      → dev agent (Sonnet)
  │     ├── keyword: "משימות/sprint"       → pm agent (Sonnet)
  │     ├── keyword: "אסטרטגיה/ROI"       → strategy agent (Sonnet)
  │     └── default                        → orchestrator (Sonnet)
  │
  ├── buildAgentSystemPrompt()
  │     ├── Agent-specific prompt
  │     ├── Session context (projects, tasks, decisions)
  │     ├── Notion tasks summary
  │     ├── Current view info
  │     └── GAM Knowledge Base (CLAUDE.md)
  │
  └── Stream response with ACTION:{} blocks
        └── ActionPreview → user confirms → /api/work-manager/execute
```

### Flow 5: Widget Lifecycle
```
TopBar mount
  │
  ├── Load positions from localStorage (cc-widget-positions)
  ├── Load sizes from localStorage (cc-widget-sizes)
  ├── Render WidgetWrapper for each visible widget
  │     ├── BarContent (icon + label in 48px cell)
  │     ├── On hover/click → open Panel (dropdown/modal/side-panel)
  │     └── Error boundary wraps each widget
  │
  ├── Drag: DndContext with 5px activation, grid-snap, overlap rejection
  ├── Resize: 1x/2x/3x/4x via WidgetSettings
  └── Folders: group widgets, FolderWrapper renders children
```

---

## What's Not Connected Yet

| Gap | Details | Blocks |
|-----|---------|--------|
| **Origami ↔ Supabase full sync** | API routes exist, n8n workflows not deployed. Projects table mostly empty. | Needs ORIGAMI_API_KEY + n8n deployment |
| **WATI real API** | WATIWidget is iframe placeholder, no real API calls | Needs NEXT_PUBLIC_WATI_URL + WATI API key |
| **TeamWidget presence** | TODO — needs Supabase Realtime Presence | Supabase config |
| **Sentry auto-fix pipeline** | L1-L3 not built. Needs PAT with workflow scope for CI. | PAT permissions |
| **CI/CD pipeline** | ci.yml removed (PAT scope). No automated tests on PR. | PAT permissions |
| **n8n iframe** | Automations page has iframe but NEXT_PUBLIC_N8N_URL not set | ENV var |
| **vb_ai_memory table** | Exists in Supabase, nothing reads/writes it. Knowledge now from filesystem. | Can be dropped |
| **Google Calendar** | /api/events/today exists but no OAuth flow for real calendar | Google OAuth setup |

---

## Key Architectural Decisions

| # | Decision | Why | Date |
|---|----------|-----|------|
| 1 | Dark mode only | Target users (GAM team) prefer dark. Simplifies CSS. | 2026-03-02 |
| 2 | Supabase = mirror, Origami = SOT | Origami is operational truth. Supabase gives fast reads + Realtime. | 2026-03-02 |
| 3 | In-app component library (not Storybook) | Faster to build, no separate deploy, embedded in design-system page. | 2026-03-06 |
| 4 | 6 AI agents (not 1 general) | Better response quality via specialized prompts per domain. | 2026-03-09 |
| 5 | Knowledge from filesystem (not DB) | CLAUDE.md is in repo, deploys with build, no extra sync needed. 95% principle. | 2026-03-10 |
| 6 | execFileSync (not execSync) | Prevents shell injection in git commands. | 2026-03-06 |
| 7 | Server-side token budget | Prevents client-side bypass. Atomic RPC prevents race conditions. | 2026-03-06 |
| 8 | Entity platform replaces Formily | Generic entity CRUD better than dedicated form builder. | 2026-03-09 |

---

> Updated: 2026-03-10 | Source: code scan + git log + CLAUDE.md
