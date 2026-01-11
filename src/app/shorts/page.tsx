'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { Video } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { formatViewCount } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { allMockVideos } from '@/lib/mock-data'

// Get short videos (under 60 seconds for demo)
const shortVideos = allMockVideos.filter(v => v.duration < 120).slice(0, 10)

export default function ShortsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentShort = shortVideos[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(shortVideos.length - 1, prev + 1))
  }

  if (!currentShort) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-secondary)]">No Shorts available</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] -mx-4 md:-mx-6">
      <div className="relative flex items-center gap-4">
        {/* Navigation - Previous */}
        <IconButton
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="hidden md:flex"
          aria-label="Previous Short"
        >
          <ChevronUp className="w-8 h-8" />
        </IconButton>

        {/* Short Video Container */}
        <div className="relative w-[350px] h-[620px] bg-black rounded-xl overflow-hidden">
          {/* Video Thumbnail/Player */}
          <Image
            src={currentShort.thumbnail}
            alt={currentShort.title}
            fill
            className="object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Channel Info */}
            <div className="flex items-center gap-3 mb-3">
              <Link href={`/@${currentShort.channel.handle}`}>
                <Avatar src={currentShort.channel.avatar} alt={currentShort.channel.name} size="sm" />
              </Link>
              <Link href={`/@${currentShort.channel.handle}`} className="text-white font-medium text-sm">
                @{currentShort.channel.handle}
              </Link>
              <SubscribeButton channelId={currentShort.channel.id} />
            </div>

            {/* Title */}
            <p className="text-white text-sm line-clamp-2 mb-2">{currentShort.title}</p>

            {/* Music/Audio Info */}
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <span>♪</span>
              <span className="truncate">Original audio - {currentShort.channel.name}</span>
            </div>
          </div>

          {/* Side Actions */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
            <ShortAction icon={<ThumbsUp className="w-6 h-6" />} label={formatViewCount(currentShort.likes)} />
            <ShortAction icon={<ThumbsDown className="w-6 h-6" />} label="Dislike" />
            <ShortAction icon={<MessageCircle className="w-6 h-6" />} label="123" />
            <ShortAction icon={<Share2 className="w-6 h-6" />} label="Share" />
            <IconButton className="text-white">
              <MoreVertical className="w-6 h-6" />
            </IconButton>
          </div>

          {/* Progress Indicator */}
          <div className="absolute top-2 left-2 right-2 flex gap-1">
            {shortVideos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation - Next */}
        <IconButton
          onClick={goToNext}
          disabled={currentIndex === shortVideos.length - 1}
          className="hidden md:flex"
          aria-label="Next Short"
        >
          <ChevronDown className="w-8 h-8" />
        </IconButton>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center gap-4 md:hidden">
        <IconButton onClick={goToPrevious} disabled={currentIndex === 0}>
          <ChevronUp className="w-6 h-6" />
        </IconButton>
        <IconButton onClick={goToNext} disabled={currentIndex === shortVideos.length - 1}>
          <ChevronDown className="w-6 h-6" />
        </IconButton>
      </div>
    </div>
  )
}

function ShortAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 text-white">
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}

function SubscribeButton({ channelId }: { channelId: string }) {
  const { isSubscribed, toggleSubscription, isAuthenticated, openModal } = useStore()
  const subscribed = isSubscribed(channelId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      openModal('login')
      return
    }
    toggleSubscription(channelId)
  }

  return (
    <button
      onClick={handleClick}
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        subscribed ? 'bg-white/20 text-white' : 'bg-white text-black'
      }`}
    >
      {subscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  )
}
