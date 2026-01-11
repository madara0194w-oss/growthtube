import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️ Deleting all videos...')
  
  // Delete in order due to foreign key constraints
  await prisma.playlistItem.deleteMany({})
  await prisma.watchLater.deleteMany({})
  await prisma.watchHistory.deleteMany({})
  await prisma.like.deleteMany({})
  await prisma.dislike.deleteMany({})
  await prisma.comment.deleteMany({})
  await prisma.videoTag.deleteMany({})
  await prisma.video.deleteMany({})
  
  // Reset channel video counts
  await prisma.channel.updateMany({
    data: { videoCount: 0, totalViews: 0 }
  })
  
  console.log('✅ All videos deleted!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
