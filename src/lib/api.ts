import { Video, Channel, Comment, Playlist, SearchFilters, PaginatedResponse, ApiResponse } from '@/types'
import { allMockVideos, mockChannels, mockComments, mockPlaylists } from './mock-data'

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Base API class for future backend integration
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  // Generic fetch wrapper (for future use with real API)
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }
    }
  }
}

// Video API
export const videoApi = {
  async getVideos(params?: {
    category?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Video>> {
    await delay(300)
    
    let videos = [...allMockVideos]
    
    if (params?.category && params.category !== 'all') {
      videos = videos.filter(v => v.category === params.category)
    }
    
    const limit = params?.limit || 24
    const page = params?.page || 1
    const start = (page - 1) * limit
    const end = start + limit
    
    return {
      items: videos.slice(start, end),
      totalResults: videos.length,
      resultsPerPage: limit,
      nextPageToken: end < videos.length ? String(page + 1) : undefined,
      prevPageToken: page > 1 ? String(page - 1) : undefined,
    }
  },

  async getVideo(id: string): Promise<Video | null> {
    await delay(200)
    return allMockVideos.find(v => v.id === id) || null
  },

  async getTrendingVideos(limit: number = 20): Promise<Video[]> {
    await delay(300)
    return [...allMockVideos]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  },

  async getRelatedVideos(videoId: string, limit: number = 20): Promise<Video[]> {
    await delay(200)
    const video = allMockVideos.find(v => v.id === videoId)
    if (!video) return []
    
    // Return videos from same category or channel, excluding current
    return allMockVideos
      .filter(v => v.id !== videoId && (v.category === video.category || v.channel.id === video.channel.id))
      .slice(0, limit)
  },

  async searchVideos(
    query: string,
    filters?: SearchFilters,
    limit: number = 20
  ): Promise<Video[]> {
    await delay(400)
    
    let results = allMockVideos.filter(video =>
      video.title.toLowerCase().includes(query.toLowerCase()) ||
      video.description.toLowerCase().includes(query.toLowerCase()) ||
      video.channel.name.toLowerCase().includes(query.toLowerCase()) ||
      video.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )

    // Apply filters
    if (filters?.duration) {
      results = results.filter(video => {
        switch (filters.duration) {
          case 'short': return video.duration < 240
          case 'medium': return video.duration >= 240 && video.duration <= 1200
          case 'long': return video.duration > 1200
          default: return true
        }
      })
    }

    // Apply sort
    switch (filters?.sortBy) {
      case 'date':
      case 'upload_date' as any:
        results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        break
      case 'views':
      case 'view_count' as any:
        results.sort((a, b) => b.views - a.views)
        break
      case 'rating':
        results.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
        break
    }

    return results.slice(0, limit)
  },
}

// Channel API
export const channelApi = {
  async getChannel(handle: string): Promise<Channel | null> {
    await delay(200)
    return mockChannels.find(c => c.handle.toLowerCase() === handle.toLowerCase()) || null
  },

  async getChannelVideos(channelId: string, limit: number = 30): Promise<Video[]> {
    await delay(300)
    return allMockVideos.filter(v => v.channel.id === channelId).slice(0, limit)
  },

  async getChannels(): Promise<Channel[]> {
    await delay(200)
    return mockChannels
  },
}

// Comment API
export const commentApi = {
  async getComments(videoId: string, limit: number = 20): Promise<Comment[]> {
    await delay(300)
    return mockComments.slice(0, limit)
  },

  async addComment(videoId: string, text: string, userId: string): Promise<Comment> {
    await delay(500)
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      text,
      author: {
        id: userId,
        name: 'Current User',
        avatar: 'https://picsum.photos/seed/currentuser/100/100',
        handle: 'currentuser',
      },
      likes: 0,
      dislikes: 0,
      publishedAt: new Date().toISOString(),
      isEdited: false,
      isPinned: false,
      isHearted: false,
      replyCount: 0,
    }
    return newComment
  },
}

// Playlist API
export const playlistApi = {
  async getPlaylists(userId?: string): Promise<Playlist[]> {
    await delay(200)
    return mockPlaylists
  },

  async getPlaylist(id: string): Promise<Playlist | null> {
    await delay(200)
    return mockPlaylists.find(p => p.id === id) || null
  },

  async createPlaylist(data: { title: string; description?: string; visibility: 'public' | 'private' | 'unlisted' }): Promise<Playlist> {
    await delay(500)
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      title: data.title,
      description: data.description,
      thumbnail: 'https://picsum.photos/seed/newpl/640/360',
      videoCount: 0,
      totalDuration: 0,
      visibility: data.visibility,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: {
        id: 'current-user',
        name: 'Current User',
        avatar: 'https://picsum.photos/seed/currentuser/100/100',
      },
    }
    return newPlaylist
  },
}

// Auth API (for future backend integration)
export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    await delay(1000)
    // Mock successful login
    return {
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          username: 'johndoe',
          displayName: 'John Doe',
          email,
          avatar: 'https://picsum.photos/seed/user1/100/100',
        },
      },
    }
  },

  async register(data: { email: string; password: string; username: string; displayName: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    await delay(1000)
    return {
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: `user-${Date.now()}`,
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          avatar: `https://picsum.photos/seed/${data.username}/100/100`,
        },
      },
    }
  },

  async logout(): Promise<void> {
    await delay(300)
  },
}

// Export singleton API client for future use
export const api = new ApiClient()
