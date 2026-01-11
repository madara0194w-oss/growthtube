'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { SessionProvider } from './SessionProvider'

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
