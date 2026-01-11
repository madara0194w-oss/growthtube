import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// GET /api/user - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        channel: {
          include: {
            links: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            likedVideos: true,
            watchHistory: true,
            watchLater: true,
            playlists: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const formattedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      channel: user.channel
        ? {
            id: user.channel.id,
            handle: user.channel.handle,
            name: user.channel.name,
            description: user.channel.description,
            avatar: user.channel.avatar,
            banner: user.channel.banner,
            subscriberCount: user.channel.subscriberCount,
            videoCount: user.channel.videoCount,
            totalViews: Number(user.channel.totalViews),
            isVerified: user.channel.isVerified,
            links: user.channel.links,
          }
        : null,
      stats: {
        subscriptions: user._count.subscriptions,
        likedVideos: user._count.likedVideos,
        watchHistory: user._count.watchHistory,
        watchLater: user._count.watchLater,
        playlists: user._count.playlists,
      },
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/user - Update current user profile
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
    const { displayName, bio, avatar, banner } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(banner !== undefined && { banner }),
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        banner: updatedUser.banner,
      },
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
