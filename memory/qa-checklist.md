# Claude Self-QA Checklist — vBrain.io

> **This file covers Phases 1-5 of the Self-QA.**
> **Phase 6 (System Health) + full 8-step protocol: https://www.notion.so/31f8f27212f881fca47ce9680e169931**
> **Notion is the master document — this file serves as the technical checklist it references.**

## Context
This checklist is step 1 of the Post-Task Protocol (8 steps total).
The goal: catch everything possible BEFORE Gal spends time on manual testing.
After all 6 phases pass → continue to steps 2-8 of the protocol.

---

## Phase 1: Build & Compilation (MUST PASS)

### 1.1 Full Build
```bash
npx next build --webpack
```
- Zero errors
- Zero warnings that are NEW (existing warnings are OK)
- All pages compile (static + dynamic)

### 1.2 TypeScript Check
```bash
npx tsc --noEmit
```
- Zero type errors in modified files
- No `any` types introduced (unless absolutely necessary with comment explaining why)

---

## Phase 2: Code Quality (per modified file)

### 2.1 Imports
- [ ] No broken imports (all `@/` paths resolve)
- [ ] No unused imports
- [ ] No circular imports between modified files
- [ ] Dynamic imports used for heavy components (code splitting)

### 2.2 i18n Completeness
- [ ] All user-facing strings use `t.section.key` pattern (NOT `isHe ? "..." : "..."`)
- [ ] Keys exist in ALL 3 languages: `he`, `en`, `ru`
- [ ] No hardcoded Hebrew/English text in JSX
- [ ] Labels in `I18nLabel` type have all 3 fields populated

### 2.3 RTL Safety
- [ ] `dir={isRtl ? 'rtl' : 'ltr'}` on container elements
- [ ] `text-start` instead of `text-left`
- [ ] `text-end` instead of `text-right`
- [ ] `ms-auto` instead of `ml-auto`
- [ ] `me-auto` instead of `mr-auto`
- [ ] `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
- [ ] Arrow icons flip for RTL (`ArrowLeft`/`ArrowRight` or `ChevronLeft`/`ChevronRight`)
- [ ] No absolute `left:` / `right:` in inline styles (use `insetInlineStart` / `insetInlineEnd`)

### 2.4 Design System Compliance
- [ ] Dark mode only (no light mode styles)
- [ ] Colors follow palette: slate-900 bg, purple/blue accents, emerald/amber/red for status
- [ ] Uses CSS variables for accent colors (not hardcoded purple)
- [ ] Consistent border: `border-white/[0.06]` or `border-white/[0.08]`
- [ ] Consistent bg: `bg-white/[0.02]` to `bg-white/[0.06]` for surfaces
- [ ] Font sizes: `text-xs` (labels), `text-sm` (body), `text-2xl` (titles)
- [ ] Icons from `lucide-react` only
- [ ] Consistent spacing: `gap-2`, `gap-3`, `gap-4`, `p-3`, `p-4`

### 2.5 TypeScript Conventions
- [ ] PascalCase for components
- [ ] camelCase for functions and variables
- [ ] Proper typing — no implicit `any`
- [ ] `Record<string, unknown>` for generic objects (not `any` or `object`)
- [ ] Interface/type imports use `import type { ... }`

---

## Phase 3: Functionality Verification (code review)

### 3.1 State Management
- [ ] `useEffect` has correct dependency array
- [ ] Cleanup functions where needed (subscriptions, timers, listeners)
- [ ] No stale closures in callbacks (use `useCallback` with correct deps)
- [ ] Optimistic updates revert on error
- [ ] Loading states handled (spinner or skeleton)

### 3.2 Data Flow
- [ ] Supabase queries use correct table/column names
- [ ] `.single()` used only when expecting exactly 1 row
- [ ] Error handling on Supabase calls (`.error` checked)
- [ ] No browser Supabase client in API routes (must use server client)
- [ ] Auth checked where needed (`requireAuth` or cookie-based)

### 3.3 Component API
- [ ] Props are properly typed with interface
- [ ] Required vs optional props make sense
- [ ] Default values for optional props
- [ ] Callback props use `useCallback` in parent to prevent re-renders
- [ ] `key` prop on list items (not array index unless truly static)

### 3.4 Error Handling
- [ ] Try/catch on async operations
- [ ] User-visible error states (not just console.error)
- [ ] Graceful degradation (component still renders if data fetch fails)
- [ ] No unhandled promise rejections

### 3.5 Security
- [ ] No hardcoded secrets or API keys
- [ ] API routes use auth middleware
- [ ] User input sanitized before DB queries
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] `execFileSync` (not `execSync`) for shell commands

---

## Phase 4: Integration Check

### 4.1 Cross-Component Impact
- [ ] Modified components don't break their parents/siblings
- [ ] Shared types/interfaces still compatible
- [ ] Context values still match expected shape
- [ ] Custom DOM events still dispatched/listened correctly
- [ ] localStorage keys don't conflict

### 4.2 Navigation & Routing
- [ ] Links use correct paths (`/dashboard/...`)
- [ ] Dynamic routes get correct params
- [ ] Back navigation works (breadcrumbs, back arrows)
- [ ] No broken hrefs

### 4.3 Entity Platform Specific (if entity-related changes)
- [ ] All 6 view modes still work (table/board/list/calendar/gantt/timeline)
- [ ] Entity type slug resolves correctly
- [ ] Field refs filter properly
- [ ] `meta` JSONB operations merge correctly (not overwrite)
- [ ] `template_config` optional chaining used

---

## Phase 5: Project-Specific Patterns

### 5.1 Admin Registry
- [ ] New routes added to admin/data.ts `ROUTES` array
- [ ] New widgets added to admin/data.ts `WIDGETS` array
- [ ] Changelog entry created with Dev Checklist

### 5.2 Widget System (if widget changes)
- [ ] Widget registered in WidgetRegistry.ts
- [ ] Uses `next/dynamic` import
- [ ] Exports both `Panel` and `BarContent` components
- [ ] Respects sidebar and AI panel boundaries
- [ ] Error boundary wrapping

### 5.3 i18n File Structure
- [ ] Keys added in correct section (not duplicated)
- [ ] Same key structure in all 3 language blocks
- [ ] No trailing commas that break older parsers

---

> **Phase 6 (System Health) + דוח QA + שלבים 2-8 → ראה Notion Protocol**
