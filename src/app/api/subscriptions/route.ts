import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { paginationSchema } from '@/lib/validations'

// GET /api/subscriptions - Get user's subscriptions
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
      limit: searchParams.get('limit') || '50',
      cursor: searchParams.get('cursor') || undefined,
    }
    const { limit, cursor } = paginationSchema.parse(paginationParams)

    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: session.user.id },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        channel: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatar: true,
            isVerified: true,
            subscriberCount: true,
          },
        },
      },
    })

    let nextCursor: string | undefined
    if (subscriptions.length > limit) {
      const nextItem = subscriptions.pop()
      nextCursor = nextItem?.id
    }

    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      channel: sub.channel,
      notificationsEnabled: sub.notificationsEnabled,
      subscribedAt: sub.createdAt,
    }))

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
