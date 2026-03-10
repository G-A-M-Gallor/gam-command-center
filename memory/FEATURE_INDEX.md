# FEATURE_INDEX.md — vBrain.io

> Inventory of every feature, route, component, API endpoint, and integration.
> Last verified: 2026-03-10

---

## 1. Dashboard Pages (16 routes)

| # | Route | Status | What it does |
|---|-------|--------|--------------|
| 0 | `/dashboard` | Active | Home — stat cards, recent projects, events, quick actions |
| 1 | `/dashboard/layers` | Active | Projects list with health scores, search/filter/sort |
| 1a | `/dashboard/layers/[id]` | Active | Project detail — docs, story cards, health |
| 2 | `/dashboard/editor` | Active | Document list + Canvas block editor |
| 2a | `/dashboard/editor/[id]` | Active | Edit specific document |
| 3 | `/dashboard/story-map` | Active | 3-tier DnD story map (epics > features > stories) |
| 4 | `/dashboard/functional-map` | Active | 3x5 locked grid with inline editing |
| 5 | `/dashboard/ai-hub` | Active | AI assistant — 5 modes (chat/analyze/write/decompose/work) |
| 6 | `/dashboard/design-system` | Active | Gallery + Components + Handbook + App Preview + Library |
| 7 | `/dashboard/entities` | Active | Entity home — type cards with counts |
| 7a | `/dashboard/entities/fields` | Active | Global field library |
| 7b | `/dashboard/entities/types` | Active | Entity types manager |
| 7c | `/dashboard/entities/[type]` | Active | Entity list — 6 views (table/board/list/calendar/gantt/timeline) |
| 7d | `/dashboard/entities/[type]/[id]` | Active | Entity detail — fields, canvas, stakeholders, activity, comments |
| 8 | `/dashboard/wiki` | Active | Wiki page list + search |
| 8a | `/dashboard/wiki/[slug]` | Active | Wiki page viewer |
| 9 | `/dashboard/architecture` | Active | Mermaid diagram + 6-tool stack table |
| 10 | `/dashboard/plan` | Active | 5-phase roadmap with timeline |
| 11 | `/dashboard/automations` | Active | n8n iframe + automation type examples |
| 12 | `/dashboard/settings` | Active | Accent, fonts, skins, density, brand, overrides |
| 13 | `/dashboard/admin` | Active | System registry — routes, widgets, contexts, changelog, dev checklist |

> **Removed:** `/dashboard/formily` (2026-03-09) — Entity platform replaces it.

---

## 2. Entity Platform Components (18 + 6 views)

### Detail & Editing
| File | Purpose |
|------|---------|
| `NoteMeta.tsx` | Editable meta fields grid (3-column layout) |
| `EntityCanvas.tsx` | Frame/Graph/History canvas with DnD + Supabase persistence |
| `EntityContentEditor.tsx` | Rich content editor for entity body |
| `NoteActionBar.tsx` | Single-scope action buttons |
| `NoteActions.tsx` | Action menu for individual entity |
| `EntityActionBar.tsx` | Entity-level action bar |
| `StakeholderPanel.tsx` | Manage entity stakeholders & roles |
| `RelationPanel.tsx` | Entity-to-entity relations |
| `ActivityFeed.tsx` | Activity log timeline |
| `CommentsSection.tsx` | Comments thread with i18n |
| `TemplatePicker.tsx` | Select entity template |
| `ConnectionDiagram.tsx` | Entity relationship diagram |
| `EntitySetupGuide.tsx` | New entity type setup wizard |

### Bulk Operations
| File | Purpose |
|------|---------|
| `BulkActionBar.tsx` | Selection toolbar for bulk actions |
| `BulkFieldUpdateModal.tsx` | Modal for bulk field updates |
| `CsvImportModal.tsx` | CSV import with preview & mapping |

### Config
| File | Purpose |
|------|---------|
| `FieldEditorModal.tsx` | Create/edit global fields |
| `TemplateEditor.tsx` | Entity type template designer |

### 6 View Modes (`components/entities/views/`)
| View | File |
|------|------|
| Table | `TableView.tsx` |
| Board (Kanban) | `BoardView.tsx` |
| List | `ListView.tsx` |
| Calendar | `CalendarView.tsx` |
| Gantt | `GanttView.tsx` |
| Timeline | `TimelineView.tsx` |

---

## 3. API Routes (21 endpoints)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/ai/chat` | requireAuth + Zod | Claude streaming chat (5 modes) |
| POST | `/api/embeddings/generate` | requireAuth + Zod | Generate document embeddings |
| POST | `/api/embeddings/search` | requireAuth + Zod | Semantic search |
| GET/POST/PATCH | `/api/entities/[type]` | requireAuth + Zod | Entity list CRUD + bulk ops |
| GET/PATCH/DELETE | `/api/entities/[type]/[id]` | requireAuth | Single entity CRUD |
| POST | `/api/entities/[type]/[id]/comments` | requireAuth + Zod | Comments |
| GET | `/api/events/today` | cookie | Google Calendar events |
| POST | `/api/git/commit` | requireAuth + Zod | Git commit (dev only) |
| POST | `/api/git/deploy` | requireAuth + Zod | Git push (dev only) |
| GET | `/api/git/status` | requireAuth | Git status |
| GET | `/api/health` | public | Healthcheck |
| GET | `/api/installed-components` | cookie | Installed UI components |
| GET/POST/PATCH | `/api/notifications` | requireAuth + Zod | Notification CRUD |
| POST | `/api/notion/tasks` | requireAuth + Zod | Sync tasks to Notion |
| GET | `/api/origami/entities` | cookie | Origami CRM entities |
| POST | `/api/origami/sync` | webhook key | n8n > Supabase sync |
| POST | `/api/push/send` | webhook key | Send push notification |
| POST | `/api/push/subscribe` | requireAuth + Zod | Register push subscription |
| GET | `/api/push/subscribers` | requireAuth | List subscribers |
| GET | `/api/system/snapshot` | requireAuth | System info |
| GET/PUT | `/api/weekly-planner` | cookie | Weekly planner data |
| POST | `/api/work-manager` | requireAuth + Zod | Work Manager streaming |
| POST | `/api/work-manager/execute` | requireAuth + Zod | Execute Work Manager actions |

---

## 4. Top Bar Widgets (15 active)

| ID | Size | Panel | File | Category |
|----|------|-------|------|----------|
| `search` | 2x | modal | SearchWidget.tsx | core |
| `ai-assistant` | 1x | side-panel | AIWidget.tsx | core |
| `quick-create` | 2x | dropdown | QuickCreateWidget.tsx | core |
| `favorites` | 1x | dropdown | FavoritesWidget.tsx | core |
| `today` | 2x | dropdown | TodayWidget.tsx | core |
| `notifications` | 1x | dropdown | NotificationsWidget.tsx | core |
| `timer` | 2x | dropdown | TimerWidget.tsx | core |
| `clipboard` | 1x | dropdown | ClipboardWidget.tsx | core |
| `settings` | 1x | dropdown | SettingsWidget.tsx | core |
| `keyboard-shortcuts` | 1x | modal | ShortcutsWidget.tsx | tools |
| `weekly-planner` | 2x | modal | WeeklyPlannerWidget.tsx | tools |
| `kpi` | 2x | dropdown | KPIWidget.tsx | data |
| `shortcuts` | 1x | dropdown | ExternalLinksWidget.tsx | tools |
| `wati` | 2x | dropdown | WATIWidget.tsx | comms |
| `team` | 2x | dropdown | TeamWidget.tsx | comms |

> **Removed:** origami-forms, form-submissions, form-scanner (2026-03-09).

---

## 5. React Contexts (9)

| Context | File | Purpose |
|---------|------|---------|
| AuthContext | `contexts/AuthContext.tsx` | Supabase auth (user, session) |
| SettingsContext | `contexts/SettingsContext.tsx` | Language, accent, fonts, skins, density, brand |
| WidgetContext | `contexts/WidgetContext.tsx` | Widget positions, sizes, hover delays, folders |
| StyleOverrideContext | `contexts/StyleOverrideContext.tsx` | Per-element style overrides |
| DashboardModeContext | `contexts/DashboardModeContext.tsx` | Normal / focus / kiosk mode |
| CanvasContext | `contexts/CanvasContext.tsx` | Canvas editor state |
| WeeklyPlannerContext | `contexts/WeeklyPlannerContext.tsx` | Weekly planner widget |
| ShortcutsContext | `contexts/ShortcutsContext.tsx` | Keyboard shortcuts registry |
| ToastContext | `contexts/ToastContext.tsx` | Toast notifications |

---

## 6. Library Modules

### `lib/supabase/` — 24 files
| File | Purpose |
|------|---------|
| `client.ts` | Browser Supabase client |
| `server.ts` | Server-side client (API routes) |
| `middleware.ts` | Supabase auth middleware |
| `schema.ts` | DB schema types |
| `entityQueries.ts` | Entity CRUD (fetchNote, updateNoteMeta, etc.) |
| `fieldQueries.ts` | Global field CRUD |
| `projectQueries.ts` | Project CRUD |
| `editorQueries.ts` | Document CRUD |
| `storyCardQueries.ts` | Story card CRUD |
| `aiConversationQueries.ts` | AI conversation history |
| `aiUsageQueries.ts` | Token usage tracking |
| `userProfileQueries.ts` | User profile & settings |
| `functionalMapQueries.ts` | Functional map cells |
| `planQueries.ts` | Plan phases & milestones |
| `kpiQueries.ts` | KPI metrics |
| `storageQueries.ts` | File storage operations |
| `permissionQueries.ts` | Entity-level permissions |
| `activityLogger.ts` | Server-side activity logging |
| `notifyUser.ts` | Server-side notification helper (i18n) |
| `fireberryBridge.ts` | Origami/Fireberry CRM bridge |
| `documentRealtime.ts` | Realtime document editing |
| `storyCardRealtime.ts` | Realtime story cards |
| `functionalMapRealtime.ts` | Realtime functional map |
| `planRealtime.ts` | Realtime plan updates |

### `lib/entities/` — 8 files
| File | Purpose |
|------|---------|
| `types.ts` | NoteRecord, EntityType, GlobalField, I18nLabel |
| `builtinEntityTypes.ts` | Pre-built types (contacts, deals, tasks, projects, cases, wiki) |
| `builtinFields.ts` | SYSTEM_FIELDS definitions |
| `builtinRoles.ts` | Stakeholder roles & permissions |
| `actionRegistry.ts` | Built-in action definitions |
| `actionHandlers.ts` | Action execution (navigate, setField, webhook) |
| `resolveActions.ts` | Filter visible actions per entity/scope |
| `actionIconMap.ts` | Action > Lucide icon mapping |

### `lib/ai/` — 6 files
| File | Purpose |
|------|---------|
| `client.ts` | Anthropic SDK client |
| `prompts.ts` | System prompts for 5 AI modes |
| `contextProvider.ts` | Extract context for AI prompts |
| `embeddings.ts` | Embedding generation & search |
| `tokenTracker.ts` | Token usage tracking |
| `usePageContext.ts` | Current page context hook |

### `lib/work-manager/` — 3 files + tests
| File | Purpose |
|------|---------|
| `agentPrompts.ts` | 6 agent prompts (orchestrator/pm/dev/design/qa/strategy) |
| `detectAgent.ts` | Route messages to correct agent |
| `parseAction.ts` | Parse ACTION:{} blocks from responses |

### Other key files
| File | Purpose |
|------|---------|
| `lib/i18n.ts` | All translations (he/en/ru) — ~3200 lines |
| `lib/api/auth.ts` | requireAuth helper (JWT validation) |
| `lib/api/schemas.ts` | Zod schemas for POST routes |
| `lib/utils/timeAgo.ts` | Time formatting (he/en/ru) |

---

## 7. External Integrations

| Service | Role | Integration Point |
|---------|------|-------------------|
| **Supabase** | DB + Auth + Realtime + Storage | All entity/doc/story operations |
| **Origami CRM** | Operational SOT | `/api/origami/*`, n8n sync |
| **Claude API** | AI chat/analysis/writing | `/api/ai/chat`, `/api/work-manager` |
| **n8n** | Automation platform | `/api/origami/sync` webhook, iframe |
| **WATI** | WhatsApp flows | WATIWidget iframe |
| **Notion** | Knowledge SOT | `/api/notion/tasks`, wiki sync |
| **Google Calendar** | Events | `/api/events/today` |
| **Sentry** | Error tracking | SDK installed, boundaries wired |
| **Vercel** | Hosting + CI/CD | Auto-deploy on push |

---

## 8. Known Gaps & Tech Debt

| Issue | Details | Priority |
|-------|---------|----------|
| `isHe` anti-pattern | 57+ instances of `isHe ? "..." : "..."` — breaks Russian | Medium |
| vb_ai_memory table | Table exists in Supabase but no code reads from it | Low |
| AI Hub prompts | Generic — no GAM-specific knowledge injected | Medium |
| console.log | 2 instances in ai-hub/page.tsx | Low |
| TODOs | TeamWidget (Supabase Presence), WATIWidget (real WATI API) | Blocked |
| Sentry pipeline | L1-L3 auto-fix not built yet (needs PAT workflow scope) | Medium |

---

## 9. Mobile Status

No mobile app yet. Features requiring mobile testing when app exists:
- EntityCanvas (DnD touch events)
- Story Map (DnD touch events)
- Wiki page viewer
- Push notifications

---

> Updated: 2026-03-10 | Source: code scan + git log + CLAUDE.md
