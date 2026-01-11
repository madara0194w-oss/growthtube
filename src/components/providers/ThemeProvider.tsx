'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Theme } from '@/types'
import { storage } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/constants'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
  mounted: false,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = storage.get<Theme>(STORAGE_KEYS.theme, 'dark')
    setThemeState(savedTheme)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    const applyTheme = (newTheme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark')
      root.classList.add(newTheme)
      setResolvedTheme(newTheme)
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches ? 'dark' : 'light')

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }

      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      applyTheme(theme)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    storage.set(STORAGE_KEYS.theme, newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, mounted }}>
      <div className={mounted ? '' : 'dark'}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  return context
}
