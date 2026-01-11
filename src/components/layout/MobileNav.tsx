'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X, Home, Zap, PlaySquare, History, ListVideo, Clock, ThumbsUp, Flame, Music, Gamepad2, Settings } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/IconButton'
import { mockChannels } from '@/lib/mock-data'
import { SITE_NAME } from '@/lib/constants'

export function MobileNav() {
  const pathname = usePathname()
  const { sidebar, setMobileSidebarOpen, isAuthenticated, subscriptions } = useStore()
  const subscribedChannels = mockChannels.filter(ch => subscriptions.includes(ch.id))

  if (!sidebar.isMobileOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[280px] bg-[var(--bg-primary)] z-50 overflow-y-auto animate-slide-in lg:hidden">
        {/* Header */}
        <div className="flex items-center gap-4 h-14 px-4 border-b border-[var(--border-color)]">
          <IconButton onClick={() => setMobileSidebarOpen(false)} aria-label="Close menu">
            <X className="w-5 h-5" />
          </IconButton>
          <Link href="/" className="flex items-center" onClick={() => setMobileSidebarOpen(false)}>
            <Image 
              src="/growtube.png" 
              alt="GrowthTube" 
              width={32} 
              height={32} 
              className="h-8 w-auto"
            />
            <span className="text-xl font-semibold -ml-1">{SITE_NAME}</span>
          </Link>
        </div>

        <div className="py-3 px-3">
          {/* Main Nav */}
          <nav>
            <MobileNavItem href="/" icon={<Home className="w-5 h-5" />} label="Home" isActive={pathname === '/'} />
            <MobileNavItem href="/shorts" icon={<Zap className="w-5 h-5" />} label="Shorts" isActive={pathname === '/shorts'} />
            <MobileNavItem href="/feed/subscriptions" icon={<PlaySquare className="w-5 h-5" />} label="Subscriptions" isActive={pathname === '/feed/subscriptions'} />
          </nav>

          <hr className="my-3 border-[var(--border-color)]" />

          {/* You */}
          <div>
            <h3 className="px-3 py-2 text-base font-medium">You</h3>
            <MobileNavItem href="/feed/history" icon={<History className="w-5 h-5" />} label="History" isActive={pathname === '/feed/history'} />
            <MobileNavItem href="/feed/playlists" icon={<ListVideo className="w-5 h-5" />} label="Playlists" isActive={pathname === '/feed/playlists'} />
            <MobileNavItem href="/playlist?list=WL" icon={<Clock className="w-5 h-5" />} label="Watch later" isActive={pathname.includes('WL')} />
            <MobileNavItem href="/playlist?list=LL" icon={<ThumbsUp className="w-5 h-5" />} label="Liked videos" isActive={pathname.includes('LL')} />
          </div>

          <hr className="my-3 border-[var(--border-color)]" />

          {/* Subscriptions */}
          {isAuthenticated && subscribedChannels.length > 0 && (
            <>
              <div>
                <h3 className="px-3 py-2 text-base font-medium">Subscriptions</h3>
                {subscribedChannels.map((channel) => (
                  <Link key={channel.id} href={`/@${channel.handle}`} className="sidebar-item" onClick={() => setMobileSidebarOpen(false)}>
                    <Avatar src={channel.avatar} alt={channel.name} size="xs" />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                ))}
              </div>
              <hr className="my-3 border-[var(--border-color)]" />
            </>
          )}

          {/* Explore */}
          <div>
            <h3 className="px-3 py-2 text-base font-medium">Explore</h3>
            <MobileNavItem href="/feed/trending" icon={<Flame className="w-5 h-5" />} label="Trending" isActive={pathname === '/feed/trending'} />
            <MobileNavItem href="/channel/music" icon={<Music className="w-5 h-5" />} label="Music" isActive={pathname === '/channel/music'} />
            <MobileNavItem href="/gaming" icon={<Gamepad2 className="w-5 h-5" />} label="Gaming" isActive={pathname === '/gaming'} />
          </div>

          <hr className="my-3 border-[var(--border-color)]" />

          <MobileNavItem href="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" isActive={pathname === '/settings'} />
        </div>
      </aside>
    </>
  )
}

function MobileNavItem({ href, icon, label, isActive }: { href: string; icon: React.ReactNode; label: string; isActive: boolean }) {
  const { setMobileSidebarOpen } = useStore()
  return (
    <Link
      href={href}
      onClick={() => setMobileSidebarOpen(false)}
      className={cn('sidebar-item', isActive && 'sidebar-item-active')}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
