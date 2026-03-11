'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/theme-store'

export function ThemeInit() {
  const { activeThemeId } = useThemeStore()
  useEffect(() => {
    import('@/lib/themes').then(({ applyTheme }) => applyTheme(activeThemeId))
  }, [activeThemeId])
  return null
}
