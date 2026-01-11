import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

interface RouteParams {
  params: { handle: string }
}

// POST /api/channels/[handle]/subscribe - Subscribe/Unsubscribe to a channel
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { handle } = params
    const userId = session.user.id

    // Get channel
    const channel = await prisma.channel.findUnique({
      where: { handle: handle.toLowerCase() },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Can't subscribe to own channel
    if (channel.userId === userId) {
      return NextResponse.json(
        { error: "You can't subscribe to your own channel" },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId: userId,
          channelId: channel.id,
        },
      },
    })

    if (existingSubscription) {
      // Unsubscribe
      await prisma.$transaction([
        prisma.subscription.delete({
          where: {
            subscriberId_channelId: {
              subscriberId: userId,
              channelId: channel.id,
            },
          },
        }),
        prisma.channel.update({
          where: { id: channel.id },
          data: { subscriberCount: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({
        message: 'Unsubscribed successfully',
        subscribed: false,
        subscriberCount: channel.subscriberCount - 1,
      })
    }

    // Subscribe
    await prisma.$transaction([
      prisma.subscription.create({
        data: {
          subscriberId: userId,
          channelId: channel.id,
        },
      }),
      prisma.channel.update({
        where: { id: channel.id },
        data: { subscriberCount: { increment: 1 } },
      }),
    ])

    // Create notification for the channel owner
    await prisma.notification.create({
      data: {
        userId: channel.userId,
        type: 'SUBSCRIBE',
        title: 'New subscriber!',
        message: `${session.user.name || session.user.username} subscribed to your channel`,
        link: `/@${session.user.username}`,
      },
    })

    return NextResponse.json({
      message: 'Subscribed successfully',
      subscribed: true,
      subscriberCount: channel.subscriberCount + 1,
    })
  } catch (error) {
    console.error('Error subscribing to channel:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}

// GET /api/channels/[handle]/subscribe - Check subscription status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ subscribed: false })
    }

    const { handle } = params

    const channel = await prisma.channel.findUnique({
      where: { handle: handle.toLowerCase() },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId: session.user.id,
          channelId: channel.id,
        },
      },
    })

    return NextResponse.json({
      subscribed: !!subscription,
      notificationsEnabled: subscription?.notificationsEnabled ?? false,
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    )
  }
}
