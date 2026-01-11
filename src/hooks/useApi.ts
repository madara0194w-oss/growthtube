'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video, Channel, Comment, SearchFilters } from '@/types'
import { videoApi, channelApi, commentApi } from '@/lib/api'

// Generic hook for data fetching with loading and error states
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await asyncFunction()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    execute()
  }, [execute])

  return { data, isLoading, error, refetch: execute }
}

// Video hooks
export function useVideos(category?: string, page?: number) {
  return useAsync(
    () => videoApi.getVideos({ category, page }),
    [category, page]
  )
}

export function useVideo(id: string) {
  return useAsync(
    () => videoApi.getVideo(id),
    [id]
  )
}

export function useTrendingVideos(limit?: number) {
  return useAsync(
    () => videoApi.getTrendingVideos(limit),
    [limit]
  )
}

export function useRelatedVideos(videoId: string, limit?: number) {
  return useAsync(
    () => videoApi.getRelatedVideos(videoId, limit),
    [videoId, limit]
  )
}

export function useSearchVideos(query: string, filters?: SearchFilters) {
  const [results, setResults] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const search = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await videoApi.searchVideos(query, filters)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(search, 300)
    return () => clearTimeout(timeoutId)
  }, [query, filters])

  return { results, isLoading, error }
}

// Channel hooks
export function useChannel(handle: string) {
  return useAsync(
    () => channelApi.getChannel(handle),
    [handle]
  )
}

export function useChannelVideos(channelId: string, limit?: number) {
  return useAsync(
    () => channelApi.getChannelVideos(channelId, limit),
    [channelId, limit]
  )
}

// Comment hooks
export function useComments(videoId: string) {
  return useAsync(
    () => commentApi.getComments(videoId),
    [videoId]
  )
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ items: T[]; nextPageToken?: string }>,
  options?: { initialPage?: number; threshold?: number }
) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(options?.initialPage || 1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFn(page)
      setItems(prev => [...prev, ...result.items])
      setHasMore(!!result.nextPageToken)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more')
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore, fetchFn])

  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [])

  // Initial load
  useEffect(() => {
    loadMore()
  }, [])

  return { items, isLoading, error, hasMore, loadMore, reset }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback()
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(ref)

    return () => observer.disconnect()
  }, [ref, callback, options])

  return setRef
}

// Media query hook for responsive design
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Keyboard shortcut hook
export function useKeyboardShortcut(
  key: string | string[],
  callback: () => void,
  options?: { ctrl?: boolean; shift?: boolean; alt?: boolean }
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = Array.isArray(key) ? key : [key]
      const matchesKey = keys.includes(e.key)
      const matchesModifiers =
        (!options?.ctrl || e.ctrlKey || e.metaKey) &&
        (!options?.shift || e.shiftKey) &&
        (!options?.alt || e.altKey)

      if (matchesKey && matchesModifiers) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options])
}

// Local storage hook with sync
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}
