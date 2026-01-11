import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check first 20 videos ordered by publishedAt
  const videos = await prisma.video.findMany({
    where: {
      visibility: 'PUBLIC',
      publishedAt: { not: null }
    },
    take: 50,
    orderBy: { publishedAt: 'desc' },
    include: {
      channel: {
        select: { name: true }
      }
    }
  })

  console.log('\n📊 First 50 videos by publishedAt (desc):')
  const channelCounts: Record<string, number> = {}
  
  for (const v of videos) {
    const chName = v.channel.name
    channelCounts[chName] = (channelCounts[chName] || 0) + 1
  }
  
  console.log('\nChannel distribution in first 50:')
  for (const [name, count] of Object.entries(channelCounts)) {
    console.log(`   ${name}: ${count}`)
  }

  // Check latest video per channel
  console.log('\n📅 Latest video per channel:')
  const channels = await prisma.channel.findMany({
    where: { videoCount: { gt: 0 } },
    include: {
      videos: {
        take: 1,
        orderBy: { publishedAt: 'desc' },
        select: { title: true, publishedAt: true }
      }
    }
  })

  for (const ch of channels) {
    if (ch.videos[0]) {
      console.log(`   ${ch.name}: ${ch.videos[0].publishedAt?.toISOString().split('T')[0]} - ${ch.videos[0].title.slice(0, 40)}...`)
    }
  }
}

main().finally(() => prisma.$disconnect())
