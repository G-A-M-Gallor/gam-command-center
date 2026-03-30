// src/lib/themes.ts
// Uncodixfy Theme System — 20 palettes (10 dark, 10 light)

export type ThemeMode = 'dark' | 'light'

export interface ThemePalette {
  id: string
  name: string
  mode: ThemeMode
  colors: {
    background: string
    surface: string
    surface2?: string
    surface3?: string
    primary: string
    secondary: string
    accent: string
    text: string
    textMuted?: string
    textFaint?: string
    border?: string
    borderHigh?: string
    accentHigh?: string
    accentLow?: string
    accentBg?: string
    green?: string
    red?: string
    blue?: string
  }
}

export const DARK_THEMES: ThemePalette[] = [
  { id: 'default-slate', name: 'Default', mode: 'dark', colors: {
    background: '#0f172a', surface: '#1e293b', surface2: '#334155', surface3: '#475569',
    primary: '#a855f7', secondary: '#9333ea', accent: '#f97316',
    text: '#f1f5f9', textMuted: '#94a3b8', textFaint: '#64748b',
    border: 'rgba(255,255,255,0.1)', borderHigh: 'rgba(255,255,255,0.18)',
    accentHigh: '#f97316', accentLow: '#9333ea', accentBg: 'rgba(168,85,247,0.08)',
    green: '#4ade80', red: '#f87171', blue: '#7dd3fc',
  }},
  { id: 'midnight-canvas',  name: 'Midnight Canvas',  mode: 'dark',  colors: { background: '#0a0e27', surface: '#151b3d', primary: '#6c8eff', secondary: '#a78bfa', accent: '#f472b6', text: '#e2e8f0' } },
  { id: 'obsidian-depth',   name: 'Obsidian Depth',   mode: 'dark',  colors: { background: '#0f0f0f', surface: '#1a1a1a', primary: '#00d4aa', secondary: '#00a3cc', accent: '#ff6b9d', text: '#f5f5f5' } },
  { id: 'slate-noir',       name: 'Slate Noir',       mode: 'dark',  colors: { background: '#0f172a', surface: '#1e293b', primary: '#38bdf8', secondary: '#818cf8', accent: '#fb923c', text: '#f1f5f9' } },
  { id: 'carbon-elegance',  name: 'Carbon Elegance',  mode: 'dark',  colors: { background: '#121212', surface: '#1e1e1e', primary: '#bb86fc', secondary: '#03dac6', accent: '#cf6679', text: '#e1e1e1' } },
  { id: 'deep-ocean',       name: 'Deep Ocean',       mode: 'dark',  colors: { background: '#001e3c', surface: '#0a2744', primary: '#4fc3f7', secondary: '#29b6f6', accent: '#ffa726', text: '#eceff1' } },
  { id: 'charcoal-studio',  name: 'Charcoal Studio',  mode: 'dark',  colors: { background: '#1c1c1e', surface: '#2c2c2e', primary: '#0a84ff', secondary: '#5e5ce6', accent: '#ff375f', text: '#f2f2f7' } },
  { id: 'graphite-pro',     name: 'Graphite Pro',     mode: 'dark',  colors: { background: '#18181b', surface: '#27272a', primary: '#a855f7', secondary: '#ec4899', accent: '#14b8a6', text: '#fafafa' } },
  { id: 'void-space',       name: 'Void Space',       mode: 'dark',  colors: { background: '#0d1117', surface: '#161b22', primary: '#58a6ff', secondary: '#79c0ff', accent: '#f78166', text: '#c9d1d9' } },
  { id: 'twilight-mist',    name: 'Twilight Mist',    mode: 'dark',  colors: { background: '#1a1625', surface: '#2d2438', primary: '#9d7cd8', secondary: '#7aa2f7', accent: '#ff9e64', text: '#dcd7e8' } },
  { id: 'onyx-matrix',      name: 'Onyx Matrix',      mode: 'dark',  colors: { background: '#0e0e10', surface: '#1c1c21', primary: '#00ff9f', secondary: '#00e0ff', accent: '#ff0080', text: '#f0f0f0' } },
  { id: 'gam-dna', name: 'GAM DNA', mode: 'dark', colors: {
    background: '#0b0b09', surface: '#111110', surface2: '#181816', surface3: '#1f1f1d',
    primary: '#D08010', secondary: '#B8720C', accent: '#E8960E',
    text: '#e8e8e2', textMuted: '#858578', textFaint: '#5a5a52',
    border: 'rgba(255,255,255,0.06)', borderHigh: 'rgba(255,255,255,0.11)',
    accentHigh: '#E8960E', accentLow: '#B8720C', accentBg: 'rgba(184,114,12,0.08)',
    green: '#4ade80', red: '#f87171', blue: '#7dd3fc',
  }},
]

export const LIGHT_THEMES: ThemePalette[] = [
  { id: 'cloud-canvas',    name: 'Cloud Canvas',    mode: 'light', colors: { background: '#fafafa', surface: '#ffffff', primary: '#2563eb', secondary: '#7c3aed', accent: '#dc2626', text: '#0f172a' } },
  { id: 'pearl-minimal',   name: 'Pearl Minimal',   mode: 'light', colors: { background: '#f8f9fa', surface: '#ffffff', primary: '#0066cc', secondary: '#6610f2', accent: '#ff6b35', text: '#212529' } },
  { id: 'ivory-studio',    name: 'Ivory Studio',    mode: 'light', colors: { background: '#f5f5f4', surface: '#fafaf9', primary: '#0891b2', secondary: '#06b6d4', accent: '#f59e0b', text: '#1c1917' } },
  { id: 'linen-soft',      name: 'Linen Soft',      mode: 'light', colors: { background: '#fef7f0', surface: '#fffbf5', primary: '#d97706', secondary: '#ea580c', accent: '#0284c7', text: '#292524' } },
  { id: 'porcelain-clean', name: 'Porcelain Clean', mode: 'light', colors: { background: '#f9fafb', surface: '#ffffff', primary: '#4f46e5', secondary: '#8b5cf6', accent: '#ec4899', text: '#111827' } },
  { id: 'cream-elegance',  name: 'Cream Elegance',  mode: 'light', colors: { background: '#fefce8', surface: '#fefce8', primary: '#65a30d', secondary: '#84cc16', accent: '#f97316', text: '#365314' } },
  { id: 'arctic-breeze',   name: 'Arctic Breeze',   mode: 'light', colors: { background: '#f0f9ff', surface: '#f8fafc', primary: '#0284c7', secondary: '#0ea5e9', accent: '#f43f5e', text: '#0c4a6e' } },
  { id: 'alabaster-pure',  name: 'Alabaster Pure',  mode: 'light', colors: { background: '#fcfcfc', surface: '#ffffff', primary: '#1d4ed8', secondary: '#2563eb', accent: '#dc2626', text: '#1e293b' } },
  { id: 'sand-warm',       name: 'Sand Warm',       mode: 'light', colors: { background: '#faf8f5', surface: '#ffffff', primary: '#b45309', secondary: '#d97706', accent: '#059669', text: '#451a03' } },
  { id: 'frost-bright',    name: 'Frost Bright',    mode: 'light', colors: { background: '#f1f5f9', surface: '#f8fafc', primary: '#0f766e', secondary: '#14b8a6', accent: '#e11d48', text: '#0f172a' } },
]

export const ALL_THEMES: ThemePalette[] = [...DARK_THEMES, ...LIGHT_THEMES]
export const DEFAULT_THEME_ID = 'default-slate'

export function getThemeById(id: string): ThemePalette {
  return ALL_THEMES.find((_t) => t.id === id) ?? ALL_THEMES.find((_t) => t.id === DEFAULT_THEME_ID)!
}

function hexToRgb(hex: string): [number, number, number] | null {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : null
}
function alpha(hex: string, a: number) {
  const rgb = hexToRgb(hex); return rgb ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})` : hex
}
function lighten(hex: string, amt: number) {
  const rgb = hexToRgb(hex); if (!rgb) return hex
  return `rgb(${rgb.map(c => Math.min(255, Math.round(c + 255 * amt))).join(',')})`
}
function darken(hex: string, amt: number) {
  const rgb = hexToRgb(hex); if (!rgb) return hex
  return `rgb(${rgb.map(c => Math.max(0, Math.round(c - 255 * amt))).join(',')})`
}

export function applyTheme(themeId: string): void {
  if (typeof document === 'undefined') return
  const theme = getThemeById(themeId)
  const { colors, mode } = theme
  const isDark = mode === 'dark'
  const vars: Record<string, string> = {
    '--theme-bg':            colors.background,
    '--theme-surface':       colors.surface,
    '--theme-surface-2':     colors.surface2 ?? (isDark ? lighten(colors.surface, 0.04) : darken(colors.surface, 0.02)),
    '--theme-surface-3':     colors.surface3 ?? (isDark ? lighten(colors.surface, 0.08) : darken(colors.surface, 0.04)),
    '--theme-primary':       colors.primary,
    '--theme-secondary':     colors.secondary,
    '--theme-accent':        colors.accent,
    '--theme-text':          colors.text,
    '--theme-text-muted':    colors.textMuted ?? alpha(colors.text, isDark ? 0.5 : 0.55),
    '--theme-text-faint':    colors.textFaint ?? alpha(colors.text, isDark ? 0.3 : 0.35),
    '--theme-border':        colors.border ?? alpha(colors.text, isDark ? 0.1 : 0.12),
    '--theme-border-high':   colors.borderHigh ?? alpha(colors.text, isDark ? 0.18 : 0.2),
    '--theme-surface-hover': colors.surface2 ?? (isDark ? lighten(colors.surface, 0.05) : darken(colors.surface, 0.03)),
    '--theme-primary-hover': alpha(colors.primary, 0.85),
    '--theme-accent-high':   colors.accentHigh ?? colors.accent,
    '--theme-accent-low':    colors.accentLow ?? colors.secondary,
    '--theme-accent-bg':     colors.accentBg ?? alpha(colors.primary, 0.08),
    '--theme-green':         colors.green ?? '#4ade80',
    '--theme-red':           colors.red ?? '#f87171',
    '--theme-blue':          colors.blue ?? '#7dd3fc',
    '--theme-shadow-sm':     isDark ? '0 1px 3px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.08)',
    '--theme-shadow-md':     isDark ? '0 2px 8px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.1)',
    // Accent colors are controlled independently via [data-accent] CSS selectors
    // (see globals.css). No inline accent override here.
  }
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-theme', themeId)
  root.setAttribute('data-theme-mode', mode)
}
