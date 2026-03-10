# FEATURE_INDEX.md — vBrain.io

> Complete inventory of every feature built from day one.
> Source: git log (91 commits) + source scan (291 files) + CLAUDE.md + MEMORY.md
> Last verified: 2026-03-10

---

## Feature Timeline

| # | Feature | תיאור | קבצים מרכזיים | סטטוס | תאריך |
|---|---------|-------|---------------|-------|-------|
| 1 | **Dashboard Shell** | DashboardShell + Sidebar + TopBar + dark theme + layout system | `DashboardShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `layout.tsx` | ✅ פעיל | 2026-03-02 |
| 2 | **Dashboard Home** | Stat cards, recent projects, events calendar, quick actions | `dashboard/page.tsx` | ✅ פעיל | 2026-03-02 |
| 3 | **Layers (Projects)** | Project list with health scores, search, filter, sort | `layers/page.tsx`, `layers/[id]/page.tsx`, `ProjectCard.tsx`, `HealthBadge.tsx` | ✅ פעיל | 2026-03-02 |
| 4 | **Canvas Editor** | Block editor with Tiptap — images, tables, embeds, callouts, templates, version history, share links | `editor/page.tsx`, `editor/[id]/page.tsx`, `EditToolbar.tsx`, `editorQueries.ts` | ✅ פעיל | 2026-03-02 |
| 5 | **Story Map** | 3-tier DnD board (epics > features > stories), Realtime sync, filter bar, stats, T-shirt estimation, export | `story-map/page.tsx`, `StoryBoard.tsx`, `StoryCard.tsx`, `StoryColumn.tsx`, `StoryMapFilterBar.tsx`, `StoryMapExport.tsx` | ✅ פעיל | 2026-03-05 |
| 6 | **Functional Map** | 3x5 locked grid (strategy/management/operations x 5 functions), inline editing, Realtime | `functional-map/page.tsx`, `functionalMapQueries.ts`, `functionalMapRealtime.ts` | ✅ פעיל | 2026-03-05 |
| 7 | **Automations Page** | n8n iframe + 3 Supabase automation types with code examples | `automations/page.tsx` | ✅ פעיל | 2026-03-05 |
| 8 | **Canvas/Fields System** | Canvas block system + field definitions + 8 bug fixes | `lib/canvas/`, `fields/page.tsx` | ✅ פעיל | 2026-03-05 |
| 9 | **Settings Page** | Accent colors, fonts, skins, density, brand profile, style overrides | `settings/page.tsx`, `SettingsContext.tsx`, `StyleOverrideContext.tsx` | ✅ פעיל | 2026-03-02 |
| 10 | **Architecture Page** | Mermaid diagram + 6-tool stack table | `architecture/page.tsx` | ✅ פעיל | 2026-03-02 |
| 11 | **Plan Page** | 5-phase roadmap with timeline, notes, Realtime sync | `plan/page.tsx`, `planQueries.ts`, `planRealtime.ts` | ✅ פעיל | 2026-03-02 |
| 12 | **Admin Page** | System registry — routes, widgets, contexts, changelog, dev checklist | `admin/page.tsx`, `admin/data.ts`, `admin/types.ts` | ✅ פעיל | 2026-03-02 |
| 13 | **Dev Checklist System** | 5-item quality gate per feature in changelog, CHANGELOG_CHECKLISTS | `admin/data.ts` (CHANGELOG_CHECKLISTS) | ✅ פעיל | 2026-03-06 |
| 14 | **Error Boundaries** | Dashboard-level + global fallback error handling | `error.tsx`, `global-error.tsx` | ✅ פעיל | 2026-03-06 |
| 15 | **AI Hub — Chat/Analyze/Write/Decompose** | 4 AI modes with Claude streaming, sliding window, context injection | `ai-hub/page.tsx`, `lib/ai/prompts.ts`, `lib/ai/client.ts`, `api/ai/chat/route.ts` | ✅ פעיל | 2026-03-06 |
| 16 | **AI Hub — Work Manager (Mode 5)** | 6-agent system (orchestrator/pm/dev/design/qa/strategy), detectAgent routing, action preview | `api/work-manager/route.ts`, `agentPrompts.ts`, `detectAgent.ts`, `parseAction.ts`, `ActionPreview.tsx` | ✅ פעיל | 2026-03-09 |
| 17 | **AI Knowledge Base** | CLAUDE.md injected into all AI system prompts (cached, ~800 tokens) | `lib/ai/knowledgeBase.ts` | ✅ פעיל | 2026-03-10 |
| 18 | **GitHub OAuth Login** | Supabase Auth + GitHub OAuth + email allowlist | `AuthContext.tsx`, `login/page.tsx` | ✅ פעיל | 2026-03-06 |
| 19 | **Security Hardening** | JWT auth on all API routes, Zod validation, RLS hardening, execFileSync | `lib/api/auth.ts`, `lib/api/schemas.ts` | ✅ פעיל | 2026-03-06 |
| 20 | **Role System + Permissions** | Per-user action permissions, bulk actions, multi-step modal | `builtinRoles.ts`, `permissionQueries.ts`, `BulkActionBar.tsx`, `BulkFieldUpdateModal.tsx` | ✅ פעיל | 2026-03-06 |
| 21 | **Token Budget System** | Server-side daily token limit (100K), RPC-based atomic check, usage tracking | `api/ai/chat/route.ts`, `aiUsageQueries.ts`, `tokenTracker.ts` | ✅ פעיל | 2026-03-06 |
| 22 | **Origami Sync** | n8n webhook → Supabase mirror, health scores, Fireberry bridge | `api/origami/sync/route.ts`, `api/origami/entities/route.ts`, `fireberryBridge.ts` | 🔧 חלקי | 2026-03-07 |
| 23 | **Supabase Full Upgrade** | 49 migrations, triggers, RPCs, views, full-text search, audit log | `supabase/migrations/` (49 files) | ✅ פעיל | 2026-03-07 |
| 24 | **pgvector Semantic Search** | Voyage AI embeddings, SearchWidget fallback, embedding API | `lib/ai/embeddings.ts`, `api/embeddings/`, `SearchWidget.tsx` | ✅ פעיל | 2026-03-07 |
| 25 | **RLS Hardening** | Replace permissive USING(true) on 10 tables, pgTAP tests | migration files, `supabase/tests/` | ✅ פעיל | 2026-03-07 |
| 26 | **Realtime Sprint** | Realtime for functional map, plan, story cards, documents | `documentRealtime.ts`, `storyCardRealtime.ts`, `functionalMapRealtime.ts`, `planRealtime.ts` | ✅ פעיל | 2026-03-07 |
| 27 | **Sidebar Redesign** | Grouped navigation with sliding active indicator | `Sidebar.tsx` | ✅ פעיל | 2026-03-07 |
| 28 | **Editor UX** | Confirm delete, template management, statusbar, share expiry, auto-save with retry, offline queue | `editor/[id]/page.tsx`, `editorQueries.ts` | ✅ פעיל | 2026-03-07 |
| 29 | **i18n — Russian Language** | Full Russian support across 24+ files, 5500+ line i18n.ts | `lib/i18n.ts` (5514 lines) | ✅ פעיל | 2026-03-07 |
| 30 | **Keyboard Shortcuts** | Global shortcuts registry + wiring + ShortcutsWidget | `ShortcutsContext.tsx`, `ShortcutsWidget.tsx`, `lib/shortcuts/` | ✅ פעיל | 2026-03-07 |
| 31 | **Mobile Responsive** | 2 passes — responsive layouts, mobile-first adjustments | multiple files | ✅ פעיל | 2026-03-07 |
| 32 | **Accessibility** | Focus traps, aria-labels on 35+ buttons, data-cc-id attributes (30+), style override registry | `useFocusTrap.ts`, `styleOverrideRegistry.ts`, `GuideOverlay.tsx` | ✅ פעיל | 2026-03-07 |
| 33 | **Optimistic Locking** | Conflict detection in editor saves | `editorQueries.ts` | ✅ פעיל | 2026-03-07 |
| 34 | **Code Splitting** | 22 dynamic imports — widgets, editor, story map | `WidgetRegistry.ts`, `next/dynamic` | ✅ פעיל | 2026-03-07 |
| 35 | **Unit Tests** | vitest — 43 tests (26 useAutoSave + 17 offlineQueue) | `__tests__/` | ✅ פעיל | 2026-03-07 |
| 36 | **Health Endpoint** | `/api/health` — system healthcheck | `api/health/route.ts` | ✅ פעיל | 2026-03-07 |
| 37 | **Design System** | Gallery + Components + Handbook + App Preview + Library (127 components catalog) | `design-system/page.tsx`, `LibraryTab.tsx`, `libraryRegistry.ts`, `componentRegistry.ts` | ✅ פעיל | 2026-03-08 |
| 38 | **Roadmap Page** | Visual island navigation with 7 phases | `/roadmap` (outside dashboard) | ✅ פעיל | 2026-03-08 |
| 39 | **Widget Top Bar V2** | Bookmarks, profiles, display modes, side panel, auto-pack, folders | `TopBar.tsx`, `WidgetWrapper.tsx`, `ProfileSwitcher.tsx`, `FolderWrapper.tsx`, `WidgetStore.tsx` | ✅ פעיל | 2026-03-08 |
| 40 | **Mobile Bottom Bar** | Bottom nav bar, safe-area, sidebar toggle, swap sides, widget panel | `MobileBottomBar.tsx`, `useMobileBottomBar.ts` | ✅ פעיל | 2026-03-08 |
| 41 | **PWA** | Service Worker, offline support, push notifications, install prompt, control center in settings | `lib/pwa/`, service worker files, `useInstallPrompt.ts` | ✅ פעיל | 2026-03-08 |
| 42 | **Gibberish Converter** | Auto-detect wrong keyboard layout (Hebrew ↔ English), toast with convert action | `GibberishDetector.tsx`, `lib/gibberish.ts`, `useGibberishDetect.ts` | ✅ פעיל | 2026-03-08 |
| 43 | **Sentry** | Error tracking SDK, client/server/edge configs, error boundaries wired | `sentry.*.config.ts`, `instrumentation.ts`, `global-error.tsx` | ✅ פעיל | 2026-03-08 |
| 44 | **Entity Platform** | Full CRM+ERP+Dev — 6 views, templates, bulk ops, action buttons, field library, type manager | `entities/` (4 routes), `lib/entities/` (8 files), `components/entities/` (18+ components) | ✅ פעיל | 2026-03-09 |
| 45 | **Smart Field Keys** | Auto-generated meta_key, aliases, merge in field library | `builtinFields.ts`, `fieldQueries.ts` | ✅ פעיל | 2026-03-09 |
| 46 | **System Fields** | Built-in fields (created_at, updated_at, owner, status) auto-applied | `builtinFields.ts` | ✅ פעיל | 2026-03-09 |
| 47 | **Confidence Display** | Confidence level (🟢🟡🔴) in all AI modes + Notion integration | `ai-hub/page.tsx`, `parseAction.ts` | ✅ פעיל | 2026-03-09 |
| 48 | **Dynamic Session Prompt** | Session context from Supabase injected into AI prompts | `api/work-manager/route.ts` (loadSessionContext) | ✅ פעיל | 2026-03-09 |
| 49 | **Notion Integration** | Task sync to Notion DB, task summary in AI prompts | `api/notion/tasks/route.ts`, `lib/notion/client.ts` | ✅ פעיל | 2026-03-09 |
| 50 | **SpeedDial** | Half-ellipse trigger + arc animation fan layout | `SpeedDial.tsx` | ✅ פעיל | 2026-03-09 |
| 51 | **Icon/Emoji/Image Picker** | Entity icon selection — icons, emojis, image upload | entity components | ✅ פעיל | 2026-03-09 |
| 52 | **Wiki** | Wiki pages with search, create, view, edit | `wiki/page.tsx`, `wiki/[id]/page.tsx`, `wiki/new/page.tsx` | ✅ פעיל | 2026-03-10 |
| 53 | **Entity Expansion** | Activity log, case type, notifications, comments, content editor | `ActivityFeed.tsx`, `CommentsSection.tsx`, `EntityContentEditor.tsx` | ✅ פעיל | 2026-03-10 |
| 54 | **EntityCanvas** | Frame/Graph/History modes, DnD blocks, Supabase persistence via meta.__canvas_blocks | `EntityCanvas.tsx` | ✅ פעיל | 2026-03-10 |
| 55 | **Push Notifications** | Subscribe, send, list subscribers API | `api/push/send`, `api/push/subscribe`, `api/push/subscribers` | ✅ פעיל | 2026-03-08 |
| 56 | **Git Controls** | Commit + deploy buttons in PageHeader (dev only) | `PageHeader.tsx`, `api/git/commit`, `api/git/deploy`, `api/git/status` | ✅ פעיל | 2026-03-06 |
| 57 | **Toast System** | Global toast notifications via context + custom DOM events | `ToastContext.tsx` | ✅ פעיל | 2026-03-02 |
| 58 | **Widget System** | 15 widgets — drag, resize, hover, click, folders, profiles, error boundaries | `widgets/` (28 files), `WidgetContext.tsx` | ✅ פעיל | 2026-03-02 |
| 59 | **Formily Page** | Form builder page + 3 form widgets | — | ❌ הוסר | 2026-03-09 |
| 60 | **auto-sync CLAUDE.md workflow** | GitHub Action to sync CLAUDE.md to vb_ai_memory via Edge Function | `.github/workflows/sync-memory.yml` | ❌ הוסר | 2026-03-10 |
| 61 | **Sentry Auto-Fix Pipeline** | L1-L3: webhook → analysis → auto-PR | — | ⏳ מתוכנן | — |
| 62 | **CI/CD Pipeline** | GitHub Actions CI (tests, lint, build) | `.github/workflows/ci.yml` | ⏳ מתוכנן | — |
| 63 | **TeamWidget Live Presence** | Supabase Realtime Presence in TeamWidget | `TeamWidget.tsx` | ⏳ מתוכנן | — |
| 64 | **WATIWidget Real API** | Connect WATIWidget to actual WATI API | `WATIWidget.tsx` | ⏳ מתוכנן | — |
| 65 | **Origami Full Sync** | Complete bidirectional Origami ↔ Supabase sync via n8n | n8n workflows | ⏳ מתוכנן | — |

---

## Summary

- **Total features:** 65 (58 active, 2 removed, 5 planned)
- **Dashboard pages:** 16 routes
- **API routes:** 21 endpoints
- **Widgets:** 15 active
- **Contexts:** 9
- **Source files:** 291
- **Supabase migrations:** 49
- **i18n:** 5514 lines (Hebrew + English + Russian)
- **Tests:** 43 unit tests (vitest)
- **Git commits:** 91
- **Development span:** 2026-02-28 → 2026-03-10 (11 days)

---

> Updated: 2026-03-10 | Source: git log + source scan + CLAUDE.md + MEMORY.md
