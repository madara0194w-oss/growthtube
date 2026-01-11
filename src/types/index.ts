// User Types
export interface User {
  id: string
  username: string
  displayName: string
  email: string
  avatar: string
  banner?: string
  description?: string
  subscriberCount: number
  videoCount: number
  totalViews: number
  joinedAt: string
  isVerified: boolean
  links?: SocialLink[]
}

export interface SocialLink {
  platform: string
  url: string
}

export interface AuthUser extends User {
  watchHistory: string[]
  likedVideos: string[]
  savedPlaylists: string[]
  subscriptions: string[]
}

// Video Types
export interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  duration: number // in seconds
  views: number
  likes: number
  dislikes: number
  publishedAt: string
  channel: Channel
  category: VideoCategory
  tags: string[]
  isLive?: boolean
  isShort?: boolean
  visibility: 'public' | 'unlisted' | 'private'
}

export interface VideoDetails extends Video {
  comments: Comment[]
  commentCount: number
  relatedVideos: Video[]
}

export type VideoCategory = 
  | 'all'
  | 'music'
  | 'gaming'
  | 'news'
  | 'sports'
  | 'entertainment'
  | 'education'
  | 'science'
  | 'technology'
  | 'comedy'
  | 'film'
  | 'howto'
  | 'travel'
  | 'pets'
  | 'fashion'
  | 'food'
  | 'fitness'
  | 'podcasts'
  | 'trending'
  | 'live'
  | 'recently-uploaded'

// Channel Types
export interface Channel {
  id: string
  name: string
  handle: string // @username
  avatar: string
  banner?: string
  description?: string
  subscriberCount: number
  videoCount: number
  totalViews: number
  joinedAt: string
  isVerified: boolean
  links?: SocialLink[]
  featuredVideo?: Video
  playlists?: Playlist[]
}

export interface ChannelTab {
  id: string
  label: string
  href: string
}

// Comment Types
export interface Comment {
  id: string
  text: string
  author: {
    id: string
    name: string
    avatar: string
    handle: string
  }
  likes: number
  dislikes: number
  publishedAt: string
  isEdited: boolean
  isPinned: boolean
  isHearted: boolean
  replies?: Comment[]
  replyCount: number
}

// Playlist Types
export interface Playlist {
  id: string
  title: string
  description?: string
  thumbnail: string
  videoCount: number
  totalDuration: number
  visibility: 'public' | 'unlisted' | 'private'
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    avatar: string
  }
  videos?: Video[]
}

// Search Types
export interface SearchFilters {
  uploadDate?: 'hour' | 'today' | 'week' | 'month' | 'year'
  type?: 'video' | 'channel' | 'playlist'
  duration?: 'short' | 'medium' | 'long'
  features?: ('live' | 'hd' | 'subtitles' | '4k' | 'creative-commons' | '360' | 'vr' | 'hdr')[]
  sortBy?: 'relevance' | 'date' | 'views' | 'rating'
  category?: string
}

export interface SearchResult {
  type: 'video' | 'channel' | 'playlist'
  data: Video | Channel | Playlist
}

// Notification Types
export interface Notification {
  id: string
  type: 'upload' | 'comment' | 'like' | 'subscribe' | 'mention' | 'live'
  title: string
  message: string
  thumbnail?: string
  link: string
  isRead: boolean
  createdAt: string
  channel?: {
    id: string
    name: string
    avatar: string
  }
}

// UI State Types
export interface SidebarState {
  isExpanded: boolean
  isMobileOpen: boolean
}

export interface ModalState {
  isOpen: boolean
  type: 'login' | 'register' | 'upload' | 'playlist' | 'share' | 'report' | null
}

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  nextPageToken?: string
  prevPageToken?: string
  totalResults: number
  resultsPerPage: number
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Player Types
export interface PlayerState {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  buffered: number
  playbackRate: number
  quality: VideoQuality
  isFullscreen: boolean
  isTheaterMode: boolean
  isMiniPlayer: boolean
  showControls: boolean
  isLoading: boolean
}

export type VideoQuality = 'auto' | '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'

// History & Watch Later
export interface WatchHistoryItem {
  video: Video
  watchedAt: string
  progress: number // percentage watched
}

export interface Subscription {
  channel: Channel
  subscribedAt: string
  notificationsEnabled: boolean
}
