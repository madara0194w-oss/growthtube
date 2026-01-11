import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { paginationSchema } from '@/lib/validations'

// GET /api/subscriptions/feed - Get videos from subscribed channels
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paginationParams = {
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    }
    const { limit, cursor } = paginationSchema.parse(paginationParams)

    // Get user's subscribed channel IDs
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: session.user.id },
      select: { channelId: true },
    })

    const channelIds = subscriptions.map((s) => s.channelId)

    if (channelIds.length === 0) {
      return NextResponse.json({
        videos: [],
        nextCursor: undefined,
      })
    }

    // Get videos from subscribed channels
    const videos = await prisma.video.findMany({
      where: {
        channelId: { in: channelIds },
        visibility: 'PUBLIC',
        publishedAt: { not: null },
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { publishedAt: 'desc' },
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
    console.error('Error fetching subscription feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription feed' },
      { status: 500 }
    )
  }
}
