import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { createVideoSchema, paginationSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/videos - Get videos with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
      category: searchParams.get('category') || undefined,
      channelId: searchParams.get('channelId') || undefined,
    }

    const { limit, cursor } = paginationSchema.parse(params)

    const where: any = {
      visibility: 'PUBLIC',
      publishedAt: { not: null },
    }

    if (params.category && params.category !== 'all') {
      where.category = params.category.toUpperCase()
    }

    if (params.channelId) {
      where.channelId = params.channelId
    }

    // Get videos and shuffle them for variety across channels
    const allVideos = await prisma.video.findMany({
      where,
      take: 500, // Fetch all available videos
      orderBy: { publishedAt: 'desc' },
      include: {
        channel: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatar: true,
            isVerified: true,
            subscriberCount: true,
          },
        },
        tags: {
          select: { tag: true },
        },
      },
    })

    // Shuffle videos to mix channels
    function shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    // If no cursor (first page), shuffle. Otherwise, use cursor-based pagination
    let videos
    if (cursor) {
      const cursorIndex = allVideos.findIndex(v => v.id === cursor)
      videos = allVideos.slice(cursorIndex + 1, cursorIndex + 1 + limit + 1)
    } else {
      videos = shuffleArray(allVideos).slice(0, limit + 1)
    }

    let nextCursor: string | undefined
    if (videos.length > limit) {
      const nextItem = videos.pop()
      nextCursor = nextItem?.id
    }

    const formattedVideos = videos.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      duration: video.duration,
      views: Number(video.views),
      likes: video.likes,
      dislikes: video.dislikes,
      category: video.category.toLowerCase(),
      visibility: video.visibility.toLowerCase(),
      isLive: video.isLive,
      isShort: video.isShort,
      publishedAt: video.publishedAt,
      channel: video.channel,
      tags: video.tags.map((t) => t.tag),
    }))

    return NextResponse.json({
      videos: formattedVideos,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

// POST /api/videos - Create a new video
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's channel
    const channel = await prisma.channel.findUnique({
      where: { userId: session.user.id },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found. Please create a channel first.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createVideoSchema.parse(body)

    const { tags, ...videoData } = validatedData

    // Create video with tags
    const video = await prisma.$transaction(async (tx) => {
      const newVideo = await tx.video.create({
        data: {
          ...videoData,
          channelId: channel.id,
          publishedAt: videoData.visibility === 'PUBLIC' ? new Date() : null,
        },
      })

      // Create tags if provided
      if (tags && tags.length > 0) {
        await tx.videoTag.createMany({
          data: tags.map((tag) => ({
            videoId: newVideo.id,
            tag: tag.toLowerCase(),
          })),
        })
      }

      // Update channel video count
      await tx.channel.update({
        where: { id: channel.id },
        data: { videoCount: { increment: 1 } },
      })

      return newVideo
    })

    return NextResponse.json(
      { message: 'Video created successfully', video },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating video:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
