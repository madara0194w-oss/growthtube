'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { MainLayout } from './MainLayout'
import { AuthModals } from '@/components/auth/AuthModals'
import { ToastContainer } from '@/components/ui/Toast'

interface ClientLayoutProps {
  children: ReactNode
}

// Pages that should not have the main layout (header, sidebar)
const STANDALONE_PAGES = ['/verify-email', '/reset-password']

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const isStandalonePage = STANDALONE_PAGES.some(page => pathname?.startsWith(page))

  if (isStandalonePage) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <MainLayout>
        {children}
      </MainLayout>
      <AuthModals />
      <ToastContainer />
    </>
  )
}
