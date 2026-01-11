'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { History, Trash2, Search, Pause } from 'lucide-react'
import { VideoCard } from '@/components/video/VideoCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useStore } from '@/store/useStore'
import apiClient from '@/lib/api-client'

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const { openModal } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [historyVideos, setHistoryVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = status === 'authenticated'

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const fetchHistory = async () => {
    try {
      const data = await apiClient.getWatchHistory({ limit: 50 })
      setHistoryVideos(data.history.map((item: any) => item.video))
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    try {
      await apiClient.clearWatchHistory()
      setHistoryVideos([])
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  // Filter by search query
  const filteredVideos = searchQuery
    ? historyVideos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.channel?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : historyVideos

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
        <History className="w-24 h-24 text-[var(--text-tertiary)] mb-6" />
        <h1 className="text-2xl font-bold mb-2">Keep track of what you watch</h1>
        <p className="text-[var(--text-secondary)] mb-6 max-w-md">
          Watch history isn't viewable when signed out
        </p>
        <Button onClick={() => openModal('login')}>Sign in</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Watch history</h1>

        {historyVideos.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">
              Videos you watch will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} variant="horizontal" />
            ))}
            {filteredVideos.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">
                  No videos found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:w-80 flex-shrink-0">
        <div className="sticky top-20 space-y-4">
          <Input
            placeholder="Search watch history"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />

          <div className="space-y-2">
            <Button
              variant="ghost"
              fullWidth
              leftIcon={<Trash2 className="w-5 h-5" />}
              onClick={handleClearHistory}
              className="justify-start"
            >
              Clear all watch history
            </Button>
            <Button
              variant="ghost"
              fullWidth
              leftIcon={<Pause className="w-5 h-5" />}
              className="justify-start"
            >
              Pause watch history
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
