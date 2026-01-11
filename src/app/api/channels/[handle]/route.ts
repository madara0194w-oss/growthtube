import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { updateChannelSchema } from '@/lib/validations'
import { z } from 'zod'

interface RouteParams {
  params: { handle: string }
}

// GET /api/channels/[handle] - Get channel by handle
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { handle } = params
    const session = await getAuthSession()

    const channel = await prisma.channel.findUnique({
      where: { handle: handle.toLowerCase() },
      include: {
        links: true,
        _count: {
          select: {
            videos: {
              where: { visibility: 'PUBLIC', publishedAt: { not: null } },
            },
            subscribers: true,
          },
        },
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Check if current user is subscribed
    let isSubscribed = false
    if (session?.user?.id) {
      const subscription = await prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: session.user.id,
            channelId: channel.id,
          },
        },
      })
      isSubscribed = !!subscription
    }

    // Check if this is the user's own channel
    const isOwner = session?.user?.id === channel.userId

    const formattedChannel = {
      id: channel.id,
      handle: channel.handle,
      name: channel.name,
      description: channel.description,
      avatar: channel.avatar,
      banner: channel.banner,
      subscriberCount: channel.subscriberCount,
      videoCount: channel._count.videos,
      totalViews: Number(channel.totalViews),
      isVerified: channel.isVerified,
      createdAt: channel.createdAt,
      links: channel.links.map((link) => ({
        platform: link.platform,
        url: link.url,
      })),
      isSubscribed,
      isOwner,
    }

    return NextResponse.json(formattedChannel)
  } catch (error) {
    console.error('Error fetching channel:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channel' },
      { status: 500 }
    )
  }
}

// PATCH /api/channels/[handle] - Update channel
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { handle } = params

    // Get channel and verify ownership
    const channel = await prisma.channel.findUnique({
      where: { handle: handle.toLowerCase() },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    if (channel.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateChannelSchema.parse(body)

    const { links, ...channelData } = validatedData

    // Update channel and links in transaction
    const updatedChannel = await prisma.$transaction(async (tx) => {
      // Update channel
      const updated = await tx.channel.update({
        where: { id: channel.id },
        data: channelData,
      })

      // Update links if provided
      if (links !== undefined) {
        // Delete existing links
        await tx.channelLink.deleteMany({
          where: { channelId: channel.id },
        })

        // Create new links
        if (links.length > 0) {
          await tx.channelLink.createMany({
            data: links.map((link) => ({
              channelId: channel.id,
              platform: link.platform,
              url: link.url,
            })),
          })
        }
      }

      return updated
    })

    return NextResponse.json({
      message: 'Channel updated successfully',
      channel: updatedChannel,
    })
  } catch (error) {
    console.error('Error updating channel:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    )
  }
}
