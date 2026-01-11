import { z } from 'zod'

// Video validations
export const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long').optional(),
  videoUrl: z.string().url('Invalid video URL'),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  duration: z.number().int().positive().optional(),
  category: z.enum([
    'MUSIC', 'GAMING', 'NEWS', 'SPORTS', 'ENTERTAINMENT', 'EDUCATION',
    'SCIENCE', 'TECHNOLOGY', 'COMEDY', 'FILM', 'HOWTO', 'TRAVEL',
    'PETS', 'FASHION', 'FOOD', 'FITNESS', 'PODCASTS'
  ]).default('ENTERTAINMENT'),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
  isShort: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(500).optional(),
})

export const updateVideoSchema = createVideoSchema.partial()

// Comment validations
export const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(10000, 'Comment is too long'),
  parentId: z.string().optional(),
})

export const updateCommentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(10000, 'Comment is too long'),
})

// Channel validations
export const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  avatar: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  links: z.array(z.object({
    platform: z.string().min(1).max(50),
    url: z.string().url(),
  })).max(10).optional(),
})

// Playlist validations
export const createPlaylistSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title is too long'),
  description: z.string().max(5000).optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
})

export const updatePlaylistSchema = createPlaylistSchema.partial()

// Search validations
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['video', 'channel', 'playlist']).optional(),
  category: z.string().optional(),
  duration: z.enum(['short', 'medium', 'long']).optional(),
  uploadDate: z.enum(['hour', 'today', 'week', 'month', 'year']).optional(),
  sortBy: z.enum(['relevance', 'date', 'views', 'rating']).default('relevance'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

// Pagination
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

export type CreateVideoInput = z.infer<typeof createVideoSchema>
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>
export type SearchInput = z.infer<typeof searchSchema>
