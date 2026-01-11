'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { Video, SearchFilters } from '@/types'
import { VideoCard } from '@/components/video/VideoCard'
import { Button } from '@/components/ui/Button'
import { VideoGridSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('search_query') || ''
  
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<Video[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Fetch search results from API
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([])
        setChannels([])
        setPlaylists([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          sortBy: filters.sortBy || 'relevance',
        })

        if (filters.type) params.append('type', filters.type)
        if (filters.category) params.append('category', filters.category)
        if (filters.duration) params.append('duration', filters.duration)
        if (filters.uploadDate) params.append('uploadDate', filters.uploadDate)

        console.log('🔍 Search query:', query)
        console.log('🔍 API URL:', `/api/search?${params}`)

        const response = await fetch(`/api/search?${params}`)
        console.log('🔍 Response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('🔍 API Error:', errorData)
          throw new Error('Search failed')
        }
        
        const data = await response.json()
        console.log('🔍 Search results:', data)
        setResults(data.videos || [])
        setChannels(data.channels || [])
        setPlaylists(data.playlists || [])
      } catch (error) {
        console.error('❌ Search error:', error)
        setResults([])
        setChannels([])
        setPlaylists([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, filters])

  const totalResults = results.length + channels.length + playlists.length

  return (
    <div>
      {/* Search Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {query && (
            <p className="text-[var(--text-secondary)]">
              {isLoading ? 'Searching...' : `${totalResults} results for "${query}"`}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          leftIcon={<SlidersHorizontal className="w-5 h-5" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Upload Date */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Upload date</h4>
              <div className="space-y-1">
                {[
                  { value: undefined, label: 'Any time' },
                  { value: 'hour', label: 'Last hour' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This week' },
                  { value: 'month', label: 'This month' },
                  { value: 'year', label: 'This year' },
                ].map(option => (
                  <button
                    key={option.label}
                    onClick={() => setFilters(f => ({ ...f, uploadDate: option.value as SearchFilters['uploadDate'] }))}
                    className={cn(
                      'block text-sm py-1 hover:text-[var(--text-primary)]',
                      filters.uploadDate === option.value ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Duration</h4>
              <div className="space-y-1">
                {[
                  { value: undefined, label: 'Any duration' },
                  { value: 'short', label: 'Under 4 minutes' },
                  { value: 'medium', label: '4-20 minutes' },
                  { value: 'long', label: 'Over 20 minutes' },
                ].map(option => (
                  <button
                    key={option.label}
                    onClick={() => setFilters(f => ({ ...f, duration: option.value as SearchFilters['duration'] }))}
                    className={cn(
                      'block text-sm py-1 hover:text-[var(--text-primary)]',
                      filters.duration === option.value ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Sort by</h4>
              <div className="space-y-1">
                {[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'date', label: 'Upload date' },
                  { value: 'views', label: 'View count' },
                  { value: 'rating', label: 'Rating' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilters(f => ({ ...f, sortBy: option.value as SearchFilters['sortBy'] }))}
                    className={cn(
                      'block text-sm py-1 hover:text-[var(--text-primary)]',
                      filters.sortBy === option.value ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <h4 className="font-medium mb-2 text-sm">Type</h4>
              <div className="space-y-1">
                {[
                  { value: undefined, label: 'All' },
                  { value: 'video', label: 'Video' },
                  { value: 'channel', label: 'Channel' },
                  { value: 'playlist', label: 'Playlist' },
                ].map(option => (
                  <button
                    key={option.label}
                    onClick={() => setFilters(f => ({ ...f, type: option.value as SearchFilters['type'] }))}
                    className={cn(
                      'block text-sm py-1 hover:text-[var(--text-primary)]',
                      filters.type === option.value ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <VideoGridSkeleton count={8} />
      ) : totalResults === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl font-medium mb-2">No results found</p>
          <p className="text-[var(--text-secondary)]">
            Try different keywords or remove search filters
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channels */}
          {channels.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Channels</h2>
              <div className="space-y-4">
                {channels.map(channel => (
                  <a
                    key={channel.id}
                    href={`/@${channel.handle}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <img
                      src={channel.avatar || '/default-avatar.png'}
                      alt={channel.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{channel.name}</h3>
                      <p className="text-[var(--text-secondary)]">@{channel.handle}</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {channel.subscriberCount?.toLocaleString()} subscribers
                      </p>
                      {channel.description && (
                        <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
                          {channel.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {results.length > 0 && (
            <div>
              {channels.length > 0 && <h2 className="text-lg font-semibold mb-4">Videos</h2>}
              <div className="space-y-4">
                {results.map(video => (
                  <VideoCard key={video.id} video={video} variant="horizontal" />
                ))}
              </div>
            </div>
          )}

          {/* Playlists */}
          {playlists.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Playlists</h2>
              <div className="space-y-4">
                {playlists.map(playlist => (
                  <a
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    className="flex gap-4 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors p-2"
                  >
                    <div className="relative w-60 h-36 flex-shrink-0">
                      <img
                        src={playlist.thumbnail || '/default-thumbnail.png'}
                        alt={playlist.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {playlist.videoCount} videos
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 py-2">
                      <h3 className="font-semibold line-clamp-2 mb-1">{playlist.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">
                        {playlist.owner.name}
                      </p>
                      {playlist.description && (
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<VideoGridSkeleton count={8} />}>
      <SearchResultsContent />
    </Suspense>
  )
}
