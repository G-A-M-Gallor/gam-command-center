# CLAUDE.md — GAM Command Center

> Context file for Claude Code. Read this before every session.

## 🎯 Project Overview

**GAM Command Center (CC)** — Internal project management dashboard for G.A.M, a business services company in Israel's construction industry.

- **Repo:** `G-A-M-Gallor/vBrain.io` — Next.js 15.5.1 on Vercel
- **Branch:** `feature/command-center`
- **Route:** `/dashboard` (new route group)
- **Prototype:** V8 Step 4 — React single-file, 92K, 9 working tabs

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

## 📁 Target Folder Structure

```
app/
  dashboard/
    layout.tsx          ← Sidebar + tab navigation + dark theme
    page.tsx            ← Default tab (Layers)
    layers/
      page.tsx          ← Projects list + health scores
    editor/
      page.tsx          ← Tiptap document editor
      [id]/page.tsx     ← Edit specific document
    story-map/
      page.tsx          ← Story Map board
    functional-map/
      page.tsx          ← 3×5 locked grid (Notion-powered)
    ai-hub/
      page.tsx          ← AI chat with modes
    design-system/
      page.tsx          ← Component showcase
    formily/
      page.tsx          ← Form management (Origami native)
    architecture/
      page.tsx          ← Tool map visualization
    plan/
      page.tsx          ← Roadmap (Notion-powered)

components/
  command-center/
    Sidebar.tsx         ← Tab navigation, dark theme
    HealthBadge.tsx     ← 🟢🟡🔴 project health
    ProjectCard.tsx     ← Project list item
    StoryCard.tsx       ← Draggable story map card
    AIChat.tsx          ← Chat interface with mode selector
    TemplateLibrary.tsx ← Document templates grid
    TiptapEditor.tsx    ← Block editor wrapper

lib/
  supabase/
    schema.ts           ← Type definitions from Supabase
    queries.ts          ← Reusable query functions
  ai/
    prompts.ts          ← System prompts per AI mode
    client.ts           ← Claude API wrapper
  utils/
    health.ts           ← Health score calculation
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

-- Documents (Tiptap editor)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  content JSONB,                     -- Tiptap JSON format
  template_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Document Templates
CREATE TABLE doc_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  category TEXT,                     -- פיתוח/ניהול/אסטרטגיה
  content JSONB,                     -- Tiptap JSON blocks
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
  mode TEXT DEFAULT 'chat',          -- chat/analyze/write/decompose/mcp
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🎨 Design Conventions

- **UI Language:** All UI is Hebrew RTL by default. Users can toggle Hebrew/English and sidebar position (right/left) via the Settings widget in the top bar; preferences persist in localStorage.
- **Theme:** Dark mode only (matching prototype)
- **Colors:** Slate-900 bg, purple/blue accents, emerald/amber/red for status
- **CSS:** Tailwind CSS (already in repo) + CSS variables in `styles/components.css`
- **Components:** shadcn/ui as base, customize with dark theme
- **Icons:** Lucide React
- **Fonts:** Inter (already configured)
- **RTL:** Support Hebrew text direction where needed
- **Layout:** Fixed sidebar (240px) + scrollable content area

## 🔧 Coding Conventions

- **Language:** TypeScript strict mode
- **Framework:** Next.js 15 App Router (server components by default)
- **State:** Supabase Realtime for live data, React state for UI
- **API:** Route handlers in `app/api/` — no external API framework
- **Naming:** PascalCase components, camelCase functions, kebab-case files
- **Imports:** Use `@/` alias (already configured in tsconfig)
- **Error handling:** Try/catch with Supabase error types
- **Auth:** Supabase Auth (already configured in repo)

## 📋 9 Tabs — Build Priority

| # | Tab | Phase | Complexity | Notes |
|---|-----|-------|-----------|-------|
| 1 | **Layers** | Phase 1 | Medium | Projects list, health scores, sync from Origami |
| 2 | **Editor** | Phase 2 | High | Tiptap integration, templates, save/load |
| 3 | **Story Map** | Phase 3 | High | Drag & drop (@dnd-kit), cards, subs |
| 4 | **Functional Map** | Phase 5 | Low | Static 3×5 grid, data from Notion API |
| 5 | **AI Hub** | Phase 4 | High | Claude API, modes, streaming, context injection |
| 6 | **Design System** | Phase 5 | Low | Storybook or simple showcase page |
| 7 | **Formily** | Phase 5 | Low | Origami native forms — no custom builder |
| 8 | **Architecture** | Phase 5 | Low | Static page + Mermaid from Notion |
| 9 | **Plan** | Phase 5 | Low | Notion-powered roadmap view |

## 🔲 Top Bar Widget System

The top bar is a fixed 48px bar above the content area. It holds a grid of drag-to-place widgets.

### Structure
- **TopBar** (`components/command-center/TopBar.tsx`) — fixed bar with grid layout, DndContext, ResizeObserver
- **DashboardShell** (`components/command-center/DashboardShell.tsx`) — wraps TopBar + Sidebar + content area
- Bar divides into 48px columns. Widgets occupy `size` columns at a stored grid position
- Widgets can be dragged to any empty grid slot (overlap is rejected, widget snaps back)
- Grid guides + purple/red drop-target highlight appear during drag
- `+` button at the end opens the Widget Library

### Widget Framework
- **Sizes:** 1x (icon only), 2x, 3x, 4x — each unit = 48px. Configurable per widget in edit mode
- **Hover:** Configurable delay (0.1–3s or disabled). Hovering opens the dropdown panel
- **Click:** Opens/closes the dropdown panel (or triggers modal/side-panel for special widgets)
- **Edit:** Pencil icon in panel header opens WidgetSettings (size, visibility, hover delay)
- **Drag:** 5px activation distance, grid-snap positioning, overlap validation
- **Panel modes:** `dropdown` (default, positioned near widget), `modal` (centered overlay), `side-panel` (full-height sliding panel)
- Widget dropdown panels respect both sidebar and AI panel boundaries (won't render behind them)

### Active Widgets

| ID | Icon | Default Size | Panel Mode | File |
|----|------|-------------|------------|------|
| `search` | Search | 2x | modal | `SearchWidget.tsx` |
| `ai-assistant` | Bot | 1x | side-panel | `AIWidget.tsx` |
| `quick-create` | Plus | 2x | dropdown | `QuickCreateWidget.tsx` |
| `favorites` | Pin | 1x | dropdown | `FavoritesWidget.tsx` |
| `today` | Calendar | 2x | dropdown | `TodayWidget.tsx` |
| `notifications` | Bell | 1x | dropdown | `NotificationsWidget.tsx` |
| `timer` | Clock | 2x | dropdown | `TimerWidget.tsx` |
| `clipboard` | ClipboardList | 1x | dropdown | `ClipboardWidget.tsx` |
| `settings` | Settings | 1x | dropdown | `SettingsWidget.tsx` |

### Future Widgets (coming-soon in library)
- `wati` — WATI WhatsApp messages
- `team` — Team status (who's online)
- `kpi` — Quick KPI metrics
- `shortcuts` — Quick links to external tools

### Widget File Structure
```
components/command-center/
  TopBar.tsx              ← Grid layout, DndContext, drag handlers
  widgets/
    WidgetRegistry.ts     ← All widget definitions (id, icon, label, size, status, component)
    WidgetWrapper.tsx      ← Renders bar content + dropdown panel, handles hover/click/drag
    WidgetSettings.tsx     ← Size/visibility/hover-delay editor (modal)
    WidgetLibrary.tsx      ← Widget browser — "Active" + "Coming Soon" sections
    SearchWidget.tsx       ← Cmd+K spotlight search (modal mode)
    AIWidget.tsx           ← AI chat — 3 view modes: side-panel, dropdown, floating bubble
    QuickCreateWidget.tsx  ← Create document/project/task
    FavoritesWidget.tsx    ← Pinned pages with drag reorder
    TodayWidget.tsx        ← Meetings, deadlines, reminders
    NotificationsWidget.tsx← Notifications with read/unread, red dot badge
    TimerWidget.tsx        ← Pomodoro timer with circular progress
    ClipboardWidget.tsx    ← Copy history within dashboard
    SettingsWidget.tsx     ← Language, sidebar position, visibility
contexts/
  WidgetContext.tsx        ← Persists widget positions, sizes, hidden state, hover delay
```

### Key Patterns
- **Settings moved from sidebar footer to Settings widget** — language, sidebar position, and visibility are now controlled via the Settings widget in the top bar
- **PageHeader** (`components/command-center/PageHeader.tsx`) — shared header for all 9 dashboard pages with pin-to-favorites button
- **i18n** — all widget labels/descriptions in Hebrew + English (`lib/i18n.ts`)
- **localStorage keys:** `cc-widget-positions`, `cc-widget-sizes`, `cc-hidden-widgets`, `cc-widget-hover-delay`
- **Custom events** for cross-component sync: `timer-state-change`, `notifications-change`, `clipboard-change`
- **AI panel** always opens on the opposite side of the sidebar

## ✅ Dev Checklist — Mandatory Per Feature

Every changelog entry in `/dashboard/admin` must complete 5 items:

| # | Item | What to do |
|---|------|------------|
| 1 | **Guide Content** | Add `data-cc-id` + `styleOverrideRegistry` + i18n for the feature's UI elements |
| 2 | **Usage Doc** | Fill `purpose` + `notes` fields comprehensively in the changelog entry |
| 3 | **Diagram** | Populate `connectedTo` array — feature must appear in the Mermaid architecture diagram |
| 4 | **AI Source of Truth** | Write comprehensive `purpose` field; add reference in CLAUDE.md if architectural |
| 5 | **Conflict Review** | Check dependencies, contexts, localStorage keys, custom events for conflicts |

**Checklist data** lives in `CHANGELOG_CHECKLISTS` in `src/app/dashboard/admin/page.tsx`. When adding a new feature, add its checklist entry with honest assessment.

**Scoring:** Each feature gets 0-5. Overall percentage shown in the stats row and the collapsible summary panel in the Changelog tab.

## ⚠️ What NOT to Build

- ❌ Form Builder from scratch — use Origami native + Jotform
- ❌ Complex Design System UI — CSS vars + Tailwind config suffice
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

## 🚀 Phase 1 Checklist (Start Here)

1. [ ] Create `/app/dashboard/layout.tsx` — sidebar + dark theme + tab routing
2. [ ] Create `/app/dashboard/page.tsx` — redirect to layers
3. [ ] Run Supabase migrations for `projects` and `documents` tables
4. [ ] Set up n8n flow: Origami project webhook → Supabase upsert
5. [ ] Build `Layers` page — projects list with health badges
6. [ ] Test: project created in Origami → appears in CC dashboard

## 📎 References

- **Notion Project:** https://www.notion.so/3158f27212f881639507feab50d68d44
- **Production Plan:** See `cc-production-plan.md` in repo
- **Prototype Source:** V8 Step 4 artifact (92K single-file React)
- **Existing Repo:** 711 files, 130 app routes, 94 API routes — be careful with existing code
