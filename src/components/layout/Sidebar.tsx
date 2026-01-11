'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Zap,
  PlaySquare,
  History,
  ListVideo,
  Clock,
  ThumbsUp,
  Flame,
  Music,
  Gamepad2,
  Newspaper,
  Trophy,
  Settings,
  HelpCircle,
  Flag,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { mockChannels } from '@/lib/mock-data'
import { AdminPasswordModal } from '@/components/admin/AdminPasswordModal'

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  PlaySquare: <PlaySquare className="w-5 h-5" />,
  History: <History className="w-5 h-5" />,
  ListVideo: <ListVideo className="w-5 h-5" />,
  Clock: <Clock className="w-5 h-5" />,
  ThumbsUp: <ThumbsUp className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Music: <Music className="w-5 h-5" />,
  Gamepad2: <Gamepad2 className="w-5 h-5" />,
  Newspaper: <Newspaper className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
}

const mainNavItems = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'shorts', label: 'Shorts', href: '/shorts', icon: 'Zap' },
  { id: 'subscriptions', label: 'Subscriptions', href: '/feed/subscriptions', icon: 'PlaySquare' },
]

const youNavItems = [
  { id: 'history', label: 'History', href: '/feed/history', icon: 'History' },
  { id: 'playlists', label: 'Playlists', href: '/feed/playlists', icon: 'ListVideo' },
  { id: 'watch-later', label: 'Watch later', href: '/playlist?list=WL', icon: 'Clock' },
  { id: 'liked', label: 'Liked videos', href: '/playlist?list=LL', icon: 'ThumbsUp' },
]

const exploreNavItems = [
  { id: 'trending', label: 'Trending', href: '/feed/trending', icon: 'Flame' },
  { id: 'music', label: 'Music', href: '/channel/music', icon: 'Music' },
  { id: 'gaming', label: 'Gaming', href: '/gaming', icon: 'Gamepad2' },
  { id: 'news', label: 'News', href: '/channel/news', icon: 'Newspaper' },
  { id: 'sports', label: 'Sports', href: '/channel/sports', icon: 'Trophy' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebar, isAuthenticated, subscriptions } = useStore()
  const [showAdminModal, setShowAdminModal] = useState(false)

  // Get subscribed channels (mock for now)
  const subscribedChannels = mockChannels.filter(ch => subscriptions.includes(ch.id))

  return (
    <aside
      className={cn(
        'fixed top-14 left-0 h-[calc(100vh-56px)] bg-[var(--bg-primary)] z-40 overflow-y-auto scrollbar-hide transition-sidebar hidden lg:block',
        sidebar.isExpanded ? 'w-[240px]' : 'w-[72px]'
      )}
    >
      <div className={cn('py-3', sidebar.isExpanded ? 'px-3' : 'px-1')}>
        {/* Main Navigation */}
        <nav>
          {mainNavItems.map((item) => (
            <SidebarItem
              key={item.id}
              href={item.href}
              icon={iconMap[item.icon]}
              label={item.label}
              isActive={pathname === item.href}
              isExpanded={sidebar.isExpanded}
            />
          ))}
        </nav>

        {sidebar.isExpanded && (
          <>
            {/* Divider */}
            <hr className="my-3 border-[var(--border-color)]" />

            {/* You Section */}
            <div>
              <h3 className="px-3 py-2 text-base font-medium">You</h3>
              {youNavItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  href={item.href}
                  icon={iconMap[item.icon]}
                  label={item.label}
                  isActive={pathname === item.href}
                  isExpanded={sidebar.isExpanded}
                />
              ))}
            </div>

            {/* Divider */}
            <hr className="my-3 border-[var(--border-color)]" />

            {/* Subscriptions */}
            {isAuthenticated && subscribedChannels.length > 0 && (
              <>
                <div>
                  <h3 className="px-3 py-2 text-base font-medium">Subscriptions</h3>
                  {subscribedChannels.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/@${channel.handle}`}
                      className="sidebar-item"
                    >
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
              {exploreNavItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  href={item.href}
                  icon={iconMap[item.icon]}
                  label={item.label}
                  isActive={pathname === item.href}
                  isExpanded={sidebar.isExpanded}
                />
              ))}
            </div>

            {/* Divider */}
            <hr className="my-3 border-[var(--border-color)]" />

            {/* Settings & Help */}
            <div>
              <SidebarItem
                href="/settings"
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
                isActive={pathname === '/settings'}
                isExpanded={sidebar.isExpanded}
              />
              <SidebarItem
                href="/help"
                icon={<HelpCircle className="w-5 h-5" />}
                label="Help"
                isActive={pathname === '/help'}
                isExpanded={sidebar.isExpanded}
              />
              <SidebarItem
                href="/feedback"
                icon={<Flag className="w-5 h-5" />}
                label="Send feedback"
                isActive={pathname === '/feedback'}
                isExpanded={sidebar.isExpanded}
              />
            </div>

            {/* Footer */}
            <div className="mt-4 px-3 py-4 text-xs text-[var(--text-tertiary)]">
              <div className="flex flex-wrap gap-2 mb-3">
                <Link href="/about" className="hover:underline">About</Link>
                <Link href="/press" className="hover:underline">Press</Link>
                <Link href="/copyright" className="hover:underline">Copyright</Link>
                <Link href="/contact" className="hover:underline">Contact us</Link>
                <Link href="/creators" className="hover:underline">Creators</Link>
                <Link href="/advertise" className="hover:underline">Advertise</Link>
                <Link href="/developers" className="hover:underline">Developers</Link>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Link href="/terms" className="hover:underline">Terms</Link>
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                <Link href="/policy" className="hover:underline">Policy & Safety</Link>
                <Link href="/how-growthtube-works" className="hover:underline">How GrowthTube works</Link>
              </div>
              <p className="mt-4">© <span onClick={() => setShowAdminModal(true)} className="cursor-pointer hover:text-[var(--text-secondary)] select-none">2026</span> GrowthTube</p>
            </div>
            
            {/* Admin Password Modal */}
            <AdminPasswordModal 
              isOpen={showAdminModal} 
              onClose={() => setShowAdminModal(false)} 
            />
          </>
        )}

        {/* Mini sidebar view */}
        {!sidebar.isExpanded && (
          <div className="mt-4">
            {youNavItems.slice(0, 3).map((item) => (
              <SidebarItem
                key={item.id}
                href={item.href}
                icon={iconMap[item.icon]}
                label={item.label}
                isActive={pathname === item.href}
                isExpanded={false}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  isExpanded: boolean
}

function SidebarItem({ href, icon, label, isActive, isExpanded }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-lg transition-colors',
        isExpanded
          ? 'gap-6 px-3 py-2.5 hover:bg-[var(--bg-tertiary)]'
          : 'flex-col gap-1 py-4 px-1 text-[10px] hover:bg-[var(--bg-tertiary)]',
        isActive && 'bg-[var(--bg-tertiary)] font-medium'
      )}
    >
      {icon}
      <span className={cn(!isExpanded && 'text-center')}>{label}</span>
    </Link>
  )
}
