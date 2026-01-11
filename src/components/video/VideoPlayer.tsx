'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, SkipBack, SkipForward, PictureInPicture2,
  Subtitles, Repeat, Theater, Loader2
} from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'
import { PLAYER_SETTINGS, KEYBOARD_SHORTCUTS } from '@/lib/constants'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  autoPlay?: boolean
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
}

export function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(PLAYER_SETTINGS.defaultVolume)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(PLAYER_SETTINGS.defaultPlaybackRate)
  const [showSettings, setShowSettings] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }, [isPlaying])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, newVolume))
      videoRef.current.volume = clampedVolume
      setVolume(clampedVolume)
      setIsMuted(clampedVolume === 0)
    }
  }, [])

  // Seek to position
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration))
    }
  }, [duration])

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      seekTo(videoRef.current.currentTime + seconds)
    }
  }, [seekTo])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      seekTo(percent * duration)
    }
  }

  // Change playback rate
  const changePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }, [])

  // Picture-in-Picture
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (err) {
      console.error('PiP error:', err)
    }
  }, [])

  // Show controls on mouse move
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key
      const shortcuts = KEYBOARD_SHORTCUTS.player

      if (shortcuts.togglePlay.includes(key)) {
        e.preventDefault()
        togglePlay()
      } else if (shortcuts.toggleMute.includes(key)) {
        e.preventDefault()
        toggleMute()
      } else if (shortcuts.toggleFullscreen.includes(key)) {
        e.preventDefault()
        toggleFullscreen()
      } else if (shortcuts.seekForward.includes(key)) {
        e.preventDefault()
        skip(PLAYER_SETTINGS.seekTime)
      } else if (shortcuts.seekBackward.includes(key)) {
        e.preventDefault()
        skip(-PLAYER_SETTINGS.seekTime)
      } else if (shortcuts.volumeUp.includes(key)) {
        e.preventDefault()
        handleVolumeChange(volume + PLAYER_SETTINGS.volumeStep)
      } else if (shortcuts.volumeDown.includes(key)) {
        e.preventDefault()
        handleVolumeChange(volume - PLAYER_SETTINGS.volumeStep)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, toggleMute, toggleFullscreen, skip, handleVolumeChange, volume])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime, video.duration)
    }
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onTimeUpdate, onEnded])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black group',
        isTheaterMode ? 'w-full' : 'aspect-video',
        isFullscreen && 'fixed inset-0 z-50'
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        playsInline
        onClick={togglePlay}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Play button overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
        >
          <div className="w-16 h-16 bg-[var(--accent)]/90 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent',
          'transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="h-1 mx-3 mb-2 bg-white/30 cursor-pointer group/progress hover:h-1.5 transition-all"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-white/50 absolute"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="h-full bg-[var(--accent)] relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--accent)] rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
            </button>
            <button onClick={() => skip(-10)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <SkipBack className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => skip(10)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/volume">
              <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-white"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm ml-2">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-[var(--bg-secondary)] rounded-lg shadow-lg py-2 min-w-[200px]">
                  <div className="px-4 py-2 text-sm text-[var(--text-secondary)]">Playback Speed</div>
                  {PLAYER_SETTINGS.playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => { changePlaybackRate(rate); setShowSettings(false) }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-tertiary)]',
                        playbackRate === rate && 'text-[var(--accent)]'
                      )}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={togglePiP} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <PictureInPicture2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors hidden md:block"
            >
              <Theater className="w-5 h-5 text-white" />
            </button>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
