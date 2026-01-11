'use client'

import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

export function Avatar({ src, alt, size = 'md', className, onClick }: AvatarProps) {
  const initials = getInitials(alt)

  if (!src) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'avatar flex items-center justify-center font-medium text-[var(--text-primary)]',
          sizeClasses[size],
          onClick && 'cursor-pointer',
          className
        )}
      >
        {initials}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'avatar relative overflow-hidden flex-shrink-0',
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={size === 'xl' ? '80px' : size === 'lg' ? '48px' : size === 'md' ? '40px' : size === 'sm' ? '32px' : '24px'}
      />
    </div>
  )
}
