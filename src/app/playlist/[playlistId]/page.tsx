'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Play, Shuffle, Plus, Share2, MoreVertical } from 'lucide-react'
import { VideoCard } from '@/components/video/VideoCard'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Avatar } from '@/components/ui/Avatar'
import { VideoGridSkeleton } from '@/components/ui/Skeleton'

export default function PlaylistPage() {
  const params = useParams()
  const playlistId = params.playlistId as string

  const [playlist, setPlaylist] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        // Since there's no playlist API endpoint yet, we'll show a placeholder
        // In the future, this would call: /api/playlists/[playlistId]
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch playlist:', error)
        setIsLoading(false)
      }
    }

    fetchPlaylist()
  }, [playlistId])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-[var(--bg-secondary)] rounded-xl"></div>
          <VideoGridSkeleton count={6} />
        </div>
      </div>
    )
  }

  // Placeholder UI
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-80 h-48 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
            <Play className="w-16 h-16 text-[var(--text-secondary)]" />
          </div>

          <div className="flex-1">
            <p className="text-sm text-[var(--text-secondary)] mb-2">Playlist</p>
            <h1 className="text-3xl font-bold mb-4">Playlist Feature Coming Soon</h1>
            
            <div className="flex items-center gap-3 mb-4">
              <Avatar src="" alt="Owner" size="sm" />
              <div>
                <p className="font-medium">Playlist Owner</p>
                <p className="text-sm text-[var(--text-secondary)]">0 videos</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button leftIcon={<Play className="w-5 h-5" />} disabled>
                Play all
              </Button>
              <Button variant="secondary" leftIcon={<Shuffle className="w-5 h-5" />} disabled>
                Shuffle
              </Button>
              <IconButton disabled>
                <Share2 className="w-5 h-5" />
              </IconButton>
              <IconButton disabled>
                <MoreVertical className="w-5 h-5" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-xl p-8 text-center">
        <Plus className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
        <h2 className="text-xl font-semibold mb-2">Playlist functionality is not yet implemented</h2>
        <p className="text-[var(--text-secondary)]">
          The playlist API endpoints need to be created to enable this feature.
        </p>
      </div>
    </div>
  )
}
