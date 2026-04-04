/**
 * vBrain.io Design System Tokens
 * Professional design tokens for consistent UI across the application
 */

export const designTokens = {
  // Color Palette - Professional SaaS Blue
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main brand color
      600: '#0284c7', // Primary buttons
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e'
    },
    semantic: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0ea5e9'
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },

  // Typography Scale
  typography: {
    sizes: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625
    },
    fontFamilies: {
      sans: 'var(--font-geist-sans)',
      hebrew: 'var(--cc-font-hebrew)',
      code: 'var(--cc-font-code)'
    }
  },

  // Spacing Scale
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem'    // 48px
  },

  // Border Radius
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    primary: '0 4px 14px 0 rgba(14, 165, 233, 0.25)',
    'primary-lg': '0 8px 32px 0 rgba(14, 165, 233, 0.3)'
  },

  // Animation Durations
  durations: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  }
};

// Utility functions for design tokens
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value = designTokens.colors as Record<string, string | Record<string, string>>;

  for (const key of keys) {
    if (typeof value === 'string') return value;
    value = value[key] as Record<string, string | Record<string, string>>;
    if (!value) return path; // fallback to original string
  }

  return typeof value === 'string' ? value : path;
};

export const getSpacing = (size: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[size];
};

export const getTypography = (size: keyof typeof designTokens.typography.sizes): string => {
  return designTokens.typography.sizes[size];
};

// Professional class name utilities
export const classNames = {
  // Cards
  card: 'rounded-lg border border-white/10 bg-slate-900/50 backdrop-blur text-slate-100 shadow-lg transition-all duration-200 hover:border-white/20 hover:shadow-primary',

  // Buttons
  button: {
    primary: 'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 shadow-primary hover:shadow-primary-lg transition-all duration-200 rounded-lg',
    secondary: 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-slate-100 transition-all duration-200 rounded-lg',
    ghost: 'text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-200 rounded-lg'
  },

  // Inputs
  input: 'bg-slate-900/40 border border-white/10 rounded-lg transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',

  // Typography
  heading: 'font-semibold tracking-tight leading-tight',
  text: 'leading-normal',

  // Layouts
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  // RTL Support
  flexRtl: 'flex flex-rtl',
  textStart: 'text-start',
  marginStart: 'ms-auto',
  marginEnd: 'me-auto'
};

// Hebrew/RTL utilities
export const hebrewSupport = {
  direction: 'rtl' as const,
  textAlign: 'start' as const,
  fontFamily: designTokens.typography.fontFamilies.hebrew,

  // Helper to apply RTL-aware margins/padding
  marginInlineStart: (size: keyof typeof designTokens.spacing) => ({
    marginInlineStart: designTokens.spacing[size]
  }),
  marginInlineEnd: (size: keyof typeof designTokens.spacing) => ({
    marginInlineEnd: designTokens.spacing[size]
  })
};

// Export design system version for tracking
export const VERSION = '1.0.0';
export const BUILD_DATE = '2026-04-04';
export const THEME_NAME = 'vBrain.io Professional';

export default designTokens;