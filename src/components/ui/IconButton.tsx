'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
}

const variantClasses = {
  default: 'hover:bg-[var(--bg-tertiary)]',
  ghost: 'hover:bg-[var(--bg-hover)]',
  accent: 'hover:bg-[var(--accent)]/10 text-[var(--accent)]',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, variant = 'default', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-full transition-colors duration-200 flex items-center justify-center',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
