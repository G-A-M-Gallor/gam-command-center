# vBrain.io Design System - MASTER
**Global Source of Truth | Generated: 2026-04-04**

## 🎯 Project Identity
**Product**: vBrain.io Command Center - SaaS Dashboard
**Industry**: AI-powered productivity platform
**Market**: Hebrew RTL + International multilingual
**Stack**: Next.js + Tailwind CSS + TypeScript

## 🎨 Design Foundation

### Color System
```css
/* Primary Palette - Professional SaaS */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-500: #0ea5e9;
--primary-600: #0284c7;
--primary-900: #0c4a6e;

/* Semantic Colors */
--success: #059669;
--warning: #d97706;
--error: #dc2626;
--info: #0ea5e9;

/* Neutral Scale */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;
```

### Typography Scale
**Primary**: Inter (UI/Interface)
**Secondary**: IBM Plex Sans (Content/Hebrew)
**Code**: JetBrains Mono

```css
/* Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing System
```css
/* Tailwind-based 4px scale */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

## 🌐 Hebrew/RTL Support

### Direction Management
```tsx
// Auto-detection based on content
const isHebrewContent = /[\u0590-\u05FF]/.test(text);
const direction = isHebrewContent ? 'rtl' : 'ltr';

// Component example
<div
  dir={direction}
  className={cn(
    "transition-all duration-200",
    direction === 'rtl' && "text-right"
  )}
>
```

### Keyboard Layout Converter
```tsx
// Built-in gibberish.ts converter
import { toHebrew, toEnglish, isGibberish } from '@/lib/gibberish';

// Auto-fix typed text
const handleInput = (value: string) => {
  if (isGibberish(value)) {
    return toHebrew(value); // Convert English→Hebrew
  }
  return value;
};
```

## 📱 Responsive Breakpoints
```css
/* Mobile-first approach */
--mobile: 375px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1440px;

/* Usage */
@media (min-width: 768px) { /* tablet+ */ }
@media (min-width: 1024px) { /* desktop+ */ }
```

## 🧱 Component Architecture

### Button System
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

// Hebrew RTL support
<Button
  variant="primary"
  icon={<ArrowLeft />} // Auto-flips in RTL
  className="rtl:flex-row-reverse"
>
  שמור
</Button>
```

### Card Components
```tsx
// Glass morphism style for vBrain aesthetic
<Card className="bg-white/80 backdrop-blur-md border border-white/20">
  <CardHeader>
    <CardTitle className="text-gray-900">כותרת</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-gray-600 leading-relaxed">תוכן</p>
  </CardContent>
</Card>
```

### Dashboard Layout
```tsx
// Main layout with RTL support
<div className="flex min-h-screen bg-gray-50">
  <Sidebar className="w-64 shrink-0" />
  <main className="flex-1 p-6">
    <PageHeader title="דאשבורד" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {widgets}
    </div>
  </main>
</div>
```

## 🎭 Animation & Interactions

### Micro-animations
```tsx
// Hover states
"transition-all duration-200 hover:scale-105 hover:shadow-lg"

// Loading states
"animate-pulse" // Skeleton loading
"animate-spin"  // Spinner

// Page transitions
"fade-in-up" // Custom animation class
```

### Focus States (Accessibility)
```css
.focus-visible {
  @apply ring-2 ring-primary-500 ring-offset-2 outline-none;
}

/* RTL focus rings */
.rtl .focus-visible {
  @apply ring-offset-reverse;
}
```

## 🔧 Implementation Guidelines

### Icon System
- **Library**: Lucide React (consistent, RTL-aware)
- **Size**: 16px (sm), 20px (md), 24px (lg)
- **RTL Flip**: Directional icons auto-flip

### Form Controls
```tsx
// Hebrew-friendly form
<Form dir="rtl">
  <FormField
    label="שם משתמש"
    placeholder="הכנס שם משתמש..."
    className="text-right placeholder:text-gray-400"
  />
</Form>
```

### Error Handling
```tsx
// Bilingual error messages
const errors = {
  required: {
    he: "שדה חובה",
    en: "Required field"
  }
};

<ErrorMessage>
  {errors.required[locale]}
</ErrorMessage>
```

## 📊 Data Visualization
- **Library**: Recharts (RTL-compatible)
- **Colors**: Use semantic color scale
- **Hebrew**: Right-to-left chart labels

## ✅ Accessibility Checklist
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Focus states visible
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] RTL screen reader compatibility
- [ ] Hebrew ARIA labels

## 🚫 Anti-Patterns
❌ **Don't**: Mix Hebrew/English in same text line
❌ **Don't**: Use emoji as functional icons
❌ **Don't**: Hardcode left/right positioning
❌ **Don't**: Ignore touch target sizes (44px minimum)

✅ **Do**: Use semantic HTML
✅ **Do**: Test with real Hebrew content
✅ **Do**: Support dark mode gracefully
✅ **Do**: Implement proper loading states

---
*Design System v1.0 | vBrain.io Command Center | Hebrew RTL + International Support*