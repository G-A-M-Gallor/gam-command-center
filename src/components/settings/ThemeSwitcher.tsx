'use client'

import { useState } from 'react'
import { DARK_THEMES, LIGHT_THEMES, type ThemePalette } from '@/lib/themes'
import { useThemeStore } from '@/lib/theme-store'

export function ThemeSwitcher() {
  const { activeThemeId, setTheme } = useThemeStore()
  const [tab, setTab] = useState<'dark' | 'light'>('dark')
  const themes = tab === 'dark' ? DARK_THEMES : LIGHT_THEMES

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--theme-border)', gap: 2 }}>
        {(['dark', 'light'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 500,
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--theme-primary)' : '2px solid transparent',
              marginBottom: -1,
              color: tab === t ? 'var(--theme-text)' : 'var(--theme-text-muted)',
              cursor: 'pointer',
              transition: 'color 120ms ease',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={activeThemeId === theme.id}
            onSelect={() => setTheme(theme.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: ThemePalette
  isActive: boolean
  onSelect: () => void
}) {
  const { colors } = theme
  return (
    <button
      onClick={onSelect}
      title={theme.name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        background: 'none',
        border: `1px solid ${isActive ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
        borderRadius: 8,
        cursor: 'pointer',
        overflow: 'hidden',
        textAlign: 'left',
        boxShadow: isActive ? '0 0 0 2px var(--theme-primary)30' : 'none',
        transition: 'border-color 120ms ease',
      }}
    >
      {/* Preview */}
      <div style={{ display: 'flex', height: 72, background: colors.background }}>
        <div style={{ width: 28, background: colors.surface, borderRight: `1px solid ${colors.text}18` }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 18, display: 'flex', alignItems: 'center', padding: '0 6px', borderBottom: `1px solid ${colors.text}18` }}>
            <div style={{ width: 20, height: 4, borderRadius: 2, background: colors.primary }} />
          </div>
          <div style={{ display: 'flex', gap: 4, padding: '8px 6px' }}>
            {[colors.primary, colors.secondary, colors.accent].map((c, i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c, display: 'block' }} />
            ))}
          </div>
        </div>
      </div>
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 8px', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {theme.name}
        </span>
        {isActive && (
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--theme-primary)', background: 'var(--theme-primary)18', border: '1px solid var(--theme-primary)40', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
            Active
          </span>
        )}
      </div>
    </button>
  )
}
