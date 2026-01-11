import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/debug-channels
 * Debug endpoint to check channels in database
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all channels
    const channels = await prisma.channel.findMany({
      select: {
        id: true,
        name: true,
        handle: true,
        videoCount: true,
        subscriberCount: true,
        createdAt: true,
        _count: {
          select: { videos: true }
        }
      },
      take: 20
    })

    const debug = {
      totalChannels: channels.length,
      channels: channels.map(c => ({
        name: c.name,
        handle: c.handle,
        handleType: c.handle.startsWith('UC') ? 'YouTube Channel ID (✅ Good)' : 
                    c.handle.startsWith('@') ? '@Handle (❌ Old format - need re-import)' :
                    'Unknown format (❌ Need re-import)',
        videosInDB: c._count.videos,
        videoCount: c.videoCount,
        createdAt: c.createdAt
      }))
    }

    return NextResponse.json(debug, { status: 200 })

  } catch (error: any) {
    console.error('Error debugging channels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
