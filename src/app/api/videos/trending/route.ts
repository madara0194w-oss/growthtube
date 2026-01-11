import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/videos/trending - Get trending videos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get videos from the last 7 days, sorted by a trending score
    // Trending score = views + (likes * 10) - (dislikes * 5)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const where: any = {
      visibility: 'PUBLIC',
      publishedAt: {
        not: null,
        gte: sevenDaysAgo,
      },
    }

    if (category && category !== 'all') {
      where.category = category.toUpperCase()
    }

    const videos = await prisma.video.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: [
        { views: 'desc' },
        { likes: 'desc' },
        { publishedAt: 'desc' },
      ],
      include: {
        channel: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatar: true,
            isVerified: true,
          },
        },
        tags: {
          select: { tag: true },
        },
      },
    })

    const formattedVideos = videos.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      duration: video.duration,
      views: Number(video.views),
      likes: video.likes,
      dislikes: video.dislikes,
      category: video.category.toLowerCase(),
      isLive: video.isLive,
      isShort: video.isShort,
      publishedAt: video.publishedAt,
      channel: video.channel,
      tags: video.tags.map((t) => t.tag),
    }))

    return NextResponse.json({ videos: formattedVideos })
  } catch (error) {
    console.error('Error fetching trending videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending videos' },
      { status: 500 }
    )
  }
}
