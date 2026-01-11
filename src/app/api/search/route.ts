import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { searchSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/search - Search videos, channels, and playlists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const params = {
      q: searchParams.get('q') || '',
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      duration: searchParams.get('duration') || undefined,
      uploadDate: searchParams.get('uploadDate') || undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    }

    const validatedParams = searchSchema.parse(params)
    const { q, type, category, duration, uploadDate, sortBy, limit, cursor } = validatedParams

    const results: any = {
      videos: [],
      channels: [],
      playlists: [],
    }

    // Build date filter
    let dateFilter: Date | undefined
    if (uploadDate) {
      const now = new Date()
      switch (uploadDate) {
        case 'hour':
          dateFilter = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case 'today':
          dateFilter = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }
    }

    // Search videos
    if (!type || type === 'video') {
      const videoWhere: any = {
        visibility: 'PUBLIC',
        publishedAt: {
          not: null,
          ...(dateFilter && { gte: dateFilter }),
        },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { some: { tag: { contains: q.toLowerCase() } } } },
        ],
      }

      // Category filter
      if (category && category !== 'all') {
        videoWhere.category = category.toUpperCase()
      }

      // Duration filter
      if (duration) {
        switch (duration) {
          case 'short':
            videoWhere.duration = { lt: 240 } // < 4 min
            break
          case 'medium':
            videoWhere.duration = { gte: 240, lte: 1200 } // 4-20 min
            break
          case 'long':
            videoWhere.duration = { gt: 1200 } // > 20 min
            break
        }
      }

      // Sort order
      let orderBy: any = { publishedAt: 'desc' }
      switch (sortBy) {
        case 'date':
          orderBy = { publishedAt: 'desc' }
          break
        case 'views':
          orderBy = { views: 'desc' }
          break
        case 'rating':
          orderBy = { likes: 'desc' }
          break
        case 'relevance':
        default:
          // For relevance, we'd ideally use full-text search
          // For now, sort by a combination of views and recency
          orderBy = [{ views: 'desc' }, { publishedAt: 'desc' }]
          break
      }

      const videos = await prisma.video.findMany({
        where: videoWhere,
        take: limit,
        ...(cursor && type === 'video' && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy,
        include: {
          channel: {
            select: {
              id: true,
              handle: true,
              name: true,
              avatar: true,
              isVerified: true,
            },
          },
          tags: {
            select: { tag: true },
          },
        },
      })

      results.videos = videos.map((video) => ({
        type: 'video',
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        videoUrl: video.videoUrl,
        duration: video.duration,
        views: Number(video.views),
        likes: video.likes,
        category: video.category.toLowerCase(),
        isLive: video.isLive,
        isShort: video.isShort,
        publishedAt: video.publishedAt,
        channel: video.channel,
        tags: video.tags.map((t) => t.tag),
      }))
    }

    // Search channels
    if (!type || type === 'channel') {
      const channels = await prisma.channel.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { handle: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: type === 'channel' ? limit : 5,
        ...(cursor && type === 'channel' && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: { subscriberCount: 'desc' },
      })

      results.channels = channels.map((channel) => ({
        type: 'channel',
        id: channel.id,
        handle: channel.handle,
        name: channel.name,
        description: channel.description,
        avatar: channel.avatar,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        isVerified: channel.isVerified,
      }))
    }

    // Search playlists
    if (!type || type === 'playlist') {
      const playlists = await prisma.playlist.findMany({
        where: {
          visibility: 'PUBLIC',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: type === 'playlist' ? limit : 5,
        ...(cursor && type === 'playlist' && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: { videoCount: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      })

      results.playlists = playlists.map((playlist) => ({
        type: 'playlist',
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        thumbnail: playlist.thumbnail,
        videoCount: playlist.videoCount,
        owner: {
          id: playlist.user.id,
          name: playlist.user.displayName,
          handle: playlist.user.username,
          avatar: playlist.user.avatar,
        },
      }))
    }

    // Calculate next cursor based on type
    let nextCursor: string | undefined
    if (type === 'video' && results.videos.length === limit) {
      nextCursor = results.videos[results.videos.length - 1]?.id
    } else if (type === 'channel' && results.channels.length === limit) {
      nextCursor = results.channels[results.channels.length - 1]?.id
    } else if (type === 'playlist' && results.playlists.length === limit) {
      nextCursor = results.playlists[results.playlists.length - 1]?.id
    }

    return NextResponse.json({
      query: q,
      ...results,
      nextCursor,
    })
  } catch (error) {
    console.error('Error searching:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
