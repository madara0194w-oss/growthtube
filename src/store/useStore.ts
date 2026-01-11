'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser, SidebarState, ModalState, ToastNotification, Video } from '@/types'
import { generateId } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/constants'

interface AppState {
  // Auth
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => void

  // Sidebar
  sidebar: SidebarState
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void

  // Modal
  modal: ModalState
  openModal: (type: ModalState['type']) => void
  closeModal: () => void

  // Toast Notifications
  toasts: ToastNotification[]
  addToast: (toast: Omit<ToastNotification, 'id'>) => void
  removeToast: (id: string) => void

  // Search
  searchQuery: string
  searchHistory: string[]
  setSearchQuery: (query: string) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void

  // Video Player
  currentVideo: Video | null
  setCurrentVideo: (video: Video | null) => void
  miniPlayerVideo: Video | null
  setMiniPlayerVideo: (video: Video | null) => void

  // Watch History
  watchHistory: string[]
  addToWatchHistory: (videoId: string) => void
  removeFromWatchHistory: (videoId: string) => void
  clearWatchHistory: () => void

  // Watch Later
  watchLater: string[]
  addToWatchLater: (videoId: string) => void
  removeFromWatchLater: (videoId: string) => void
  isInWatchLater: (videoId: string) => boolean

  // Liked Videos
  likedVideos: string[]
  toggleLikeVideo: (videoId: string) => void
  isVideoLiked: (videoId: string) => boolean

  // Subscriptions
  subscriptions: string[]
  toggleSubscription: (channelId: string) => void
  isSubscribed: (channelId: string) => boolean
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // Sidebar
      sidebar: {
        isExpanded: true,
        isMobileOpen: false,
      },
      toggleSidebar: () =>
        set((state) => ({
          sidebar: { ...state.sidebar, isExpanded: !state.sidebar.isExpanded },
        })),
      setSidebarExpanded: (expanded) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isExpanded: expanded },
        })),
      setMobileSidebarOpen: (open) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isMobileOpen: open },
        })),

      // Modal
      modal: {
        isOpen: false,
        type: null,
      },
      openModal: (type) => set({ modal: { isOpen: true, type } }),
      closeModal: () => set({ modal: { isOpen: false, type: null } }),

      // Toast Notifications
      toasts: [],
      addToast: (toast) => {
        const id = generateId()
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }))
        // Auto remove after duration
        setTimeout(() => {
          get().removeToast(id)
        }, toast.duration || 3000)
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Search
      searchQuery: '',
      searchHistory: [],
      setSearchQuery: (query) => set({ searchQuery: query }),
      addToSearchHistory: (query) =>
        set((state) => {
          const history = [query, ...state.searchHistory.filter((q) => q !== query)].slice(0, 10)
          return { searchHistory: history }
        }),
      clearSearchHistory: () => set({ searchHistory: [] }),

      // Video Player
      currentVideo: null,
      setCurrentVideo: (video) => set({ currentVideo: video }),
      miniPlayerVideo: null,
      setMiniPlayerVideo: (video) => set({ miniPlayerVideo: video }),

      // Watch History
      watchHistory: [],
      addToWatchHistory: (videoId) =>
        set((state) => {
          const history = [videoId, ...state.watchHistory.filter((id) => id !== videoId)].slice(0, 100)
          return { watchHistory: history }
        }),
      removeFromWatchHistory: (videoId) =>
        set((state) => ({
          watchHistory: state.watchHistory.filter((id) => id !== videoId),
        })),
      clearWatchHistory: () => set({ watchHistory: [] }),

      // Watch Later
      watchLater: [],
      addToWatchLater: (videoId) =>
        set((state) => ({
          watchLater: state.watchLater.includes(videoId)
            ? state.watchLater
            : [...state.watchLater, videoId],
        })),
      removeFromWatchLater: (videoId) =>
        set((state) => ({
          watchLater: state.watchLater.filter((id) => id !== videoId),
        })),
      isInWatchLater: (videoId) => get().watchLater.includes(videoId),

      // Liked Videos
      likedVideos: [],
      toggleLikeVideo: (videoId) =>
        set((state) => ({
          likedVideos: state.likedVideos.includes(videoId)
            ? state.likedVideos.filter((id) => id !== videoId)
            : [...state.likedVideos, videoId],
        })),
      isVideoLiked: (videoId) => get().likedVideos.includes(videoId),

      // Subscriptions
      subscriptions: [],
      toggleSubscription: (channelId) =>
        set((state) => ({
          subscriptions: state.subscriptions.includes(channelId)
            ? state.subscriptions.filter((id) => id !== channelId)
            : [...state.subscriptions, channelId],
        })),
      isSubscribed: (channelId) => get().subscriptions.includes(channelId),
    }),
    {
      name: 'growthtube-storage',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        watchHistory: state.watchHistory,
        watchLater: state.watchLater,
        likedVideos: state.likedVideos,
        subscriptions: state.subscriptions,
        sidebar: { isExpanded: state.sidebar.isExpanded },
      }),
    }
  )
)
