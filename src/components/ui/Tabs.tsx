'use client'

import { ReactNode, createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
  activeTab: string
  setActiveTab: (id: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultTab: string
  children: ReactNode
  className?: string
  onChange?: (tabId: string) => void
}

export function Tabs({ defaultTab, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    onChange?.(id)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: ReactNode
  className?: string
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div
      className={cn(
        'flex border-b border-[var(--border-color)] overflow-x-auto scrollbar-hide',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

interface TabProps {
  id: string
  children: ReactNode
  className?: string
}

export function Tab({ id, children, className }: TabProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const isActive = context.activeTab === id

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveTab(id)}
      className={cn(
        'px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors',
        'hover:bg-[var(--bg-tertiary)]',
        isActive
          ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]'
          : 'text-[var(--text-secondary)]',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabPanelProps {
  id: string
  children: ReactNode
  className?: string
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabPanel must be used within Tabs')

  if (context.activeTab !== id) return null

  return (
    <div role="tabpanel" className={cn('py-4', className)}>
      {children}
    </div>
  )
}
