# vBrain.io Dashboard - Page Overrides
**Specific design rules for the main dashboard experience**

## Dashboard-Specific Overrides

### Layout Grid
```tsx
// 4-column responsive grid for dashboard widgets
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard />
  <ChartWidget />
  <ActivityFeed />
  <QuickActions />
</div>
```

### Widget Styles
```css
/* Dashboard widget base styles */
.dashboard-widget {
  @apply bg-white/90 backdrop-blur-sm border border-gray-200/50;
  @apply rounded-xl p-6 shadow-sm hover:shadow-md;
  @apply transition-all duration-200;
}

/* RTL dashboard adaptations */
[dir="rtl"] .dashboard-widget {
  @apply text-right;
}

[dir="rtl"] .widget-icon {
  @apply ml-3 mr-0; /* Flip margins */
}
```

### Color Overrides for Dashboard
- Primary widgets: `bg-blue-50 border-blue-200`
- Success metrics: `bg-emerald-50 border-emerald-200`
- Warning alerts: `bg-amber-50 border-amber-200`
- Error states: `bg-red-50 border-red-200`

### Typography Hierarchy
```tsx
// Dashboard-specific text sizes (larger than general UI)
<h1 className="text-2xl font-semibold">ברוך הבא ל-vBrain</h1>
<h2 className="text-xl font-medium">סטטיסטיקות</h2>
<h3 className="text-lg font-medium">פעילות אחרונה</h3>
<p className="text-base text-gray-600">פרטי תוכן</p>
```

### Hebrew-Specific Dashboard Rules
1. **Stats direction**: Numbers left-aligned even in RTL
2. **Chart labels**: Hebrew right-aligned
3. **Time displays**: Use Hebrew date format (DD/MM/YYYY)
4. **Action buttons**: Use Hebrew verbs (שמור, ערוך, מחק)

---
*Inherits from MASTER.md | Overrides for dashboard page only*