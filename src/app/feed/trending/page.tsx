'use client'

import { useState } from 'react'
import { Flame, Music, Film, Gamepad2 } from 'lucide-react'
import { VideoCard } from '@/components/video/VideoCard'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { allMockVideos } from '@/lib/mock-data'

export default function TrendingPage() {
  // Sort by views to simulate trending
  const trendingVideos = [...allMockVideos].sort((a, b) => b.views - a.views)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Flame className="w-8 h-8 text-[var(--accent)]" />
        <h1 className="text-2xl font-bold">Trending</h1>
      </div>

      <Tabs defaultTab="now">
        <TabList>
          <Tab id="now">Now</Tab>
          <Tab id="music">Music</Tab>
          <Tab id="gaming">Gaming</Tab>
          <Tab id="movies">Movies</Tab>
        </TabList>

        <TabPanel id="now">
          <div className="space-y-4">
            {trendingVideos.slice(0, 20).map((video, index) => (
              <div key={video.id} className="flex gap-4">
                <span className="text-2xl font-bold text-[var(--text-tertiary)] w-8 flex-shrink-0">
                  {index + 1}
                </span>
                <VideoCard video={video} variant="horizontal" className="flex-1" />
              </div>
            ))}
          </div>
        </TabPanel>

        <TabPanel id="music">
          <div className="space-y-4">
            {trendingVideos
              .filter(v => v.category === 'music')
              .slice(0, 10)
              .map((video, index) => (
                <div key={video.id} className="flex gap-4">
                  <span className="text-2xl font-bold text-[var(--text-tertiary)] w-8 flex-shrink-0">
                    {index + 1}
                  </span>
                  <VideoCard video={video} variant="horizontal" className="flex-1" />
                </div>
              ))}
          </div>
        </TabPanel>

        <TabPanel id="gaming">
          <div className="space-y-4">
            {trendingVideos
              .filter(v => v.category === 'gaming')
              .slice(0, 10)
              .map((video, index) => (
                <div key={video.id} className="flex gap-4">
                  <span className="text-2xl font-bold text-[var(--text-tertiary)] w-8 flex-shrink-0">
                    {index + 1}
                  </span>
                  <VideoCard video={video} variant="horizontal" className="flex-1" />
                </div>
              ))}
          </div>
        </TabPanel>

        <TabPanel id="movies">
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">No trending movies right now</p>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  )
}
