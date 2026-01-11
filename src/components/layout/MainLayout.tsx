'use client'

import { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebar } = useStore()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <Sidebar />
      <MobileNav />
      
      <main
        className={cn(
          'pt-14 min-h-screen transition-all duration-200',
          'lg:ml-[240px]',
          !sidebar.isExpanded && 'lg:ml-[72px]'
        )}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
