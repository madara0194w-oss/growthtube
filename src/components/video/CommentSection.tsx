'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, MoreVertical, Flag } from 'lucide-react'
import { Comment } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { formatRelativeTime, formatViewCount } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import { mockComments } from '@/lib/mock-data'

interface CommentSectionProps {
  videoId: string
  commentCount: number
}

export function CommentSection({ videoId, commentCount }: CommentSectionProps) {
  const { isAuthenticated, openModal, user } = useStore()
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top')

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    if (!isAuthenticated) {
      openModal('login')
      return
    }

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const comment: Comment = {
      id: `c-${Date.now()}`,
      text: newComment,
      author: {
        id: user?.id || '',
        name: user?.displayName || 'Anonymous',
        avatar: user?.avatar || '',
        handle: user?.username || 'anonymous',
      },
      likes: 0,
      dislikes: 0,
      publishedAt: new Date().toISOString(),
      isEdited: false,
      isPinned: false,
      isHearted: false,
      replyCount: 0,
    }
    
    setComments([comment, ...comments])
    setNewComment('')
    setIsSubmitting(false)
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center gap-6 mb-6">
        <h3 className="text-xl font-semibold">{formatViewCount(commentCount)} Comments</h3>
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 text-sm font-medium hover:text-[var(--text-primary)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
              </svg>
              Sort by
            </button>
          }
          align="left"
        >
          <DropdownItem onClick={() => setSortBy('top')}>
            Top comments
          </DropdownItem>
          <DropdownItem onClick={() => setSortBy('newest')}>
            Newest first
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Add Comment */}
      <div className="flex gap-4 mb-8">
        <Avatar
          src={isAuthenticated ? user?.avatar : undefined}
          alt={isAuthenticated ? user?.displayName || 'User' : 'Guest'}
          size="md"
        />
        <div className="flex-1">
          <input
            type="text"
            placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to comment'}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onClick={() => !isAuthenticated && openModal('login')}
            className="w-full bg-transparent border-b border-[var(--border-color)] py-2 focus:outline-none focus:border-[var(--text-primary)] transition-colors"
          />
          {newComment && (
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setNewComment('')}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                isLoading={isSubmitting}
                disabled={!newComment.trim()}
              >
                Comment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  isReply?: boolean
}

function CommentItem({ comment, isReply = false }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [likes, setLikes] = useState(comment.likes)

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1)
      setLiked(false)
    } else {
      setLikes(likes + 1 + (disliked ? 0 : 0))
      setLiked(true)
      setDisliked(false)
    }
  }

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false)
    } else {
      if (liked) setLikes(likes - 1)
      setDisliked(true)
      setLiked(false)
    }
  }

  return (
    <div className={`flex gap-4 ${isReply ? 'ml-12' : ''}`}>
      <Avatar src={comment.author.avatar} alt={comment.author.name} size={isReply ? 'sm' : 'md'} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{comment.author.name}</span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {formatRelativeTime(comment.publishedAt)}
            {comment.isEdited && ' (edited)'}
          </span>
          {comment.isPinned && (
            <span className="text-xs bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">Pinned</span>
          )}
        </div>
        
        <p className="mt-1 text-sm whitespace-pre-wrap">{comment.text}</p>
        
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center">
            <IconButton size="sm" onClick={handleLike} aria-label="Like">
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </IconButton>
            <span className="text-xs text-[var(--text-secondary)]">{formatViewCount(likes)}</span>
          </div>
          <IconButton size="sm" onClick={handleDislike} aria-label="Dislike">
            <ThumbsDown className={`w-4 h-4 ${disliked ? 'fill-current' : ''}`} />
          </IconButton>
          <button className="text-xs font-medium hover:bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-full">
            Reply
          </button>
          {comment.isHearted && (
            <span className="text-[var(--accent)] text-sm">❤️ by creator</span>
          )}
          <Dropdown
            trigger={
              <IconButton size="sm" aria-label="More options">
                <MoreVertical className="w-4 h-4" />
              </IconButton>
            }
          >
            <DropdownItem icon={<Flag className="w-4 h-4" />}>Report</DropdownItem>
          </Dropdown>
        </div>

        {/* Replies */}
        {comment.replyCount > 0 && !isReply && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 mt-2 text-sm font-medium text-blue-500 hover:bg-blue-500/10 px-3 py-1.5 rounded-full -ml-3"
          >
            {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {comment.replyCount} replies
          </button>
        )}
        
        {showReplies && comment.replies && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
