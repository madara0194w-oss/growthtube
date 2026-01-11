'use client'

import { Video } from '@/types'
import { VideoCard } from './VideoCard'
import { VideoGridSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface VideoGridProps {
  videos: Video[]
  isLoading?: boolean
  showChannel?: boolean
  columns?: 1 | 2 | 3 | 4 | 5
  className?: string
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
}

export function VideoGrid({
  videos,
  isLoading = false,
  showChannel = true,
  columns = 4,
  className,
}: VideoGridProps) {
  if (isLoading) {
    return <VideoGridSkeleton count={12} />
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">No videos found</p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} showChannel={showChannel} />
      ))}
    </div>
  )
}
