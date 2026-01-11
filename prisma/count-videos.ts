import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const videoCount = await prisma.video.count()
  const channelCount = await prisma.channel.count()
  
  console.log('\n📊 Database Stats:')
  console.log(`   Videos: ${videoCount}`)
  console.log(`   Channels: ${channelCount}`)
  
  const channels = await prisma.channel.findMany({
    select: {
      name: true,
      _count: { select: { videos: true } }
    }
  })
  
  console.log('\n📺 Videos per channel:')
  for (const ch of channels) {
    if (ch._count.videos > 0) {
      console.log(`   ${ch.name}: ${ch._count.videos} videos`)
    }
  }
}

main()
  .finally(() => prisma.$disconnect())
