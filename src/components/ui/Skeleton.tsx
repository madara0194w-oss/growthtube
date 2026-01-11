'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--bg-tertiary)]',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        variant === 'text' && 'rounded h-4',
        className
      )}
      style={{ width, height }}
    />
  )
}

export function VideoCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex gap-3">
        <Skeleton variant="circular" className="w-9 h-9 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function VideoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ChannelHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full h-32 md:h-48 rounded-xl" />
      <div className="flex gap-4 items-center">
        <Skeleton variant="circular" className="w-20 h-20" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-48 h-6" />
          <Skeleton variant="text" className="w-32" />
          <Skeleton variant="text" className="w-64" />
        </div>
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-32" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  )
}
