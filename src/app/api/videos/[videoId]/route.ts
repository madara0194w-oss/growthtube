import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { updateVideoSchema } from '@/lib/validations'
import { z } from 'zod'

interface RouteParams {
  params: { videoId: string }
}

// GET /api/videos/[videoId] - Get a single video
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { videoId } = params
    const session = await getAuthSession()

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatar: true,
            isVerified: true,
            subscriberCount: true,
            userId: true,
          },
        },
        tags: {
          select: { tag: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check visibility permissions
    if (video.visibility === 'PRIVATE') {
      if (!session?.user?.id || video.channel.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        )
      }
    }

    // Increment view count (in production, you'd want to throttle this)
    await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    })

    // Check if user has liked/disliked the video
    let userInteraction = null
    if (session?.user?.id) {
      const [like, dislike] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_videoId: { userId: session.user.id, videoId } },
        }),
        prisma.dislike.findUnique({
          where: { userId_videoId: { userId: session.user.id, videoId } },
        }),
      ])
      userInteraction = like ? 'liked' : dislike ? 'disliked' : null
    }

    // Check if user is subscribed to the channel
    let isSubscribed = false
    if (session?.user?.id) {
      const subscription = await prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: session.user.id,
            channelId: video.channelId,
          },
        },
      })
      isSubscribed = !!subscription
    }

    const formattedVideo = {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      duration: video.duration,
      views: Number(video.views) + 1, // Include the current view
      likes: video.likes,
      dislikes: video.dislikes,
      commentCount: video._count.comments,
      category: video.category.toLowerCase(),
      visibility: video.visibility.toLowerCase(),
      isLive: video.isLive,
      isShort: video.isShort,
      publishedAt: video.publishedAt,
      createdAt: video.createdAt,
      channel: {
        ...video.channel,
        isSubscribed,
      },
      tags: video.tags.map((t) => t.tag),
      userInteraction,
    }

    return NextResponse.json(formattedVideo)
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
}

// PATCH /api/videos/[videoId] - Update a video
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { videoId } = params

    // Get video and check ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.channel.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateVideoSchema.parse(body)

    const { tags, ...videoData } = validatedData

    // Update video
    const updatedVideo = await prisma.$transaction(async (tx) => {
      // Update video data
      const updated = await tx.video.update({
        where: { id: videoId },
        data: {
          ...videoData,
          // Set publishedAt if changing from private to public
          ...(videoData.visibility === 'PUBLIC' && !video.publishedAt && {
            publishedAt: new Date(),
          }),
        },
      })

      // Update tags if provided
      if (tags !== undefined) {
        // Delete existing tags
        await tx.videoTag.deleteMany({
          where: { videoId },
        })

        // Create new tags
        if (tags.length > 0) {
          await tx.videoTag.createMany({
            data: tags.map((tag) => ({
              videoId,
              tag: tag.toLowerCase(),
            })),
          })
        }
      }

      return updated
    })

    return NextResponse.json({
      message: 'Video updated successfully',
      video: updatedVideo,
    })
  } catch (error) {
    console.error('Error updating video:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}

// DELETE /api/videos/[videoId] - Delete a video
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { videoId } = params

    // Get video and check ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.channel.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete video and update channel count
    await prisma.$transaction(async (tx) => {
      await tx.video.delete({
        where: { id: videoId },
      })

      await tx.channel.update({
        where: { id: video.channelId },
        data: { videoCount: { decrement: 1 } },
      })
    })

    return NextResponse.json({
      message: 'Video deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
