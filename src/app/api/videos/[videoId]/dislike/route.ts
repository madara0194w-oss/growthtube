import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

interface RouteParams {
  params: { videoId: string }
}

// POST /api/videos/[videoId]/dislike - Dislike a video
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

    // Check if already disliked
    const existingDislike = await prisma.dislike.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })

    if (existingDislike) {
      // Remove dislike (toggle off)
      await prisma.$transaction([
        prisma.dislike.delete({
          where: { userId_videoId: { userId, videoId } },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { dislikes: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({
        message: 'Dislike removed',
        disliked: false,
      })
    }

    // Check if previously liked
    const existingLike = await prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })

    // Add dislike and remove like if exists
    await prisma.$transaction([
      prisma.dislike.create({
        data: { userId, videoId },
      }),
      prisma.video.update({
        where: { id: videoId },
        data: { dislikes: { increment: 1 } },
      }),
      ...(existingLike
        ? [
            prisma.like.delete({
              where: { userId_videoId: { userId, videoId } },
            }),
            prisma.video.update({
              where: { id: videoId },
              data: { likes: { decrement: 1 } },
            }),
          ]
        : []),
    ])

    return NextResponse.json({
      message: 'Video disliked',
      disliked: true,
    })
  } catch (error) {
    console.error('Error disliking video:', error)
    return NextResponse.json(
      { error: 'Failed to dislike video' },
      { status: 500 }
    )
  }
}
