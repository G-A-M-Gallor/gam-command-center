'use client'

import { DARK_THEMES, type ThemePalette } from '@/lib/themes'
import { useThemeStore } from '@/lib/theme-store'

export function ThemeSwitcher() {
  const { activeThemeId, setTheme } = useThemeStore()

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {DARK_THEMES.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isActive={activeThemeId === theme.id}
          onSelect={() => setTheme(theme.id)}
        />
      ))}
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
      type="button"
      onClick={onSelect}
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
            {[colors.primary, colors.secondary, colors.accent].map((c, i) => (
              <span key={i} className="block h-3.5 w-3.5 rounded-sm" style={{ background: c }} />
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
