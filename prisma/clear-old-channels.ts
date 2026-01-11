import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearOldChannels() {
  try {
    console.log('Checking for old channels with incompatible format...')
    
    // Find channels that don't have YouTube channel ID format (UC...)
    const oldChannels = await prisma.channel.findMany({
      where: {
        NOT: {
          handle: {
            startsWith: 'UC'
          }
        }
      },
      select: {
        id: true,
        name: true,
        handle: true,
        _count: {
          select: { videos: true }
        }
      }
    })

    console.log(`\nFound ${oldChannels.length} old channels with incompatible format:`)
    oldChannels.forEach(c => {
      console.log(`  - ${c.name} (handle: ${c.handle}, videos: ${c._count.videos})`)
    })

    if (oldChannels.length === 0) {
      console.log('\n✅ All channels are in the correct format!')
      return
    }

    console.log('\n⚠️  These channels need to be re-imported with the new format.')
    console.log('Options:')
    console.log('  1. Delete them now and re-import')
    console.log('  2. Keep them (but AI curation won\'t work for them)')
    console.log('\nTo delete, uncomment the delete code below and run again.')

    // Uncomment these lines to actually delete:
    /*
    const result = await prisma.channel.deleteMany({
      where: {
        NOT: {
          handle: {
            startsWith: 'UC'
          }
        }
      }
    })
    console.log(`\n✅ Deleted ${result.count} old channels`)
    console.log('Now re-import them from the admin panel!')
    */

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearOldChannels()
