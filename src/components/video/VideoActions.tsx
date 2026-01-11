'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Share2, Download, Bookmark, MoreHorizontal, Flag, ListPlus } from 'lucide-react'
import { Video } from '@/types'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { formatViewCount, copyToClipboard, getVideoUrl } from '@/lib/utils'
import { useStore } from '@/store/useStore'

interface VideoActionsProps {
  video: Video
}

export function VideoActions({ video }: VideoActionsProps) {
  const { isAuthenticated, openModal, isVideoLiked, toggleLikeVideo, addToWatchLater, addToast } = useStore()
  const [liked, setLiked] = useState(isVideoLiked(video.id))
  const [disliked, setDisliked] = useState(false)
  const [likes, setLikes] = useState(video.likes)

  const handleLike = () => {
    if (!isAuthenticated) {
      openModal('login')
      return
    }
    toggleLikeVideo(video.id)
    if (liked) {
      setLikes(likes - 1)
      setLiked(false)
    } else {
      setLikes(likes + 1)
      setLiked(true)
      if (disliked) setDisliked(false)
    }
  }

  const handleDislike = () => {
    if (!isAuthenticated) {
      openModal('login')
      return
    }
    if (disliked) {
      setDisliked(false)
    } else {
      setDisliked(true)
      if (liked) {
        setLikes(likes - 1)
        setLiked(false)
        toggleLikeVideo(video.id)
      }
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}${getVideoUrl(video.id)}`
    const success = await copyToClipboard(url)
    if (success) {
      addToast({ type: 'success', message: 'Link copied to clipboard' })
    }
  }

  const handleSave = () => {
    if (!isAuthenticated) {
      openModal('login')
      return
    }
    addToWatchLater(video.id)
    addToast({ type: 'success', message: 'Saved to Watch later' })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Like/Dislike Button Group */}
      <div className="flex items-center bg-[var(--bg-tertiary)] rounded-full">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-l-full hover:bg-[var(--bg-hover)] transition-colors ${
            liked ? 'text-[var(--accent)]' : ''
          }`}
        >
          <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span className="font-medium">{formatViewCount(likes)}</span>
        </button>
        <div className="w-px h-6 bg-[var(--border-color)]" />
        <button
          onClick={handleDislike}
          className={`px-4 py-2 rounded-r-full hover:bg-[var(--bg-hover)] transition-colors ${
            disliked ? 'text-[var(--accent)]' : ''
          }`}
        >
          <ThumbsDown className={`w-5 h-5 ${disliked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Share */}
      <Button variant="secondary" leftIcon={<Share2 className="w-5 h-5" />} onClick={handleShare}>
        Share
      </Button>

      {/* Download (if available) */}
      <Button variant="secondary" leftIcon={<Download className="w-5 h-5" />} className="hidden sm:flex">
        Download
      </Button>

      {/* Save */}
      <Button variant="secondary" leftIcon={<Bookmark className="w-5 h-5" />} onClick={handleSave}>
        Save
      </Button>

      {/* More Options */}
      <Dropdown
        trigger={
          <IconButton className="bg-[var(--bg-tertiary)]">
            <MoreHorizontal className="w-5 h-5" />
          </IconButton>
        }
      >
        <DropdownItem icon={<ListPlus className="w-5 h-5" />} onClick={() => openModal('playlist')}>
          Save to playlist
        </DropdownItem>
        <DropdownItem icon={<Download className="w-5 h-5" />}>
          Download
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem icon={<Flag className="w-5 h-5" />}>
          Report
        </DropdownItem>
      </Dropdown>
    </div>
  )
}
