'use client'

import { useCallback } from 'react'
import { DARK_THEMES, LIGHT_THEMES, applyTheme, type ThemePalette } from '@/lib/themes'
import { useThemeStore } from '@/lib/theme-store'
import { useSettings } from '@/contexts/SettingsContext'
import { getTranslations } from '@/lib/i18n'

export function ThemeSwitcher() {
  const { activeThemeId, setTheme } = useThemeStore()
  const { language } = useSettings()
  const t = getTranslations(language)

  const handlePreview = useCallback((themeId: string) => {
    applyTheme(themeId)
  }, [])

  const handleRestore = useCallback(() => {
    applyTheme(activeThemeId)
  }, [activeThemeId])

  return (
    <div className="space-y-4">
      {/* Dark themes */}
      <div>
        <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {t.settings.darkThemes}
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          {DARK_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={activeThemeId === theme.id}
              onSelect={() => setTheme(theme.id)}
              onPreview={() => handlePreview(theme.id)}
              onRestore={handleRestore}
            />
          ))}
        </div>
      </div>

      {/* Light themes */}
      <div>
        <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {t.settings.lightThemes}
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          {LIGHT_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={activeThemeId === theme.id}
              onSelect={() => setTheme(theme.id)}
              onPreview={() => handlePreview(theme.id)}
              onRestore={handleRestore}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
  onPreview,
  onRestore,
}: {
  theme: ThemePalette
  isActive: boolean
  onSelect: () => void
  onPreview: () => void
  onRestore: () => void
}) {
  const { colors } = theme
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onPreview}
      onMouseLeave={onRestore}
      title={theme.name}
      className={`flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer ${
        isActive
          ? 'border-[var(--cc-accent-500)] ring-2 ring-[var(--cc-accent-500)]/20'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      {/* Preview */}
      <div className="flex h-[72px]" style={{ background: colors.background }}>
        <div className="w-7" style={{ background: colors.surface, borderRight: `1px solid ${colors.text}18` }} />
        <div className="flex flex-1 flex-col">
          <div className="flex h-[18px] items-center px-1.5" style={{ borderBottom: `1px solid ${colors.text}18` }}>
            <div className="h-1 w-5 rounded-sm" style={{ background: colors.primary }} />
          </div>
          <div className="flex gap-1 p-1.5">
            {[
              { color: colors.background, label: 'bg' },
              { color: colors.surface, label: 'srf' },
              { color: colors.primary, label: 'pri' },
            ].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="block h-3.5 w-3.5 rounded-sm" style={{ background: c.color }} />
                <span className="text-[7px] leading-none" style={{ color: colors.text, opacity: 0.4 }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Name */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5">
        <span className="truncate text-xs font-medium text-slate-200">
          {theme.name}
        </span>
        {isActive && (
          <span className="shrink-0 rounded border border-[var(--cc-accent-500)]/30 bg-[var(--cc-accent-600-20)] px-1.5 py-px text-[10px] font-medium text-[var(--cc-accent-400)]">
            Active
          </span>
        )}
      </div>
    </button>
  )
}
