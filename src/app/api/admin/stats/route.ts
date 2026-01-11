import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [videoCount, channelCount] = await Promise.all([
      prisma.video.count(),
      prisma.channel.count()
    ])

    return NextResponse.json({
      videos: videoCount,
      channels: channelCount
    })
  } catch (error) {
    console.error('Failed to get stats:', error)
    return NextResponse.json(
      { videos: 0, channels: 0 },
      { status: 500 }
    )
  }
}
