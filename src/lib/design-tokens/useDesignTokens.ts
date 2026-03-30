import { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Design Token System Hook
 * Provides easy access to design tokens with RTL support
 */
export function useDesignTokens() {
  const { language } = useSettings();

  const tokens = useMemo(() => ({
    // Typography Scale
    typography: {
      xs: 'var(--cc-text-xs)',      // 12px
      sm: 'var(--cc-text-sm)',      // 14px
      base: 'var(--cc-text-base)',  // 16px
      lg: 'var(--cc-text-lg)',      // 18px
      xl: 'var(--cc-text-xl)',      // 20px
      '2xl': 'var(--cc-text-2xl)',  // 24px
      '3xl': 'var(--cc-text-3xl)',  // 30px
      '4xl': 'var(--cc-text-4xl)',  // 36px
      '5xl': 'var(--cc-text-5xl)',  // 48px
    },

    // Line Heights
    leading: {
      tight: 'var(--cc-leading-tight)',      // 1.25
      normal: 'var(--cc-leading-normal)',    // 1.5
      relaxed: 'var(--cc-leading-relaxed)',  // 1.75
    },

    // Spacing Scale
    spacing: {
      xs: 'var(--cc-space-xs)',    // 4px
      sm: 'var(--cc-space-sm)',    // 8px
      md: 'var(--cc-space-md)',    // 16px
      lg: 'var(--cc-space-lg)',    // 24px
      xl: 'var(--cc-space-xl)',    // 32px
      '2xl': 'var(--cc-space-2xl)', // 48px
      '3xl': 'var(--cc-space-3xl)', // 64px
    },

    // Shadow Depths
    shadows: {
      sm: 'var(--cc-shadow-sm)',   // Subtle lift
      md: 'var(--cc-shadow-md)',   // Cards, buttons
      lg: 'var(--cc-shadow-lg)',   // Modals, dropdowns
      xl: 'var(--cc-shadow-xl)',   // Hero images, featured
    },

    // Color System (existing)
    colors: {
      accent: {
        300: 'var(--cc-accent-300)',
        400: 'var(--cc-accent-400)',
        500: 'var(--cc-accent-500)',
        600: 'var(--cc-accent-600)',
        '500-15': 'var(--cc-accent-500-15)',
        '500-30': 'var(--cc-accent-500-30)',
        '500-50': 'var(--cc-accent-500-50)',
        '600-20': 'var(--cc-accent-600-20)',
        '600-30': 'var(--cc-accent-600-30)',
      },
      theme: {
        bg: 'var(--theme-bg)',
        surface: 'var(--theme-surface)',
        text: 'var(--theme-text)',
        textMuted: 'var(--theme-text-muted)',
        border: 'var(--theme-border)',
        primary: 'var(--theme-primary)',
      }
    },

    // Border Radius
    radius: {
      default: 'var(--cc-radius)',      // 6px
      lg: 'var(--cc-radius-lg)',        // 8px
    },

    // Elevation System (existing)
    elevation: {
      0: {
        bg: 'var(--elevation-0-bg)',
        border: 'var(--elevation-0-border)',
        shadow: 'var(--elevation-0-shadow)',
      },
      1: {
        bg: 'var(--elevation-1-bg)',
        border: 'var(--elevation-1-border)',
        shadow: 'var(--elevation-1-shadow)',
      },
      2: {
        bg: 'var(--elevation-2-bg)',
        border: 'var(--elevation-2-border)',
        shadow: 'var(--elevation-2-shadow)',
      },
      3: {
        bg: 'var(--elevation-3-bg)',
        border: 'var(--elevation-3-border)',
        shadow: 'var(--elevation-3-shadow)',
      },
    }
  }), []);

  const isRtl = language === 'he';

  // RTL-aware utility functions
  const rtl = useMemo(() => ({
    // Logical properties helpers
    marginStart: (size: keyof typeof tokens.spacing) =>
      isRtl ? `marginRight: ${tokens.spacing[size]}` : `marginLeft: ${tokens.spacing[size]}`,

    marginEnd: (size: keyof typeof tokens.spacing) =>
      isRtl ? `marginLeft: ${tokens.spacing[size]}` : `marginRight: ${tokens.spacing[size]}`,

    paddingStart: (size: keyof typeof tokens.spacing) =>
      isRtl ? `paddingRight: ${tokens.spacing[size]}` : `paddingLeft: ${tokens.spacing[size]}`,

    paddingEnd: (size: keyof typeof tokens.spacing) =>
      isRtl ? `paddingLeft: ${tokens.spacing[size]}` : `paddingRight: ${tokens.spacing[size]}`,

    textAlign: isRtl ? 'right' as const : 'left' as const,

    // Flex direction helpers
    flexRow: isRtl ? 'row-reverse' as const : 'row' as const,

    // CSS class helpers for Tailwind
    classes: {
      textAlign: isRtl ? 'text-right' : 'text-left',
      marginStart: 'ms-auto',
      marginEnd: 'me-auto',
    }
  }), [isRtl, tokens.spacing]);

  return {
    tokens,
    rtl,
    isRtl,
    language,
  };
}

/**
 * CSS-in-JS Style Generator
 * Creates direction-aware styles using design tokens
 */
export function createTokenStyles(language: 'he' | 'en' | 'ru' = 'en') {
  const isRtl = language === 'he';

  return {
    // Common patterns
    searchContainer: {
      display: 'flex',
      gap: 'var(--cc-space-md)',
      width: '100%',
      marginBottom: 'var(--cc-space-md)',
    } as React.CSSProperties,

    searchInput: {
      flex: 1,
      fontSize: 'var(--cc-text-base)',
      padding: 'var(--cc-space-sm) var(--cc-space-md)',
      borderRadius: 'var(--cc-radius)',
      textAlign: isRtl ? 'right' as const : 'left' as const,
    } as React.CSSProperties,

    card: {
      background: 'var(--elevation-1-bg)',
      border: '1px solid var(--elevation-1-border)',
      borderRadius: 'var(--cc-radius-lg)',
      padding: 'var(--cc-space-lg)',
      boxShadow: 'var(--elevation-1-shadow)',
      transition: 'all 200ms ease',
    } as React.CSSProperties,

    button: {
      fontSize: 'var(--cc-text-base)',
      padding: 'var(--cc-space-sm) var(--cc-space-md)',
      borderRadius: 'var(--cc-radius)',
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      transition: 'all 200ms ease',
    } as React.CSSProperties,
  };
}

/**
 * Component className helper
 * Generates direction-aware Tailwind classes
 */
export function createTokenClasses(language: 'he' | 'en' | 'ru' = 'en') {
  const isRtl = language === 'he';

  return {
    // Text alignment
    textStart: isRtl ? 'text-right' : 'text-left',
    textEnd: isRtl ? 'text-left' : 'text-right',

    // Margins
    marginStart: 'ms-auto',
    marginEnd: 'me-auto',

    // Flex direction
    flexRow: isRtl ? 'flex-row-reverse' : 'flex-row',

    // Common patterns
    searchContainer: 'flex gap-3 w-full mb-4',
    searchInput: `flex-1 ${isRtl ? 'text-right' : 'text-left'}`,
  };
}