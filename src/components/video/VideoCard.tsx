'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MoreVertical, Clock, ListPlus, Share2, Flag } from 'lucide-react'
import { Video } from '@/types'
import { cn, formatViewCount, formatDuration, formatRelativeTime, getVideoUrl, getChannelUrl } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { IconButton } from '@/components/ui/IconButton'
import { useStore } from '@/store/useStore'

interface VideoCardProps {
  video: Video
  variant?: 'default' | 'horizontal' | 'compact'
  showChannel?: boolean
  className?: string
}

export function VideoCard({ video, variant = 'default', showChannel = true, className }: VideoCardProps) {
  const { addToWatchLater, addToast } = useStore()

  const handleWatchLater = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToWatchLater(video.id)
    addToast({ type: 'success', message: 'Added to Watch later' })
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}${getVideoUrl(video.id)}`)
    addToast({ type: 'success', message: 'Link copied to clipboard' })
  }

  if (variant === 'horizontal') {
    return (
      <Link href={getVideoUrl(video.id)} className={cn('flex gap-3 group hover:bg-[var(--bg-secondary)] p-2 rounded-xl transition-colors', className)}>
        <div className="relative w-40 sm:w-48 md:w-56 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 224px"
          />
          <span className="video-duration">{formatDuration(video.duration)}</span>
          {video.isLive && (
            <span className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
              LIVE
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium line-clamp-2 text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--accent)]">
            {video.title}
          </h3>
          {showChannel && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {video.channel.name}
                {video.channel.isVerified && (
                  <span className="ml-1">✓</span>
                )}
              </span>
            </div>
          )}
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            {formatViewCount(video.views)} views • {formatRelativeTime(video.publishedAt)}
          </p>
          {video.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-1 hidden md:line-clamp-2">
              {video.description}
            </p>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={getVideoUrl(video.id)} className={cn('flex gap-2 group', className)}>
        <div className="video-thumbnail w-40 flex-shrink-0">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            sizes="160px"
          />
          <span className="video-duration">{formatDuration(video.duration)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium line-clamp-2">{video.title}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{video.channel.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {formatViewCount(video.views)} views
          </p>
        </div>
      </Link>
    )
  }

  return (
    <div className={cn('video-card', className)}>
      <Link href={getVideoUrl(video.id)}>
        <div className="video-thumbnail">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <span className="video-duration">{formatDuration(video.duration)}</span>
          {video.isLive && (
            <span className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
              LIVE
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleWatchLater}
                className="p-1.5 bg-black/80 rounded hover:bg-black transition-colors"
                title="Watch later"
              >
                <Clock className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleWatchLater}
                className="p-1.5 bg-black/80 rounded hover:bg-black transition-colors"
                title="Add to queue"
              >
                <ListPlus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex gap-3 mt-3">
        {showChannel && (
          <Link href={getChannelUrl(video.channel.handle)}>
            <Avatar src={video.channel.avatar} alt={video.channel.name} size="sm" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <Link href={getVideoUrl(video.id)}>
            <h3 className="font-medium line-clamp-2 text-[var(--text-primary)] hover:text-[var(--text-primary)]">
              {video.title}
            </h3>
          </Link>
          {showChannel && (
            <Link
              href={getChannelUrl(video.channel.handle)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mt-1 block"
            >
              {video.channel.name}
              {video.channel.isVerified && (
                <span className="ml-1 text-[var(--text-tertiary)]">✓</span>
              )}
            </Link>
          )}
          <p className="text-sm text-[var(--text-secondary)]">
            {formatViewCount(video.views)} views • {formatRelativeTime(video.publishedAt)}
          </p>
        </div>
        <Dropdown
          trigger={
            <IconButton size="sm" aria-label="More options">
              <MoreVertical className="w-5 h-5" />
            </IconButton>
          }
        >
          <DropdownItem icon={<Clock className="w-5 h-5" />} onClick={() => { addToWatchLater(video.id); addToast({ type: 'success', message: 'Added to Watch later' }) }}>
            Save to Watch later
          </DropdownItem>
          <DropdownItem icon={<ListPlus className="w-5 h-5" />}>
            Save to playlist
          </DropdownItem>
          <DropdownItem icon={<Share2 className="w-5 h-5" />} onClick={handleShare}>
            Share
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem icon={<Flag className="w-5 h-5" />}>
            Report
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  )
}
