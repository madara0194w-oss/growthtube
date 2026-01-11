import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { paginationSchema } from '@/lib/validations'

interface RouteParams {
  params: { handle: string }
}

// GET /api/channels/[handle]/videos - Get videos for a channel
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { handle } = params
    const { searchParams } = new URL(request.url)
    const session = await getAuthSession()

    const paginationParams = {
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    }
    const { limit, cursor } = paginationSchema.parse(paginationParams)

    const sortBy = searchParams.get('sort') || 'latest' // latest, popular, oldest

    // Get channel
    const channel = await prisma.channel.findUnique({
      where: { handle: handle.toLowerCase() },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Check if user is the channel owner (to see private videos)
    const isOwner = session?.user?.id === channel.userId

    const where: any = {
      channelId: channel.id,
      ...(isOwner
        ? {}
        : {
            visibility: 'PUBLIC',
            publishedAt: { not: null },
          }),
    }

    // Determine sort order
    let orderBy: any = { publishedAt: 'desc' }
    if (sortBy === 'popular') {
      orderBy = { views: 'desc' }
    } else if (sortBy === 'oldest') {
      orderBy = { publishedAt: 'asc' }
    }

    const videos = await prisma.video.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy,
      include: {
        tags: {
          select: { tag: true },
        },
      },
    })

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
      tags: video.tags.map((t) => t.tag),
    }))

    return NextResponse.json({
      videos: formattedVideos,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching channel videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channel videos' },
      { status: 500 }
    )
  }
}
