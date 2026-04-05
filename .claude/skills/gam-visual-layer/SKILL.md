---
name: gam-visual-layer
description: "Visual layer system for vBrain.io dashboard. AD-026 Miro Visual Layer specification. Hierarchical design patterns, color systems, RTL Hebrew support, and dashboard compositions."
---

# GAM Visual Layer — AD-026

Visual layer system for vBrain.io dashboard and Command Center applications. Provides hierarchical design patterns, color systems, RTL Hebrew support, and dashboard compositions.

## When to Apply

Reference these guidelines when:
- Building new dashboard layouts
- Implementing visual hierarchy
- Defining color systems and themes
- Creating component compositions
- Working with Hebrew RTL layouts
- Designing widget arrangements
- Setting up responsive grids

## Visual Hierarchy Layers

### Layer Structure (Z-Index Management)
```
Layer 0: Background & Canvas      (z-0 to z-10)
Layer 1: Content & Cards          (z-10 to z-20)
Layer 2: Interactive Elements     (z-20 to z-30)
Layer 3: Navigation & Controls    (z-30 to z-40)
Layer 4: Overlays & Modals        (z-40 to z-50)
Layer 5: Notifications & Alerts   (z-50+)
```

## Color System Hierarchy

### Primary Brand Colors (vBrain.io)
- **Primary**: #0ea5e9 (sky-500) — Main brand, CTAs, active states
- **Primary Dark**: #0284c7 (sky-600) — Hover states, emphasis
- **Primary Light**: #38bdf8 (sky-400) — Subtle accents, backgrounds

### Semantic Colors
- **Success**: #059669 (emerald-600)
- **Warning**: #d97706 (amber-600)
- **Error**: #dc2626 (red-600)
- **Info**: #0ea5e9 (sky-500)

### Neutral Scale (Dark Theme)
- **Background**: #0f172a (slate-900)
- **Surface**: #1e293b (slate-800)
- **Border**: #334155 (slate-700)
- **Text Primary**: #f1f5f9 (slate-100)
- **Text Secondary**: #94a3b8 (slate-400)

## RTL Hebrew Support

### Typography Hierarchy
- **Hebrew Font**: "Heebo", "Assistant", sans-serif
- **Code Font**: "JetBrains Mono", "Fira Code", monospace
- **Reading Direction**: RTL for Hebrew content
- **Text Alignment**: text-start (contextual)

### Layout Patterns
- **Flex RTL**: `flex flex-row-reverse` for RTL layouts
- **Grid RTL**: `grid-cols-1 lg:grid-cols-12` with RTL-aware placement
- **Spacing RTL**: Use logical properties (`ms-4`, `me-4` vs `ml-4`, `mr-4`)

## Dashboard Composition Patterns

### Widget Grid System
```css
/* Desktop: 12-column grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

/* Widget sizes */
.widget-small { grid-column: span 3; }    /* 1/4 width */
.widget-medium { grid-column: span 6; }   /* 1/2 width */
.widget-large { grid-column: span 9; }    /* 3/4 width */
.widget-full { grid-column: span 12; }    /* Full width */
```

### Component Composition
1. **Command Center Layout**: Header + Sidebar + Main + Dock
2. **Dashboard Layout**: Nav + Grid + Panels
3. **Detail View**: Breadcrumb + Header + Tabs + Content
4. **Modal Pattern**: Backdrop + Panel + Header + Body + Actions

## Design Tokens Reference

### Spacing Scale
- **XS**: 4px (1rem * 0.25)
- **SM**: 8px (1rem * 0.5)
- **MD**: 16px (1rem)
- **LG**: 24px (1rem * 1.5)
- **XL**: 32px (1rem * 2)
- **2XL**: 48px (1rem * 3)

### Border Radius
- **SM**: 4px — Small elements
- **MD**: 8px — Cards, buttons
- **LG**: 12px — Large panels
- **XL**: 16px — Modal corners

### Shadows
- **SM**: `0 1px 2px rgba(0, 0, 0, 0.05)` — Subtle elevation
- **MD**: `0 4px 6px rgba(0, 0, 0, 0.1)` — Standard cards
- **LG**: `0 10px 15px rgba(0, 0, 0, 0.1)` — Modal/overlay
- **Primary**: `0 4px 14px 0 rgba(14, 165, 233, 0.25)` — Brand glow

## Animation Guidelines

### Transition Durations
- **Fast**: 150ms — Hover states, micro-interactions
- **Normal**: 200ms — State changes, toggles
- **Slow**: 300ms — Panel slides, modal entrance

### Easing Functions
- **Ease Out**: `cubic-bezier(0, 0, 0.2, 1)` — Element entrance
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` — Element exit
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)` — Bi-directional

## Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm: tablets */ }
@media (min-width: 768px)  { /* md: small desktop */ }
@media (min-width: 1024px) { /* lg: desktop */ }
@media (min-width: 1280px) { /* xl: large desktop */ }
@media (min-width: 1536px) { /* 2xl: ultra-wide */ }
```

## Implementation Examples

### Dashboard Widget Card
```tsx
const WidgetCard = ({ title, size = "medium", children }) => (
  <div className={`
    widget-${size}
    bg-slate-800/50 backdrop-blur
    border border-slate-700/50
    rounded-lg p-4
    shadow-md hover:shadow-lg
    transition-all duration-200
  `}>
    <h3 className="text-slate-100 font-semibold mb-3">{title}</h3>
    {children}
  </div>
);
```

### RTL Layout Component
```tsx
const RTLContainer = ({ children, isHebrew }) => (
  <div className={`
    ${isHebrew ? 'text-right' : 'text-left'}
    ${isHebrew ? 'flex-row-reverse' : 'flex-row'}
  `} dir={isHebrew ? 'rtl' : 'ltr'}>
    {children}
  </div>
);
```

## Quality Checklist

Before implementing visual layers, verify:
- [ ] Proper z-index hierarchy maintained
- [ ] Hebrew RTL support where needed
- [ ] Consistent color token usage
- [ ] Responsive behavior at all breakpoints
- [ ] Animation respects `prefers-reduced-motion`
- [ ] Focus states visible for accessibility
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1)

---

## CLI Usage

Query visual layer patterns:

```bash
python3 skills/gam-visual-layer/scripts/search.py "dashboard grid"
python3 skills/gam-visual-layer/scripts/search.py "hebrew rtl"
python3 skills/gam-visual-layer/scripts/search.py "z-index modal"
```

---

**GAM Visual Layer v1.0 | AD-026 | vBrain.io Command Center**