import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { paginationSchema } from '@/lib/validations'

// GET /api/watch-later - Get user's watch later list
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

    const watchLater = await prisma.watchLater.findMany({
      where: { userId: session.user.id },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        video: {
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
          },
        },
      },
    })

    let nextCursor: string | undefined
    if (watchLater.length > limit) {
      const nextItem = watchLater.pop()
      nextCursor = nextItem?.id
    }

    const formattedWatchLater = watchLater.map((item) => ({
      id: item.id,
      addedAt: item.createdAt,
      video: {
        id: item.video.id,
        title: item.video.title,
        description: item.video.description,
        thumbnail: item.video.thumbnail,
        duration: item.video.duration,
        views: Number(item.video.views),
        publishedAt: item.video.publishedAt,
        channel: item.video.channel,
      },
    }))

    return NextResponse.json({
      videos: formattedWatchLater,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching watch later:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watch later' },
      { status: 500 }
    )
  }
}

// POST /api/watch-later - Add to watch later
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if already in watch later
    const existing = await prisma.watchLater.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Video already in watch later' },
        { status: 400 }
      )
    }

    await prisma.watchLater.create({
      data: {
        userId: session.user.id,
        videoId,
      },
    })

    return NextResponse.json({
      message: 'Added to watch later',
    })
  } catch (error) {
    console.error('Error adding to watch later:', error)
    return NextResponse.json(
      { error: 'Failed to add to watch later' },
      { status: 500 }
    )
  }
}

// DELETE /api/watch-later - Remove from watch later
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    await prisma.watchLater.deleteMany({
      where: {
        userId: session.user.id,
        videoId,
      },
    })

    return NextResponse.json({
      message: 'Removed from watch later',
    })
  } catch (error) {
    console.error('Error removing from watch later:', error)
    return NextResponse.json(
      { error: 'Failed to remove from watch later' },
      { status: 500 }
    )
  }
}
