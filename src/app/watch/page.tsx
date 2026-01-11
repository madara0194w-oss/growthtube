'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, BellOff } from 'lucide-react'
import { YouTubePlayer } from '@/components/video/YouTubePlayer'
import { VideoCard } from '@/components/video/VideoCard'
import { VideoActions } from '@/components/video/VideoActions'
import { CommentSection } from '@/components/video/CommentSection'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { VideoGridSkeleton } from '@/components/ui/Skeleton'
import { formatViewCount, formatDate, getChannelUrl } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import apiClient from '@/lib/api-client'

function WatchPageContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const { data: session } = useSession()
  const { openModal } = useStore()
  
  const [video, setVideo] = useState<any | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<any[]>([])
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!session?.user

  useEffect(() => {
    if (videoId) {
      fetchVideo()
    }
  }, [videoId])

  const fetchVideo = async () => {
    setIsLoading(true)
    try {
      const videoData = await apiClient.getVideo(videoId!)
      setVideo(videoData)
      setSubscribed(videoData.channel?.isSubscribed || false)
      
      // Add to watch history if authenticated
      if (session?.user) {
        apiClient.addToWatchHistory(videoId!).catch(() => {})
      }
      
      // Get related videos
      const related = await apiClient.getVideos({ limit: 20 })
      setRelatedVideos(related.videos.filter((v: any) => v.id !== videoId))
    } catch (error) {
      console.error('Failed to fetch video:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      openModal('login')
      return
    }
    if (video?.channel?.handle) {
      try {
        const result = await apiClient.subscribeToChannel(video.channel.handle)
        setSubscribed(result.subscribed)
      } catch (error) {
        console.error('Failed to subscribe:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--text-secondary)]">Video not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Video Player */}
        <div className="-mx-4 md:-mx-6 xl:mx-0">
          <YouTubePlayer
            videoUrl={video.videoUrl}
            title={video.title}
          />
        </div>

        {/* Video Info */}
        <div className="mt-4">
          <h1 className="text-xl font-semibold">{video.title}</h1>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
            {/* Channel Info */}
            <div className="flex items-center gap-4">
              <Link href={getChannelUrl(video.channel.handle)}>
                <Avatar src={video.channel.avatar} alt={video.channel.name} size="md" />
              </Link>
              <div>
                <Link href={getChannelUrl(video.channel.handle)} className="font-medium hover:text-[var(--text-primary)]">
                  {video.channel.name}
                  {video.channel.isVerified && <span className="ml-1 text-[var(--text-tertiary)]">✓</span>}
                </Link>
                <p className="text-sm text-[var(--text-secondary)]">
                  {formatViewCount(video.channel.subscriberCount)} subscribers
                </p>
              </div>
              <Button
                variant={subscribed ? 'secondary' : 'primary'}
                onClick={handleSubscribe}
                leftIcon={subscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            </div>

            {/* Actions */}
            <VideoActions video={video} />
          </div>

          {/* Description */}
          <div className="mt-4 bg-[var(--bg-tertiary)] rounded-xl p-3">
            <div className="flex gap-2 text-sm font-medium mb-2">
              <span>{formatViewCount(video.views)} views</span>
              <span>•</span>
              <span>{formatDate(video.publishedAt)}</span>
            </div>
            <div className={`text-sm whitespace-pre-wrap ${!showFullDescription && 'line-clamp-3'}`}>
              {video.description}
            </div>
            {video.description.length > 200 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-sm font-medium mt-2 hover:text-[var(--text-primary)]"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {video.tags.map((tag: any) => (
                  <Link
                    key={tag}
                    href={`/results?search_query=${encodeURIComponent(tag)}`}
                    className="text-xs text-blue-500 hover:text-blue-400"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <CommentSection videoId={video.id} commentCount={1234} />
        </div>
      </div>

      {/* Related Videos Sidebar */}
      <aside className="xl:w-[400px] flex-shrink-0">
        <h3 className="font-medium mb-4 hidden xl:block">Related videos</h3>
        <div className="space-y-3">
          {relatedVideos.map((relatedVideo) => (
            <VideoCard
              key={relatedVideo.id}
              video={relatedVideo}
              variant="compact"
            />
          ))}
        </div>
      </aside>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense fallback={<VideoGridSkeleton count={1} />}>
      <WatchPageContent />
    </Suspense>
  )
}
