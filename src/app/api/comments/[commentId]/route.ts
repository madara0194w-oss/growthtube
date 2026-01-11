import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { updateCommentSchema } from '@/lib/validations'
import { z } from 'zod'

interface RouteParams {
  params: { commentId: string }
}

// GET /api/comments/[commentId] - Get a single comment with replies
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { commentId } = params

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
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
        },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
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
      author: {
        id: comment.user.id,
        name: comment.user.displayName,
        handle: comment.user.username,
        avatar: comment.user.avatar,
      },
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        text: reply.text,
        likes: reply.likes,
        dislikes: reply.dislikes,
        isEdited: reply.isEdited,
        createdAt: reply.createdAt,
        author: {
          id: reply.user.id,
          name: reply.user.displayName,
          handle: reply.user.username,
          avatar: reply.user.avatar,
        },
      })),
    }

    return NextResponse.json(formattedComment)
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    )
  }
}

// PATCH /api/comments/[commentId] - Update a comment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { commentId } = params

    // Get comment and verify ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { text } = updateCommentSchema.parse(body)

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        text,
        isEdited: true,
      },
    })

    return NextResponse.json({
      message: 'Comment updated successfully',
      comment: updatedComment,
    })
  } catch (error) {
    console.error('Error updating comment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { commentId } = params

    // Get comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        video: {
          include: { channel: true },
        },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Allow deletion by comment author or video owner
    const isCommentAuthor = comment.userId === session.user.id
    const isVideoOwner = comment.video.channel.userId === session.user.id

    if (!isCommentAuthor && !isVideoOwner) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete comment and update video comment count
    await prisma.$transaction(async (tx) => {
      await tx.comment.delete({
        where: { id: commentId },
      })

      // Update video comment count (only for top-level comments)
      if (!comment.parentId) {
        await tx.video.update({
          where: { id: comment.videoId },
          data: { commentCount: { decrement: 1 } },
        })
      }
    })

    return NextResponse.json({
      message: 'Comment deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
