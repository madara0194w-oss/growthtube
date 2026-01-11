'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Menu,
  Search,
  Mic,
  Video,
  Bell,
  User,
  Settings,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/IconButton'
import { SITE_NAME } from '@/lib/constants'

export function Header() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const {
    toggleSidebar,
    setMobileSidebarOpen,
    searchQuery,
    setSearchQuery,
    searchHistory,
    addToSearchHistory,
    openModal,
  } = useStore()
  
  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  const [showSearch, setShowSearch] = useState(false)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery.trim())
      router.push(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearchSuggestions(false)
    }
  }

  const handleSearchFromHistory = (query: string) => {
    setSearchQuery(query)
    router.push(`/results?search_query=${encodeURIComponent(query)}`)
    setShowSearchSuggestions(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section - Menu & Logo */}
        <div className="flex items-center gap-4">
          <IconButton
            onClick={() => {
              toggleSidebar()
              setMobileSidebarOpen(true)
            }}
            className="hidden md:flex"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </IconButton>
          
          <IconButton
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </IconButton>

          <Link href="/" className="flex items-center">
            <Image 
              src="/growtube.png" 
              alt="GrowthTube" 
              width={40} 
              height={40} 
              className="h-10 w-auto"
              priority
            />
            <span className="text-xl font-semibold hidden sm:block -ml-2">{SITE_NAME}</span>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div
          ref={searchContainerRef}
          className={cn(
            'flex-1 max-w-2xl mx-4',
            showSearch ? 'absolute inset-x-0 top-0 h-14 bg-[var(--bg-primary)] px-4 flex items-center z-50 md:relative md:h-auto md:px-0' : 'hidden md:block'
          )}
        >
          <div className="flex items-center w-full">
            <form onSubmit={handleSearch} className="flex flex-1">
              {showSearch && (
                <IconButton
                  onClick={() => setShowSearch(false)}
                  className="md:hidden mr-2"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </IconButton>
              )}
              
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className="input-search w-full"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSearchSuggestions && searchHistory.length > 0 && (
                  <div className="dropdown left-0 right-0 top-full mt-1">
                    {searchHistory.map((query, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSearchFromHistory(query)}
                        className="dropdown-item w-full text-left"
                      >
                        <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span>{query}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-5 bg-[var(--bg-tertiary)] border border-l-0 border-[var(--border-color)] rounded-r-full hover:bg-[var(--bg-hover)] transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            <IconButton className="ml-2 hidden md:flex" aria-label="Search with voice">
              <Mic className="w-5 h-5" />
            </IconButton>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile Search Button */}
          <IconButton
            onClick={() => {
              setShowSearch(true)
              setTimeout(() => searchInputRef.current?.focus(), 100)
            }}
            className="md:hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </IconButton>

          {isAuthenticated ? (
            <>
              <IconButton aria-label="Create" onClick={() => openModal('upload')}>
                <Video className="w-5 h-5" />
              </IconButton>

              <div className="relative">
                <IconButton
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </IconButton>
                
                {showNotifications && (
                  <div className="dropdown right-0 top-full mt-2 w-80">
                    <div className="px-4 py-3 border-b border-[var(--border-color)]">
                      <h3 className="font-medium">Notifications</h3>
                    </div>
                    <div className="py-8 text-center text-[var(--text-secondary)]">
                      <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  </div>
                )}
              </div>

              <div ref={userMenuRef} className="relative ml-2">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <Avatar
                    src={(user as any)?.avatar || user?.image}
                    alt={(user as any)?.displayName || user?.name || 'User'}
                    size="sm"
                  />
                </button>

                {showUserMenu && (
                  <div className="dropdown right-0 top-full mt-2 w-72">
                    <div className="px-4 py-3 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-3">
                        <Avatar src={(user as any)?.avatar || user?.image} alt={(user as any)?.displayName || user?.name || ''} size="md" />
                        <div>
                          <p className="font-medium">{(user as any)?.displayName || user?.name}</p>
                          <p className="text-sm text-[var(--text-secondary)]">@{user?.username}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link href={`/@${(user as any)?.channelHandle || user?.username}`} className="dropdown-item">
                        <User className="w-5 h-5" />
                        <span>Your channel</span>
                      </Link>
                      <Link href="/studio" className="dropdown-item">
                        <Video className="w-5 h-5" />
                        <span>GrowthTube Studio</span>
                      </Link>
                    </div>

                    <div className="py-2 border-t border-[var(--border-color)]">
                      <button
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="dropdown-item w-full"
                      >
                        {resolvedTheme === 'dark' ? (
                          <>
                            <Sun className="w-5 h-5" />
                            <span>Light mode</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-5 h-5" />
                            <span>Dark mode</span>
                          </>
                        )}
                      </button>
                      <Link href="/settings" className="dropdown-item">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </Link>
                      <Link href="/help" className="dropdown-item">
                        <HelpCircle className="w-5 h-5" />
                        <span>Help</span>
                      </Link>
                    </div>

                    <div className="py-2 border-t border-[var(--border-color)]">
                      <button onClick={() => signOut({ callbackUrl: '/' })} className="dropdown-item w-full text-[var(--accent)]">
                        <LogOut className="w-5 h-5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <IconButton
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="hidden sm:flex"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </IconButton>

              <button
                onClick={() => openModal('login')}
                className="flex items-center gap-2 ml-2 px-3 py-1.5 border border-[var(--border-color)] rounded-full text-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
