import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

interface RouteParams {
  params: { videoId: string }
}

// POST /api/videos/[videoId]/like - Like a video
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { videoId } = params
    const userId = session.user.id

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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })

    if (existingLike) {
      // Remove like (toggle off)
      await prisma.$transaction([
        prisma.like.delete({
          where: { userId_videoId: { userId, videoId } },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likes: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({
        message: 'Like removed',
        liked: false,
      })
    }

    // Check if previously disliked
    const existingDislike = await prisma.dislike.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })

    // Add like and remove dislike if exists
    await prisma.$transaction([
      prisma.like.create({
        data: { userId, videoId },
      }),
      ...(existingDislike
        ? [
            prisma.dislike.delete({
              where: { userId_videoId: { userId, videoId } },
            }),
          ]
        : []),
      // Single video update with both operations
      prisma.video.update({
        where: { id: videoId },
        data: {
          likes: { increment: 1 },
          ...(existingDislike && { dislikes: { decrement: 1 } }),
        },
      }),
    ])

    return NextResponse.json({
      message: 'Video liked',
      liked: true,
    })
  } catch (error) {
    console.error('Error liking video:', error)
    return NextResponse.json(
      { error: 'Failed to like video' },
      { status: 500 }
    )
  }
}
