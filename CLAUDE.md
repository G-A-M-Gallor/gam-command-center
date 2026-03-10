# CLAUDE.md — GAM Command Center

> Context file for Claude Code. Read this before every session.

## 🎯 Project Overview

**GAM Command Center (CC)** — Internal project management dashboard for G.A.M, a business services company in Israel's construction industry.

- **Repo:** `G-A-M-Gallor/vBrain.io` — Next.js 16.1.6 (Turbopack) on Vercel
- **Branch:** `main`
- **Route:** `/dashboard` (route group)
- **Status:** 16 pages, 15 widgets, 21 API routes, 9 contexts — all active

## 🏗️ Architecture — Who Does What

| Layer | Tool | Role | Does NOT do |
|-------|------|------|-------------|
| **UI** | Next.js + Vercel | Dashboard, editor, forms, viz | DB, business logic |
| **DB + API** | Supabase | Mirror tables, Auth, Realtime, CRUD | Not operational SOT |
| **Operational SOT** | Origami CRM | Clients, entities, statuses, pipeline | Not wiki, not knowledge |
| **Knowledge SOT** | Notion | Specs, procedures, decisions, roadmap | Not task manager |
| **Automation** | n8n | Sync Origami↔Supabase, webhooks, alerts | Not SOT |
| **Messaging** | WATI | WhatsApp flows, chatbot, data collection | Not DB |

**Key principle:** Origami = source of truth for operations. Supabase = mirror for fast UI reads. n8n = glue.

## 📁 Folder Structure

```
app/dashboard/
  layout.tsx              ← DashboardShell + Sidebar + TopBar + dark theme
  page.tsx                ← Dashboard home — stat cards, recent projects, events, quick actions
  layers/
    page.tsx              ← Projects list with health scores, search, filters, sort
    [id]/page.tsx         ← Project detail — docs, story cards, health
  editor/
    page.tsx              ← Document list + Canvas block editor
    [id]/page.tsx         ← Edit specific document
  story-map/
    page.tsx              ← 3-tier drag-and-drop story map (epics → features → stories)
  functional-map/
    page.tsx              ← 3×5 locked grid with inline editing
  ai-hub/
    page.tsx              ← AI assistant with 5 modes (chat/analyze/write/decompose/work)
  design-system/
    page.tsx              ← Gallery + Components + Handbook + App Preview + Library tabs
    LibraryTab.tsx        ← Component browser (127 components from shadcn/Magic UI/21st.dev)
    libraryRegistry.ts    ← Static catalog of all available components
  entities/
    page.tsx              ← Entity home — list of entity types with counts
    fields/page.tsx       ← Global field library
    types/page.tsx        ← Entity types manager
    [type]/page.tsx       ← Entity list view — table/board/list/calendar/gantt/timeline
    [type]/[id]/page.tsx  ← Entity detail — editable title, NoteMeta, stakeholders, activity
  wiki/
    page.tsx              ← Wiki page list + search
    [slug]/page.tsx       ← Wiki page viewer
  architecture/
    page.tsx              ← Mermaid diagram + 6-tool stack table
  plan/
    page.tsx              ← 5-phase roadmap with timeline
  automations/
    page.tsx              ← n8n iframe + Supabase automation types with code examples
  settings/
    page.tsx              ← Accent colors, fonts, skins, density, brand profile, style overrides
  admin/
    page.tsx              ← System registry — routes, widgets, contexts, changelog, dev checklist
    data.ts               ← All registry data (routes, widgets, contexts, changelog entries)
    types.ts              ← TypeScript types for registry entries

components/command-center/
  DashboardShell.tsx      ← Wraps TopBar + Sidebar + content area
  Sidebar.tsx             ← Tab navigation with favorites, collapse, dark theme
  TopBar.tsx              ← Widget grid bar with DndContext, drag handlers
  PageHeader.tsx          ← Shared header for all dashboard pages with pin-to-favorites
  HealthBadge.tsx         ← 🟢🟡🔴 project health indicator
  ProjectCard.tsx         ← Project list item with health, layer, status
  StoryBoard.tsx          ← Story map board container
  StoryCard.tsx           ← Draggable story map card
  StoryColumn.tsx         ← Story map column
  ColorPicker.tsx         ← Color picker for settings
  EditToolbar.tsx         ← Editor toolbar
  widgets/                ← 15 widget files (see Widget System below)
  ../work-manager/
    ActionPreview.tsx     ← Action confirmation card for Work Manager

contexts/
  SettingsContext.tsx      ← Language, sidebar, accent color, fonts, skins, density, brand
  WidgetContext.tsx        ← Widget positions, sizes, placements, hover delay, folders
  StyleOverrideContext.tsx ← Per-element style overrides
  CanvasContext.tsx        ← Canvas editor state
  DashboardModeContext.tsx ← Dashboard mode switching
  ShortcutsContext.tsx     ← Keyboard shortcuts
  WeeklyPlannerContext.tsx ← Weekly planner widget state
  AuthContext.tsx          ← Supabase auth state
  ToastContext.tsx         ← Toast notifications

lib/
  i18n.ts                 ← All translations (he/en/ru) — ~3200 lines
  supabaseClient.ts       ← Browser Supabase client
  supabase/server.ts      ← Server-side Supabase client (for API routes)
  api/auth.ts             ← requireAuth helper (Bearer token validation)
  api/schemas.ts          ← Zod schemas (aiChat, embeddings, gitCommit, gitDeploy)
  utils/timeAgo.ts        ← Shared time formatting utility (he/en/ru)
  work-manager/parseAction.ts  ← Parse ACTION:{} blocks from Work Manager responses
```

## 🗄️ Supabase Schema

```sql
-- Projects (synced from Origami via n8n)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origami_id TEXT UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  health_score INT DEFAULT 0,       -- 0-100
  layer TEXT,                        -- infrastructure/product/client
  source TEXT,                       -- claude/manual/trigger
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents (Canvas editor — renamed from vb_records)
CREATE TABLE vb_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  content JSONB,                     -- Canvas JSON format
  record_type TEXT,
  status TEXT,
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Story Map Cards
CREATE TABLE story_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  col INT NOT NULL,
  row INT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'story',         -- epic/story
  color TEXT,
  subs JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Conversations
CREATE TABLE ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  model TEXT DEFAULT 'claude',
  mode TEXT DEFAULT 'chat',          -- chat/analyze/write/decompose
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Functional Map Cells
CREATE TABLE functional_map_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,               -- strategy/management/operations
  func TEXT NOT NULL,                -- one of 5 functions
  owner TEXT, tools TEXT[], status TEXT, description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, title TEXT, body TEXT, type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🎨 Design Conventions

- **UI Language:** Hebrew/English/Russian — togglable via Settings. All text through `lib/i18n.ts` keys (no hardcoded `isHe ? "..." : "..."`)
- **Theme:** Dark mode only
- **Colors:** Slate-900 bg, purple/blue accents, emerald/amber/red for status. CSS variables for accent colors
- **CSS:** Tailwind CSS + CSS variables in `styles/components.css`
- **Components:** shadcn/ui as base, customized for dark theme
- **Icons:** Lucide React
- **Fonts:** Inter / Geist / System — configurable in settings
- **RTL:** Use `dir={isRtl ? "rtl" : "ltr"}`, `text-start` (not `text-left`), `ms-auto` (not `ml-auto`)
- **Layout:** Fixed sidebar (240px, collapsible) + TopBar (48px) + scrollable content area

## 🔧 Coding Conventions

- **Language:** TypeScript strict mode
- **Framework:** Next.js 16 App Router (server components by default)
- **Middleware:** Uses `src/proxy.ts` with `export function proxy()` (Next.js 16 convention, NOT `middleware.ts`)
- **State:** Supabase Realtime for live data, React state for UI
- **API routes:** Must use server-side Supabase client (`@/lib/supabase/server`), NOT browser client. Auth via `requireAuth` (Bearer) or cookie-based `createClient` + `getUser()`.
- **Validation:** Zod schemas in `lib/api/schemas.ts` for all POST routes
- **Naming:** PascalCase components, camelCase functions, kebab-case files
- **Imports:** Use `@/` alias (already configured in tsconfig)
- **Error handling:** Try/catch with proper HTTP status codes (not 200 for errors)
- **Auth:** Supabase Auth (configured in repo)
- **Security:** `execFileSync` (not `execSync`) for git commands — prevents shell injection
- **i18n:** Always use `t.section.key` pattern — never `isHe ? "..." : "..."` for translatable text
- **Cross-component sync:** Custom DOM events (`cc-favorites-change`, `cc-notify`, `timer-state-change`, etc.)

## 📋 16 Dashboard Pages

| # | Tab | Route | Status | Notes |
|---|-----|-------|--------|-------|
| 0 | **Dashboard** | `/dashboard` | Active | Home — stat cards, recent projects, events, quick actions |
| 1 | **Layers** | `/dashboard/layers` | Active | Projects list, health scores, search/filter/sort |
| 2 | **Editor** | `/dashboard/editor` | Active | Canvas block editor, templates, export, version history |
| 3 | **Story Map** | `/dashboard/story-map` | Active | 3-tier drag-and-drop with Realtime sync |
| 4 | **Functional Map** | `/dashboard/functional-map` | Active | 3×5 locked grid with inline editing |
| 5 | **AI Hub** | `/dashboard/ai-hub` | Active | Claude API with 5 modes (chat/analyze/write/decompose/work), streaming |
| 6 | **Design System** | `/dashboard/design-system` | Active | Gallery, components, handbook, app preview, library (127 components) |
| 7 | **Entities** | `/dashboard/entities` | Active | Entity home — list of types with counts |
| 7a | | `/dashboard/entities/fields` | Active | Global field library |
| 7b | | `/dashboard/entities/types` | Active | Entity types manager |
| 7c | | `/dashboard/entities/[type]` | Active | Entity list — table/board/list/calendar/gantt/timeline views |
| 7d | | `/dashboard/entities/[type]/[id]` | Active | Entity detail — fields, canvas, stakeholders, activity, comments |
| 8 | **Wiki** | `/dashboard/wiki` | Active | Wiki pages + search |
| 9 | **Architecture** | `/dashboard/architecture` | Active | Mermaid diagram + tool stack table |
| 10 | **Plan** | `/dashboard/plan` | Active | 5-phase roadmap with timeline |
| 11 | **Automations** | `/dashboard/automations` | Active | n8n iframe + Supabase automation types |
| 12 | **Settings** | `/dashboard/settings` | Active | Accent, fonts, skins, density, brand, overrides |
| 13 | **Admin** | `/dashboard/admin` | Active | System registry — routes, widgets, contexts, changelog |

## 🔲 Top Bar Widget System

The top bar is a fixed 48px bar above the content area. It holds a grid of drag-to-place widgets.

### Structure
- **TopBar** (`components/command-center/TopBar.tsx`) — fixed bar with grid layout, DndContext, ResizeObserver
- **DashboardShell** (`components/command-center/DashboardShell.tsx`) — wraps TopBar + Sidebar + content area
- Bar divides into 48px columns. Widgets occupy `size` columns at a stored grid position
- Widgets can be dragged to any empty grid slot (overlap is rejected, widget snaps back)
- Grid guides + purple/red drop-target highlight appear during drag
- `+` button at the end opens the Widget Store

### Widget Framework
- **Sizes:** 1x (icon only), 2x, 3x, 4x — each unit = 48px. Configurable per widget in edit mode
- **Hover:** Configurable delay (0.1–3s or disabled). Hovering opens the dropdown panel
- **Click:** Opens/closes the dropdown panel (or triggers modal/side-panel for special widgets)
- **Edit:** Pencil icon in panel header opens WidgetSettings (size, visibility, hover delay)
- **Drag:** 5px activation distance, grid-snap positioning, overlap validation
- **Panel modes:** `dropdown` (default, positioned near widget), `modal` (centered overlay), `side-panel` (full-height sliding panel)
- **Folders:** Widgets can be grouped into folders in the top bar
- **Error boundaries:** Each widget wrapped in per-widget error boundary
- Widget dropdown panels respect both sidebar and AI panel boundaries

### 15 Active Widgets

| ID | Icon | Size | Panel Mode | File | Category |
|----|------|------|------------|------|----------|
| `search` | Search | 2x | modal | `SearchWidget.tsx` | core |
| `ai-assistant` | Bot | 1x | side-panel | `AIWidget.tsx` | core |
| `quick-create` | Plus | 2x | dropdown | `QuickCreateWidget.tsx` | core |
| `favorites` | Pin | 1x | dropdown | `FavoritesWidget.tsx` | core |
| `today` | Calendar | 2x | dropdown | `TodayWidget.tsx` | core |
| `notifications` | Bell | 1x | dropdown | `NotificationsWidget.tsx` | core |
| `timer` | Clock | 2x | dropdown | `TimerWidget.tsx` | core |
| `clipboard` | ClipboardList | 1x | dropdown | `ClipboardWidget.tsx` | core |
| `settings` | Settings | 1x | dropdown | `SettingsWidget.tsx` | core |
| `keyboard-shortcuts` | Command | 1x | modal | `ShortcutsWidget.tsx` | tools |
| `weekly-planner` | CalendarDays | 2x | modal | `WeeklyPlannerWidget.tsx` | tools |
| `kpi` | BarChart3 | 2x | dropdown | `KPIWidget.tsx` | data |
| `shortcuts` | ExternalLink | 1x | dropdown | `ExternalLinksWidget.tsx` | tools |
| `wati` | MessageSquare | 2x | dropdown | `WATIWidget.tsx` | communication |
| `team` | Users | 2x | dropdown | `TeamWidget.tsx` | communication |

### Widget File Structure
```
components/command-center/widgets/
  WidgetRegistry.ts       ← All 15 widget definitions with dynamic imports (code splitting)
  WidgetWrapper.tsx        ← Renders bar content + dropdown panel, handles hover/click/drag
  WidgetSettings.tsx       ← Size/visibility/hover-delay editor (modal)
  WidgetStore.tsx          ← Widget browser with categories — replaces WidgetLibrary
  [15 widget .tsx files]   ← Each exports Panel + BarContent components
```

### Key Patterns
- **Settings** — language, sidebar position, accent, fonts, skins managed via Settings page + Settings widget
- **PageHeader** (`components/command-center/PageHeader.tsx`) — shared header for all dashboard pages with pin-to-favorites + Git buttons (dev only)
- **i18n** — all labels in Hebrew + English + Russian (`lib/i18n.ts`)
- **localStorage keys:** `cc-widget-positions`, `cc-widget-sizes`, `cc-widget-placements`, `cc-widget-hover-delay`, `cc-folders`
- **Custom events** for cross-component sync: `cc-favorites-change`, `cc-notify`, `timer-state-change`, `notifications-change`, `clipboard-change`, `cc-open-ai`, `cc-ai-prefill`
- **AI panel** always opens on the opposite side of the sidebar
- **Code splitting:** All 15 widgets use `next/dynamic` imports in WidgetRegistry.ts

## 🔌 API Routes (21)

| Route | Method | Auth | Validation | Purpose |
|-------|--------|------|------------|---------|
| `/api/ai/chat` | POST | requireAuth | Zod | Claude API streaming chat (5 modes) |
| `/api/embeddings/generate` | POST | requireAuth | Zod | Generate document embeddings |
| `/api/embeddings/search` | POST | requireAuth | Zod | Semantic search |
| `/api/entities/[type]` | GET/POST/PATCH | requireAuth | Zod | Entity list CRUD + bulk ops |
| `/api/entities/[type]/[id]` | GET/PATCH/DELETE | requireAuth | — | Single entity CRUD |
| `/api/entities/[type]/[id]/comments` | POST | requireAuth | Zod | Entity comments |
| `/api/events/today` | GET | cookie | — | Today's calendar events |
| `/api/git/commit` | POST | requireAuth | Zod | Git commit (dev only) |
| `/api/git/deploy` | POST | requireAuth | Zod | Git commit + push (dev only) |
| `/api/git/status` | GET | requireAuth | — | Git status info |
| `/api/health` | GET | public | — | System healthcheck |
| `/api/installed-components` | GET | cookie | — | List installed UI components |
| `/api/notifications` | GET/POST/PATCH | requireAuth | Zod | Notification CRUD |
| `/api/notion/tasks` | POST | requireAuth | Zod | Sync tasks to Notion |
| `/api/origami/entities` | GET | cookie | — | Origami CRM entities |
| `/api/origami/sync` | POST | webhook key | — | Origami→Supabase sync |
| `/api/push/send` | POST | webhook key | — | Send push notification |
| `/api/push/subscribe` | POST | requireAuth | Zod | Register push subscription |
| `/api/push/subscribers` | GET | requireAuth | — | List push subscribers |
| `/api/system/snapshot` | GET | requireAuth | — | System info snapshot |
| `/api/weekly-planner` | GET/PUT | cookie | — | Weekly planner data |
| `/api/work-manager` | POST | requireAuth | Zod | Work Manager streaming chat |
| `/api/work-manager/execute` | POST | requireAuth | Zod | Execute Work Manager actions |

## ✅ Dev Checklist — Mandatory Per Feature

Every changelog entry in `/dashboard/admin` must complete 5 items:

| # | Item | What to do |
|---|------|------------|
| 1 | **Guide Content** | Add `data-cc-id` + `styleOverrideRegistry` + i18n for the feature's UI elements |
| 2 | **Usage Doc** | Fill `purpose` + `notes` fields comprehensively in the changelog entry |
| 3 | **Diagram** | Populate `connectedTo` array — feature must appear in the Mermaid architecture diagram |
| 4 | **AI Source of Truth** | Write comprehensive `purpose` field; add reference in CLAUDE.md if architectural |
| 5 | **Conflict Review** | Check dependencies, contexts, localStorage keys, custom events for conflicts |

**Checklist data** lives in `CHANGELOG_CHECKLISTS` in `src/app/dashboard/admin/data.ts`. When adding a new feature, add its checklist entry with honest assessment.

## ⚠️ What NOT to Build

- ❌ Form Builder from scratch — use Origami native + Jotform
- ❌ Dynamic architecture viz — Mermaid in Notion
- ❌ Full roadmap tool — Notion Projects handles this
- ❌ Custom auth — Supabase Auth already in repo
- ❌ Multi-theme — dark mode only

## 🔑 Important Context

- **Origami entity names** can also be folder names — always clarify which
- **GAM Functional Map:** 3 levels × 5 functions — LOCKED structure, never modify
- **95% Principle:** If a 30-second manual step works, don't over-automate. 95% automated + small manual step = perfect
- **Evidence culture:** GAM documents everything — every client interaction is potential legal evidence
- **Hebrew content:** All user-facing text should support RTL. UI chrome can be English
- **Admin data.ts** is the single source of truth for system registry — keep it in sync when adding features

## 🔑 Pending ENV Vars

- `ORIGAMI_API_KEY` + `ORIGAMI_BASE_URL` — Origami CRM integration
- `NEXT_PUBLIC_WATI_URL` — WATI WhatsApp widget
- `NEXT_PUBLIC_N8N_URL` — Automations page iframe

> Sentry DSN is configured and active.

## 🤖 AI Reading Guide

When starting a new session, read in this order:

1. **This file** (`CLAUDE.md`) — architecture, conventions, what NOT to build
2. **`memory/MEMORY.md`** — decisions, preferences, workflow, completed work
3. **`memory/FEATURE_INDEX.md`** — comprehensive feature inventory with all routes, components, APIs
4. **`memory/qa-checklist.md`** — Self-QA phases 1-5 (run after every task)
5. **`memory/post-task-protocol.md`** — pointer to full 8-step protocol in Notion

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

## 📱 Mobile Pending

No mobile app yet. Features to test when mobile app ships:
- EntityCanvas — DnD touch events
- Story Map — DnD touch events
- Wiki page viewer — responsive layout
- Push notifications — real device testing

## 🐛 Known Issues

| Issue | Location | Priority |
|-------|----------|----------|
| `isHe` anti-pattern | 57+ instances across widgets, editor, story map | Medium — gradual i18n migration |
| vb_ai_memory table | Supabase table exists, no code reads from it | Low |
| AI Hub prompts generic | No GAM-specific knowledge injected | Medium |
| console.log in prod | 2 instances in ai-hub/page.tsx | Low |
| TeamWidget TODO | Needs Supabase Realtime Presence | Blocked |
| WATIWidget TODO | Needs real WATI API | Blocked |
| Sentry auto-fix pipeline | L1-L3 not built (needs PAT workflow scope) | Medium |

## 📎 References

- **Notion Project:** https://www.notion.so/3158f27212f881639507feab50d68d44
- **Post-Task Protocol:** https://www.notion.so/31f8f27212f881fca47ce9680e169931
- **Production Plan:** See `cc-production-plan.md` in repo
- **Prototype Source:** V8 Step 4 artifact (92K single-file React)
