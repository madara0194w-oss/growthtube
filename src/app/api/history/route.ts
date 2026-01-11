import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { paginationSchema } from '@/lib/validations'

// GET /api/history - Get user's watch history
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

    const history = await prisma.watchHistory.findMany({
      where: { userId: session.user.id },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { watchedAt: 'desc' },
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
    if (history.length > limit) {
      const nextItem = history.pop()
      nextCursor = nextItem?.id
    }

    const formattedHistory = history.map((item) => ({
      id: item.id,
      watchedAt: item.watchedAt,
      progress: item.progress,
      video: {
        id: item.video.id,
        title: item.video.title,
        thumbnail: item.video.thumbnail,
        duration: item.video.duration,
        views: Number(item.video.views),
        publishedAt: item.video.publishedAt,
        channel: item.video.channel,
      },
    }))

    return NextResponse.json({
      history: formattedHistory,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching watch history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watch history' },
      { status: 500 }
    )
  }
}

// POST /api/history - Add to watch history
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
    const { videoId, progress = 0 } = body

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    // Upsert watch history entry
    await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
      update: {
        watchedAt: new Date(),
        progress,
      },
      create: {
        userId: session.user.id,
        videoId,
        progress,
      },
    })

    return NextResponse.json({
      message: 'Watch history updated',
    })
  } catch (error) {
    console.error('Error updating watch history:', error)
    return NextResponse.json(
      { error: 'Failed to update watch history' },
      { status: 500 }
    )
  }
}

// DELETE /api/history - Clear watch history
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

    if (videoId) {
      // Delete specific video from history
      await prisma.watchHistory.deleteMany({
        where: {
          userId: session.user.id,
          videoId,
        },
      })
    } else {
      // Clear all history
      await prisma.watchHistory.deleteMany({
        where: { userId: session.user.id },
      })
    }

    return NextResponse.json({
      message: 'Watch history cleared',
    })
  } catch (error) {
    console.error('Error clearing watch history:', error)
    return NextResponse.json(
      { error: 'Failed to clear watch history' },
      { status: 500 }
    )
  }
}
