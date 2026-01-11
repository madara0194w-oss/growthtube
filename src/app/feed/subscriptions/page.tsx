'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PlaySquare, Grid, List } from 'lucide-react'
import { VideoGrid } from '@/components/video/VideoGrid'
import { VideoCard } from '@/components/video/VideoCard'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useStore } from '@/store/useStore'
import apiClient from '@/lib/api-client'

export default function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const { openModal } = useStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [subscribedChannels, setSubscribedChannels] = useState<any[]>([])
  const [subscriptionVideos, setSubscriptionVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = status === 'authenticated'

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptions()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const fetchSubscriptions = async () => {
    try {
      const [subsData, feedData] = await Promise.all([
        apiClient.getSubscriptions({ limit: 50 }),
        apiClient.getSubscriptionFeed({ limit: 50 }),
      ])
      setSubscribedChannels(subsData.subscriptions.map((s: any) => s.channel))
      setSubscriptionVideos(feedData.videos)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <PlaySquare className="w-24 h-24 text-[var(--text-tertiary)] mb-6" />
        <h1 className="text-2xl font-bold mb-2">Don&apos;t miss new videos</h1>
        <p className="text-[var(--text-secondary)] mb-6 max-w-md">
          Sign in to see updates from your favorite GrowthTube channels
        </p>
        <Button onClick={() => openModal('login')}>Sign in</Button>
      </div>
    )
  }

  if (subscribedChannels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <PlaySquare className="w-24 h-24 text-[var(--text-tertiary)] mb-6" />
        <h1 className="text-2xl font-bold mb-2">No subscriptions yet</h1>
        <p className="text-[var(--text-secondary)] mb-6 max-w-md">
          Subscribe to channels to see their latest videos here
        </p>
        <Link href="/">
          <Button>Browse videos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[var(--bg-tertiary)]' : ''}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[var(--bg-tertiary)]' : ''}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Subscribed Channels */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {subscribedChannels.map(channel => (
          <Link
            key={channel.id}
            href={`/@${channel.handle}`}
            className="flex flex-col items-center gap-2 min-w-[80px]"
          >
            <Avatar src={channel.avatar} alt={channel.name} size="lg" />
            <span className="text-xs text-center line-clamp-1">{channel.name}</span>
          </Link>
        ))}
      </div>

      {/* Videos */}
      {viewMode === 'grid' ? (
        <VideoGrid videos={subscriptionVideos} />
      ) : (
        <div className="space-y-4">
          {subscriptionVideos.map(video => (
            <VideoCard key={video.id} video={video} variant="horizontal" />
          ))}
        </div>
      )}
    </div>
  )
}
