import { VideoCategory } from '@/types'

export const SITE_NAME = 'GrowthTube'
export const SITE_URL = 'https://growthtube.com'
export const SITE_DESCRIPTION = 'Share your videos with the world'

// Navigation
export const NAV_ITEMS = {
  main: [
    { id: 'home', label: 'Home', href: '/', icon: 'Home' },
    { id: 'shorts', label: 'Shorts', href: '/shorts', icon: 'Zap' },
    { id: 'subscriptions', label: 'Subscriptions', href: '/feed/subscriptions', icon: 'PlaySquare' },
  ],
  you: [
    { id: 'history', label: 'History', href: '/feed/history', icon: 'History' },
    { id: 'playlists', label: 'Playlists', href: '/feed/playlists', icon: 'ListVideo' },
    { id: 'watch-later', label: 'Watch later', href: '/playlist?list=WL', icon: 'Clock' },
    { id: 'liked', label: 'Liked videos', href: '/playlist?list=LL', icon: 'ThumbsUp' },
  ],
  explore: [
    { id: 'trending', label: 'Trending', href: '/feed/trending', icon: 'Flame' },
    { id: 'music', label: 'Music', href: '/channel/music', icon: 'Music' },
    { id: 'gaming', label: 'Gaming', href: '/gaming', icon: 'Gamepad2' },
    { id: 'news', label: 'News', href: '/channel/news', icon: 'Newspaper' },
    { id: 'sports', label: 'Sports', href: '/channel/sports', icon: 'Trophy' },
  ],
}

// Categories for filtering
export const VIDEO_CATEGORIES: { id: VideoCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'news', label: 'News' },
  { id: 'sports', label: 'Sports' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'education', label: 'Education' },
  { id: 'science', label: 'Science & Technology' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'film', label: 'Film & Animation' },
  { id: 'howto', label: 'How-to & Style' },
  { id: 'travel', label: 'Travel & Events' },
  { id: 'pets', label: 'Pets & Animals' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'food', label: 'Food' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'live', label: 'Live' },
  { id: 'recently-uploaded', label: 'Recently uploaded' },
]

// Video player settings
export const PLAYER_SETTINGS = {
  defaultVolume: 1,
  defaultPlaybackRate: 1,
  playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  qualities: ['auto', '144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'],
  seekTime: 10, // seconds
  volumeStep: 0.1,
}

// Pagination
export const PAGINATION = {
  videosPerPage: 24,
  commentsPerPage: 20,
  searchResultsPerPage: 20,
  relatedVideosCount: 20,
}

// File upload limits
export const UPLOAD_LIMITS = {
  maxVideoSize: 128 * 1024 * 1024 * 1024, // 128GB
  maxThumbnailSize: 2 * 1024 * 1024, // 2MB
  maxAvatarSize: 4 * 1024 * 1024, // 4MB
  maxBannerSize: 6 * 1024 * 1024, // 6MB
  allowedVideoFormats: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  allowedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}

// Validation
export const VALIDATION = {
  minTitleLength: 1,
  maxTitleLength: 100,
  maxDescriptionLength: 5000,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  minUsernameLength: 3,
  maxUsernameLength: 30,
  maxTagsCount: 500,
  maxTagLength: 30,
  maxCommentLength: 10000,
}

// Toast notification durations
export const TOAST_DURATION = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
}

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  player: {
    togglePlay: ['Space', 'k'],
    toggleMute: ['m'],
    toggleFullscreen: ['f'],
    toggleTheater: ['t'],
    toggleMiniPlayer: ['i'],
    seekForward: ['ArrowRight', 'l'],
    seekBackward: ['ArrowLeft', 'j'],
    volumeUp: ['ArrowUp'],
    volumeDown: ['ArrowDown'],
    speedUp: ['>'],
    speedDown: ['<'],
    seekToStart: ['Home', '0'],
    seekToEnd: ['End'],
    toggleCaptions: ['c'],
  },
}

// API endpoints (will be used when backend is ready)
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
  },
  videos: {
    list: '/api/videos',
    get: '/api/videos/:id',
    create: '/api/videos',
    update: '/api/videos/:id',
    delete: '/api/videos/:id',
    trending: '/api/videos/trending',
    search: '/api/videos/search',
  },
  channels: {
    list: '/api/channels',
    get: '/api/channels/:id',
    videos: '/api/channels/:id/videos',
    subscribe: '/api/channels/:id/subscribe',
  },
  comments: {
    list: '/api/videos/:videoId/comments',
    create: '/api/videos/:videoId/comments',
    update: '/api/comments/:id',
    delete: '/api/comments/:id',
  },
  playlists: {
    list: '/api/playlists',
    get: '/api/playlists/:id',
    create: '/api/playlists',
    update: '/api/playlists/:id',
    delete: '/api/playlists/:id',
  },
}

// Local storage keys
export const STORAGE_KEYS = {
  theme: 'growthtube-theme',
  volume: 'growthtube-volume',
  playbackRate: 'growthtube-playback-rate',
  quality: 'growthtube-quality',
  autoplay: 'growthtube-autoplay',
  sidebarExpanded: 'growthtube-sidebar-expanded',
  watchHistory: 'growthtube-watch-history',
  searchHistory: 'growthtube-search-history',
}
