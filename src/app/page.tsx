'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { VideoCategory } from '@/types'
import { CategoryChips } from '@/components/video/CategoryChips'
import { VideoGrid } from '@/components/video/VideoGrid'
import { VideoGridSkeleton } from '@/components/ui/Skeleton'
import apiClient from '@/lib/api-client'

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('all')
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Initial fetch
  useEffect(() => {
    setVideos([])
    setNextCursor(undefined)
    setHasMore(true)
    fetchVideos(true)
  }, [activeCategory])

  const fetchVideos = async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const data = await apiClient.getVideos({ 
        category: activeCategory === 'all' ? undefined : activeCategory,
        limit: 48, // Load 48 at a time (divisible by 4,3,2 for grid)
        cursor: isInitial ? undefined : nextCursor
      })

      if (isInitial) {
        setVideos(data.videos)
      } else {
        // Add new videos, avoiding duplicates
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id))
          const newVideos = data.videos.filter((v: any) => !existingIds.has(v.id))
          return [...prev, ...newVideos]
        })
      }

      setNextCursor(data.nextCursor)
      setHasMore(!!data.nextCursor && data.videos.length > 0)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchVideos(false)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, nextCursor])

  return (
    <div className="space-y-6">
      {/* Category Filter Chips */}
      <div className="sticky top-14 z-30 bg-[var(--bg-primary)] -mx-4 md:-mx-6 px-4 md:px-6 py-2 border-b border-[var(--border-color)]">
        <CategoryChips
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Video Grid */}
      <VideoGrid videos={videos} isLoading={isLoading} />

      {/* Load More Trigger */}
      {!isLoading && hasMore && (
        <div ref={loadMoreRef} className="py-8">
          {isLoadingMore && <VideoGridSkeleton count={8} />}
        </div>
      )}

      {/* End of content */}
      {!isLoading && !hasMore && videos.length > 0 && (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <p>You&apos;ve seen all {videos.length} videos!</p>
          <p className="text-sm mt-1">More content coming soon...</p>
        </div>
      )}
    </div>
  )
}
