// src/lib/theme-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyTheme, DEFAULT_THEME_ID, getThemeById, type ThemePalette } from '@/lib/themes'

interface ThemeState {
  activeThemeId: string
  activeTheme: ThemePalette
  setTheme: (id: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeThemeId: DEFAULT_THEME_ID,
      activeTheme: getThemeById(DEFAULT_THEME_ID),
      setTheme: (id) => {
        applyTheme(id)
        set({ activeThemeId: id, activeTheme: getThemeById(id) })
      },
    }),
    {
      name: 'gam-theme-v1',
      onRehydrateStorage: () => (state) => {
        if (state?.activeThemeId) applyTheme(state.activeThemeId)
      },
    }
  )
)
