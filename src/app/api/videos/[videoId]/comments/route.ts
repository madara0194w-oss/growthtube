import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { createCommentSchema, paginationSchema } from '@/lib/validations'
import { z } from 'zod'

interface RouteParams {
  params: { videoId: string }
}

// GET /api/videos/[videoId]/comments - Get comments for a video
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { videoId } = params
    const { searchParams } = new URL(request.url)

    const paginationParams = {
      limit: searchParams.get('limit') || '20',
      cursor: searchParams.get('cursor') || undefined,
    }
    const { limit, cursor } = paginationSchema.parse(paginationParams)

    const sortBy = searchParams.get('sort') || 'top' // top, newest

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

    // Get top-level comments (not replies)
    let orderBy: any = [{ isPinned: 'desc' }, { likes: 'desc' }, { createdAt: 'desc' }]
    if (sortBy === 'newest') {
      orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    }

    const comments = await prisma.comment.findMany({
      where: {
        videoId,
        parentId: null, // Only top-level comments
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    let nextCursor: string | undefined
    if (comments.length > limit) {
      const nextItem = comments.pop()
      nextCursor = nextItem?.id
    }

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      likes: comment.likes,
      dislikes: comment.dislikes,
      isPinned: comment.isPinned,
      isHearted: comment.isHearted,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      replyCount: comment._count.replies,
      author: {
        id: comment.user.id,
        name: comment.user.displayName,
        handle: comment.user.username,
        avatar: comment.user.avatar,
      },
    }))

    return NextResponse.json({
      comments: formattedComments,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/videos/[videoId]/comments - Create a comment
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

    // Check if video exists
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

    const body = await request.json()
    const { text, parentId } = createCommentSchema.parse(body)

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId, videoId },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create comment and update video comment count
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          videoId,
          userId: session.user.id,
          parentId,
          text,
        },
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

      // Update video comment count (only for top-level comments)
      if (!parentId) {
        await tx.video.update({
          where: { id: videoId },
          data: { commentCount: { increment: 1 } },
        })
      }

      return newComment
    })

    // Create notification for video owner (if not commenting on own video)
    if (video.channel.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: video.channel.userId,
          type: 'COMMENT',
          title: 'New comment on your video',
          message: `${session.user.name || session.user.username} commented: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
          thumbnail: video.thumbnail,
          link: `/watch?v=${videoId}`,
        },
      })
    }

    const formattedComment = {
      id: comment.id,
      text: comment.text,
      likes: comment.likes,
      dislikes: comment.dislikes,
      isPinned: comment.isPinned,
      isHearted: comment.isHearted,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      replyCount: 0,
      author: {
        id: comment.user.id,
        name: comment.user.displayName,
        handle: comment.user.username,
        avatar: comment.user.avatar,
      },
    }

    return NextResponse.json(
      { message: 'Comment created successfully', comment: formattedComment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating comment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
