'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, BellOff, Share2, Flag, MoreVertical, CheckCircle, ExternalLink } from 'lucide-react'
import { Channel, Video } from '@/types'
import { VideoCard } from '@/components/video/VideoCard'
import { VideoGrid } from '@/components/video/VideoGrid'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { ChannelHeaderSkeleton, VideoGridSkeleton } from '@/components/ui/Skeleton'
import { formatViewCount, formatSubscriberCount, formatDate, copyToClipboard } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { mockChannels, allMockVideos } from '@/lib/mock-data'

export default function ChannelPage() {
  const params = useParams()
  const handle = (params.handle as string)?.replace('@', '')
  const { isSubscribed, toggleSubscription, isAuthenticated, openModal, addToast } = useStore()

  const [channel, setChannel] = useState<Channel | null>(null)
  const [channelVideos, setChannelVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (handle) {
      // Find channel from mock data
      const foundChannel = mockChannels.find(c => c.handle.toLowerCase() === handle.toLowerCase())
      if (foundChannel) {
        setChannel(foundChannel)
        setSubscribed(isSubscribed(foundChannel.id))
        // Get channel videos
        const videos = allMockVideos.filter(v => v.channel.id === foundChannel.id)
        setChannelVideos(videos)
      }
      setIsLoading(false)
    }
  }, [handle, isSubscribed])

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      openModal('login')
      return
    }
    if (channel) {
      toggleSubscription(channel.id)
      setSubscribed(!subscribed)
      addToast({
        type: 'success',
        message: subscribed ? 'Unsubscribed' : 'Subscribed!',
      })
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/@${handle}`
    const success = await copyToClipboard(url)
    if (success) {
      addToast({ type: 'success', message: 'Channel link copied!' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ChannelHeaderSkeleton />
        <VideoGridSkeleton count={8} />
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium mb-2">Channel not found</h2>
        <p className="text-[var(--text-secondary)]">
          The channel @{handle} doesn't exist or has been removed.
        </p>
        <Link href="/" className="text-blue-500 hover:text-blue-400 mt-4 inline-block">
          Go back home
        </Link>
      </div>
    )
  }

  return (
    <div className="-mx-4 md:-mx-6">
      {/* Banner */}
      {channel.banner && (
        <div className="relative w-full h-32 md:h-48 lg:h-56 bg-[var(--bg-tertiary)]">
          <Image
            src={channel.banner}
            alt={`${channel.name} banner`}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Channel Info */}
      <div className="px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 py-4 md:py-6">
          <Avatar
            src={channel.avatar}
            alt={channel.name}
            size="xl"
            className="w-20 h-20 md:w-40 md:h-40"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{channel.name}</h1>
              {channel.isVerified && (
                <CheckCircle className="w-5 h-5 text-[var(--text-secondary)]" fill="currentColor" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
              <span>@{channel.handle}</span>
              <span>•</span>
              <span>{formatSubscriberCount(channel.subscriberCount)}</span>
              <span>•</span>
              <span>{channel.videoCount} videos</span>
            </div>

            {channel.description && (
              <p className="mt-3 text-sm text-[var(--text-secondary)] line-clamp-2 max-w-2xl">
                {channel.description}
              </p>
            )}

            {/* Channel Links */}
            {channel.links && channel.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {channel.links.slice(0, 3).map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {link.platform}
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Button
                variant={subscribed ? 'secondary' : 'primary'}
                onClick={handleSubscribe}
                leftIcon={subscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </Button>

              <Dropdown
                trigger={
                  <IconButton>
                    <MoreVertical className="w-5 h-5" />
                  </IconButton>
                }
              >
                <DropdownItem icon={<Share2 className="w-5 h-5" />} onClick={handleShare}>
                  Share channel
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<Flag className="w-5 h-5" />}>
                  Report channel
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultTab="videos">
          <TabList className="-mx-4 md:-mx-6 px-4 md:px-6">
            <Tab id="videos">Videos</Tab>
            <Tab id="shorts">Shorts</Tab>
            <Tab id="playlists">Playlists</Tab>
            <Tab id="community">Community</Tab>
            <Tab id="about">About</Tab>
          </TabList>

          <TabPanel id="videos">
            {channelVideos.length > 0 ? (
              <VideoGrid videos={channelVideos} showChannel={false} />
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">No videos yet</p>
              </div>
            )}
          </TabPanel>

          <TabPanel id="shorts">
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">No Shorts yet</p>
            </div>
          </TabPanel>

          <TabPanel id="playlists">
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">No playlists yet</p>
            </div>
          </TabPanel>

          <TabPanel id="community">
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">No community posts yet</p>
            </div>
          </TabPanel>

          <TabPanel id="about">
            <ChannelAbout channel={channel} />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}

function ChannelAbout({ channel }: { channel: Channel }) {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
      <div>
        <h3 className="font-medium mb-4">Description</h3>
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
          {channel.description || 'No description provided.'}
        </p>

        {channel.links && channel.links.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-4">Links</h3>
            <div className="space-y-2">
              {channel.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium mb-4">Stats</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Joined</dt>
            <dd>{formatDate(channel.joinedAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Total views</dt>
            <dd>{formatViewCount(channel.totalViews)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Subscribers</dt>
            <dd>{formatViewCount(channel.subscriberCount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Videos</dt>
            <dd>{channel.videoCount}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
