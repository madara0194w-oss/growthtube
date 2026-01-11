// Frontend API client for making requests to backend

const API_BASE = '/api'

interface ApiError {
  error: string
  status: number
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      const error: ApiError = {
        error: data.error || 'An error occurred',
        status: response.status,
      }
      throw error
    }

    return data
  }

  // Videos
  async getVideos(params?: {
    category?: string
    channelId?: string
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set('category', params.category)
    if (params?.channelId) searchParams.set('channelId', params.channelId)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      videos: any[]
      nextCursor?: string
    }>(`/videos?${searchParams.toString()}`)
  }

  async getVideo(videoId: string) {
    return this.request<any>(`/videos/${videoId}`)
  }

  async getTrendingVideos(category?: string, limit?: number) {
    const searchParams = new URLSearchParams()
    if (category) searchParams.set('category', category)
    if (limit) searchParams.set('limit', limit.toString())

    return this.request<{ videos: any[] }>(`/videos/trending?${searchParams.toString()}`)
  }

  async likeVideo(videoId: string) {
    return this.request<{ message: string; liked: boolean }>(`/videos/${videoId}/like`, {
      method: 'POST',
    })
  }

  async dislikeVideo(videoId: string) {
    return this.request<{ message: string; disliked: boolean }>(`/videos/${videoId}/dislike`, {
      method: 'POST',
    })
  }

  // Channels
  async getChannel(handle: string) {
    return this.request<any>(`/channels/${handle}`)
  }

  async getChannelVideos(handle: string, params?: {
    sort?: string
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      videos: any[]
      nextCursor?: string
    }>(`/channels/${handle}/videos?${searchParams.toString()}`)
  }

  async subscribeToChannel(handle: string) {
    return this.request<{
      message: string
      subscribed: boolean
      subscriberCount: number
    }>(`/channels/${handle}/subscribe`, {
      method: 'POST',
    })
  }

  async getSubscriptionStatus(handle: string) {
    return this.request<{
      subscribed: boolean
      notificationsEnabled: boolean
    }>(`/channels/${handle}/subscribe`)
  }

  // Subscriptions
  async getSubscriptions(params?: { limit?: number; cursor?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      subscriptions: any[]
      nextCursor?: string
    }>(`/subscriptions?${searchParams.toString()}`)
  }

  async getSubscriptionFeed(params?: { limit?: number; cursor?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      videos: any[]
      nextCursor?: string
    }>(`/subscriptions/feed?${searchParams.toString()}`)
  }

  // Comments
  async getComments(videoId: string, params?: {
    sort?: string
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.sort) searchParams.set('sort', params.sort)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      comments: any[]
      nextCursor?: string
    }>(`/videos/${videoId}/comments?${searchParams.toString()}`)
  }

  async createComment(videoId: string, text: string, parentId?: string) {
    return this.request<{ message: string; comment: any }>(`/videos/${videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, parentId }),
    })
  }

  async deleteComment(commentId: string) {
    return this.request<{ message: string }>(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  // Search
  async search(params: {
    q: string
    type?: string
    category?: string
    duration?: string
    uploadDate?: string
    sortBy?: string
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value.toString())
    })

    return this.request<{
      query: string
      videos: any[]
      channels: any[]
      playlists: any[]
      nextCursor?: string
    }>(`/search?${searchParams.toString()}`)
  }

  // History
  async getWatchHistory(params?: { limit?: number; cursor?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      history: any[]
      nextCursor?: string
    }>(`/history?${searchParams.toString()}`)
  }

  async addToWatchHistory(videoId: string, progress?: number) {
    return this.request<{ message: string }>('/history', {
      method: 'POST',
      body: JSON.stringify({ videoId, progress }),
    })
  }

  async clearWatchHistory(videoId?: string) {
    const searchParams = new URLSearchParams()
    if (videoId) searchParams.set('videoId', videoId)

    return this.request<{ message: string }>(`/history?${searchParams.toString()}`, {
      method: 'DELETE',
    })
  }

  // Watch Later
  async getWatchLater(params?: { limit?: number; cursor?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      videos: any[]
      nextCursor?: string
    }>(`/watch-later?${searchParams.toString()}`)
  }

  async addToWatchLater(videoId: string) {
    return this.request<{ message: string }>('/watch-later', {
      method: 'POST',
      body: JSON.stringify({ videoId }),
    })
  }

  async removeFromWatchLater(videoId: string) {
    return this.request<{ message: string }>(`/watch-later?videoId=${videoId}`, {
      method: 'DELETE',
    })
  }

  // User
  async getCurrentUser() {
    return this.request<any>('/user')
  }

  async updateProfile(data: {
    displayName?: string
    bio?: string
    avatar?: string
    banner?: string
  }) {
    return this.request<{ message: string; user: any }>('/user', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Notifications
  async getNotifications(params?: {
    unread?: boolean
    limit?: number
    cursor?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.unread) searchParams.set('unread', 'true')
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.cursor) searchParams.set('cursor', params.cursor)

    return this.request<{
      notifications: any[]
      unreadCount: number
      nextCursor?: string
    }>(`/notifications?${searchParams.toString()}`)
  }

  async markNotificationsRead(notificationIds?: string[]) {
    return this.request<{ message: string }>('/notifications', {
      method: 'PATCH',
      body: JSON.stringify(
        notificationIds ? { notificationIds } : { markAllRead: true }
      ),
    })
  }

  // Auth
  async register(data: {
    email: string
    password: string
    username: string
    displayName: string
  }) {
    return this.request<{
      message: string
      user: any
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
