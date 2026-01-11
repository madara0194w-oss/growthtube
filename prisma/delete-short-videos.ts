import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const durationThreshold = 300 // 6 minutes in seconds
  
  console.log(`🔍 Finding videos less than ${durationThreshold / 60} minutes...`)
  
  // First, find all videos that match the criteria
  const videosToDelete = await prisma.video.findMany({
    where: {
      duration: {
        lt: durationThreshold
      }
    },
    include: {
      channel: true
    }
  })
  
  console.log(`📊 Found ${videosToDelete.length} videos to delete`)
  
  if (videosToDelete.length === 0) {
    console.log('✅ No videos to delete!')
    return
  }
  
  // Display the videos that will be deleted
  console.log('\n📹 Videos to be deleted:')
  videosToDelete.forEach((video, index) => {
    const minutes = Math.floor(video.duration / 60)
    const seconds = video.duration % 60
    console.log(
      `${index + 1}. "${video.title}" (${minutes}:${seconds.toString().padStart(2, '0')}) - Channel: ${video.channel.name}`
    )
  })
  
  console.log('\n🗑️  Deleting videos...')
  
  // Group by channel for updating counts
  const channelUpdates = new Map<string, number>()
  videosToDelete.forEach(video => {
    const currentCount = channelUpdates.get(video.channelId) || 0
    channelUpdates.set(video.channelId, currentCount + 1)
  })
  
  // Delete videos in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete all related records first (if not handled by cascade)
    const videoIds = videosToDelete.map(v => v.id)
    
    // Delete videos
    const deleteResult = await tx.video.deleteMany({
      where: {
        id: {
          in: videoIds
        }
      }
    })
    
    console.log(`   ✓ Deleted ${deleteResult.count} videos`)
    
    // Update channel video counts
    for (const [channelId, count] of Array.from(channelUpdates.entries())) {
      await tx.channel.update({
        where: { id: channelId },
        data: { 
          videoCount: { 
            decrement: count 
          }
        }
      })
    }
    
    console.log(`   ✓ Updated ${channelUpdates.size} channel(s)`)
  })
  
  console.log('\n✅ Successfully deleted all videos under 5 minutes!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
