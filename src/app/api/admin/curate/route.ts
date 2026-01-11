import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { evaluateVideo, shouldAutoApprove, shouldReview, shouldAutoReject } from '@/lib/ai-curator'
import { getChannelVideos, getChannelIdFromHandle } from '@/lib/youtube'

/**
 * POST /api/admin/curate
 * Curate videos from YouTube using AI
 */
export async function POST(req: NextRequest) {
  console.log('[API] POST request received')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[API] Session:', session?.user?.email || 'No session')

    // Check if user is admin
    if (!session?.user?.email) {
      console.log('[API] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }

    // Check admin access
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    console.log('[API] Admin emails configured:', adminEmails)
    console.log('[API] User email:', session.user.email)
    
    if (!adminEmails.includes(session.user.email)) {
      console.log('[API] Forbidden - not admin')
      return NextResponse.json({ error: 'Admin access required. Your email: ' + session.user.email }, { status: 403 })
    }

    const body = await req.json()
    const { type, url, channelId, query } = body
    
    console.log('[API] Request body:', { type, url, channelId })

    let videos: any[] = []

    // Fetch videos based on type
    if (type === 'channel' && (url || channelId)) {
      // Import all videos from a channel
      let id = channelId

      if (!id && url) {
        // Extract from URL
        const extracted = extractChannelIdFromUrl(url)

        console.log('[DEBUG] Extracted from URL:', extracted)

        // If it's a handle (@username), resolve it
        if (extracted.startsWith('@')) {
          const cleanHandle = extracted.replace('@', '')
          console.log('[DEBUG] Resolving handle:', cleanHandle)
          const resolvedId = await getChannelIdFromHandle(cleanHandle)
          console.log('[DEBUG] Resolved ID:', resolvedId)
          if (!resolvedId) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
          }
          id = resolvedId
        } else {
          id = extracted
        }
      }

      console.log('[DEBUG] Final channel ID:', id)

      if (!id) {
        return NextResponse.json({ error: 'Could not determine channel ID' }, { status: 400 })
      }

      // Fetch videos (default 50, can be increased)
      console.log('[DEBUG] Fetching videos from channel ID:', id)
      const fetchedVideos = await getChannelVideos(id, 50)
      console.log('[DEBUG] Fetched videos count:', fetchedVideos.length)

      // Convert to format expected by evaluator
      videos = fetchedVideos.map(v => ({
        id: v.id,
        channelId: v.channelId,
        title: v.title,
        description: v.description,
        channelName: v.channelTitle,
        thumbnail: v.thumbnail,
        duration: v.duration,
        publishedAt: new Date(v.publishedAt),
        tags: [] // YouTube API v3 doesn't provide tags easily, would need extra call
      }))

    } else if (type === 'video' && url) {
      return NextResponse.json({ error: 'Single video import not yet implemented. Use channel import instead.' }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    console.log('[DEBUG] Starting to process', videos.length, 'videos')

    const results = {
      total: videos.length,
      autoApproved: 0,
      needsReview: 0,
      rejected: 0,
      imported: 0,
      errors: 0,
      items: [] as any[],
    }

    // Process each video
    for (const video of videos) {
      try {
        // Check if already in queue
        const existing = await prisma.curationQueue.findUnique({
          where: { youtubeVideoId: video.id },
        })

        if (existing) {
          results.items.push({
            videoId: video.id,
            title: video.title,
            status: 'already_exists',
            aiScore: existing.aiScore,
          })
          continue
        }

        // Prepare video metadata for AI evaluation
        const durationMinutes = Math.floor(video.duration / 60)
        const evaluation = await evaluateVideo({
          title: video.title,
          description: video.description || '',
          channel_name: video.channelName,
          duration_minutes: durationMinutes,
          tags: video.tags || [],
        })

        // Determine status based on AI evaluation
        let status: 'AUTO_APPROVED' | 'PENDING' | 'REJECTED'

        if (shouldAutoApprove(evaluation)) {
          status = 'AUTO_APPROVED'
          results.autoApproved++
        } else if (shouldReview(evaluation)) {
          status = 'PENDING'
          results.needsReview++
        } else {
          status = 'REJECTED'
          results.rejected++
        }

        // Add to curation queue
        await prisma.curationQueue.create({
          data: {
            youtubeVideoId: video.id,
            youtubeChannelId: video.channelId,
            title: video.title,
            description: video.description,
            channelName: video.channelName,
            thumbnail: video.thumbnail,
            duration: video.duration,
            publishedAt: video.publishedAt,
            tags: video.tags || [],
            aiScore: evaluation.score,
            aiDecision: evaluation.decision,
            aiCategory: evaluation.category,
            aiConfidence: evaluation.confidence,
            aiReason: evaluation.rejection_reason || null,
            aiTags: evaluation.tags,
            status,
          },
        })

        results.items.push({
          videoId: video.id,
          title: video.title,
          status,
          aiScore: evaluation.score,
          aiCategory: evaluation.category,
          aiReason: evaluation.rejection_reason,
        })

        // Auto-import high-scoring videos
        if (status === 'AUTO_APPROVED') {
          try {
            await importVideoToDatabase(video, evaluation, session.user.email!)
            results.imported++
          } catch (importError: any) {
            console.error('Import error:', importError)
            // Still count as approved, just failed to import
          }
        }

      } catch (error: any) {
        console.error(`Error processing video ${video.id}:`, error)
        results.errors++
        results.items.push({
          videoId: video.id,
          title: video.title,
          status: 'error',
          error: error.message,
        })
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('Curation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to curate videos' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/curate
 * Get curation queue
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    const [items, total] = await Promise.all([
      prisma.curationQueue.findMany({
        where,
        orderBy: [{ aiScore: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.curationQueue.count({ where }),
    ])

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error: any) {
    console.error('Error fetching curation queue:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}

// Helper functions
function extractVideoIdFromUrl(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  throw new Error('Invalid YouTube video URL')
}

/**
 * Import video to main database
 */
async function importVideoToDatabase(video: any, evaluation: any, userEmail: string) {
  try {
    // First, ensure the channel exists in our database
    let channel = await prisma.channel.findFirst({
      where: {
        OR: [
          { handle: video.channelName.toLowerCase().replace(/\s+/g, '') },
          { name: video.channelName }
        ]
      }
    })

    // If channel doesn't exist, create it
    if (!channel) {
      // Find or create a user for this channel
      let channelUser = await prisma.user.findUnique({
        where: { email: `${video.channelId}@youtube.import` }
      })

      if (!channelUser) {
        channelUser = await prisma.user.create({
          data: {
            email: `${video.channelId}@youtube.import`,
            username: video.channelName.toLowerCase().replace(/\s+/g, ''),
            displayName: video.channelName,
            password: null, // External channel, no password
          }
        })
      }

      // Create channel
      channel = await prisma.channel.create({
        data: {
          userId: channelUser.id,
          handle: video.channelName.toLowerCase().replace(/\s+/g, ''),
          name: video.channelName,
          description: `Imported from YouTube`,
          avatar: video.thumbnail,
          isVerified: true, // Mark imported channels as verified
        }
      })
    }

    // Check if video already exists
    const existingVideo = await prisma.video.findFirst({
      where: {
        title: video.title,
        channelId: channel.id,
      }
    })

    if (existingVideo) {
      console.log(`Video already exists: ${video.title}`)
      return existingVideo
    }

    // Map AI category to VideoCategory enum
    const categoryMap: any = {
      mind: 'EDUCATION',
      body: 'FITNESS',
      skills: 'EDUCATION',
      wealth: 'EDUCATION',
      spirit: 'EDUCATION',
    }
    const category = categoryMap[evaluation.category] || 'EDUCATION'

    // Create video
    const newVideo = await prisma.video.create({
      data: {
        channelId: channel.id,
        title: video.title,
        description: video.description || '',
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnail,
        duration: video.duration,
        category,
        visibility: 'PUBLIC',
        publishedAt: video.publishedAt,
        isShort: video.duration < 60,
      }
    })

    // Add tags
    if (evaluation.tags && evaluation.tags.length > 0) {
      await Promise.all(
        evaluation.tags.map((tag: string) =>
          prisma.videoTag.create({
            data: {
              videoId: newVideo.id,
              tag: tag.toLowerCase(),
            }
          }).catch(() => { }) // Ignore duplicate tag errors
        )
      )
    }

    // Update channel video count
    await prisma.channel.update({
      where: { id: channel.id },
      data: { videoCount: { increment: 1 } }
    })

    // Update curation queue status to IMPORTED
    await prisma.curationQueue.updateMany({
      where: { youtubeVideoId: video.id },
      data: { status: 'IMPORTED' }
    })

    console.log(`✅ Imported video: ${video.title}`)
    return newVideo

  } catch (error) {
    console.error(`Error importing video ${video.title}:`, error)
    throw error
  }
}

function extractChannelIdFromUrl(url: string): string {
  const patterns = [
    /youtube\.com\/channel\/([^\/\s?]+)/,
    /youtube\.com\/@([^\/\s?]+)/,
    /youtube\.com\/c\/([^\/\s?]+)/,
    /youtube\.com\/user\/([^\/\s?]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  throw new Error('Invalid YouTube channel URL. Supported: youtube.com/@handle, youtube.com/channel/ID')
}
