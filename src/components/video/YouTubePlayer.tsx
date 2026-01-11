'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface YouTubePlayerProps {
  videoUrl: string
  title?: string
  className?: string
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function YouTubePlayer({ videoUrl, title, className }: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const videoId = getYouTubeVideoId(videoUrl)

  if (!videoId) {
    return (
      <div className={cn('aspect-video bg-black flex items-center justify-center', className)}>
        <p className="text-white">Invalid video URL</p>
      </div>
    )
  }

  return (
    <div className={cn('relative aspect-video bg-black', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`}
        title={title || 'YouTube video'}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  )
}
