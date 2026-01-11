import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get channel handle from command line argument
  const channelHandle = process.argv[2]
  
  if (!channelHandle) {
    console.error('❌ Please provide a channel handle')
    console.log('Usage: npx tsx prisma/delete-channel-videos.ts @channelhandle')
    console.log('Example: npx tsx prisma/delete-channel-videos.ts @mkbhd')
    process.exit(1)
  }
  
  // Remove @ if present
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle.slice(1) : channelHandle
  
  console.log(`🔍 Looking for channel: @${cleanHandle}`)
  
  // Find the channel
  const channel = await prisma.channel.findUnique({
    where: { handle: cleanHandle },
    include: {
      videos: {
        select: {
          id: true,
          title: true,
          duration: true,
        }
      }
    }
  })
  
  if (!channel) {
    console.error(`❌ Channel @${cleanHandle} not found`)
    process.exit(1)
  }
  
  console.log(`\n📺 Channel: ${channel.name} (@${channel.handle})`)
  console.log(`📊 Found ${channel.videos.length} videos to delete`)
  
  if (channel.videos.length === 0) {
    console.log('✅ No videos to delete!')
    return
  }
  
  // Display videos
  console.log('\n📹 Videos to be deleted:')
  channel.videos.forEach((video, index) => {
    const minutes = Math.floor(video.duration / 60)
    const seconds = video.duration % 60
    console.log(
      `${index + 1}. "${video.title}" (${minutes}:${seconds.toString().padStart(2, '0')})`
    )
  })
  
  console.log('\n🗑️  Deleting videos...')
  
  // Delete all videos from this channel
  const deleteResult = await prisma.$transaction(async (tx) => {
    // Delete all videos
    const result = await tx.video.deleteMany({
      where: { channelId: channel.id }
    })
    
    // Update channel video count to 0
    await tx.channel.update({
      where: { id: channel.id },
      data: { 
        videoCount: 0,
        totalViews: 0
      }
    })
    
    return result
  })
  
  console.log(`   ✓ Deleted ${deleteResult.count} videos`)
  console.log(`   ✓ Updated channel stats`)
  console.log('\n✅ Successfully deleted all videos from this channel!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
