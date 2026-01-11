import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { paginationSchema } from '@/lib/validations'

// GET /api/notifications - Get user's notifications
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
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: any = {
      userId: session.user.id,
      ...(unreadOnly && { isRead: false }),
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined
    if (notifications.length > limit) {
      const nextItem = notifications.pop()
      nextCursor = nextItem?.id
    }

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: { isRead: true },
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: { isRead: true },
      })
    }

    return NextResponse.json({
      message: 'Notifications marked as read',
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete notifications
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
    const notificationId = searchParams.get('id')

    if (notificationId) {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      })
    } else {
      // Delete all notifications
      await prisma.notification.deleteMany({
        where: { userId: session.user.id },
      })
    }

    return NextResponse.json({
      message: 'Notifications deleted',
    })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
