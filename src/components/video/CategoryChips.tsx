'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { VideoCategory } from '@/types'
import { VIDEO_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/IconButton'

interface CategoryChipsProps {
  activeCategory: VideoCategory
  onCategoryChange: (category: VideoCategory) => void
}

export function CategoryChips({ activeCategory, onCategoryChange }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const updateArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
      setTimeout(updateArrows, 300)
    }
  }

  return (
    <div className="relative flex items-center">
      {/* Left Arrow */}
      {showLeftArrow && (
        <div className="absolute left-0 z-10 flex items-center bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pr-4">
          <IconButton onClick={() => scroll('left')} size="sm" aria-label="Scroll left">
            <ChevronLeft className="w-5 h-5" />
          </IconButton>
        </div>
      )}

      {/* Chips Container */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
      >
        {VIDEO_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'chip whitespace-nowrap flex-shrink-0',
              activeCategory === category.id && 'chip-active'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <div className="absolute right-0 z-10 flex items-center bg-gradient-to-l from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pl-4">
          <IconButton onClick={() => scroll('right')} size="sm" aria-label="Scroll right">
            <ChevronRight className="w-5 h-5" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
