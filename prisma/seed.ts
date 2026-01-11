import { PrismaClient, VideoCategory, VideoVisibility } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@growthtube.com' },
    update: {},
    create: {
      email: 'demo@growthtube.com',
      username: 'demouser',
      displayName: 'Demo User',
      password: hashedPassword,
      avatar: 'https://picsum.photos/seed/demo/200/200',
      isVerified: true,
    },
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Create demo channel
  const demoChannel = await prisma.channel.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      handle: 'demouser',
      name: 'Demo Channel',
      description: 'Welcome to my demo channel! Subscribe for awesome content.',
      avatar: 'https://picsum.photos/seed/demo/200/200',
      banner: 'https://picsum.photos/seed/demo-banner/1280/320',
      subscriberCount: 1250,
      isVerified: true,
    },
  })

  console.log('✅ Created demo channel:', demoChannel.handle)

  // Create additional channels
  const channels = [
    {
      email: 'tech@growthtube.com',
      username: 'techvision',
      displayName: 'TechVision',
      description: 'Exploring the future of technology',
      subscriberCount: 2450000,
    },
    {
      email: 'gaming@growthtube.com',
      username: 'gamershub',
      displayName: 'GamersHub',
      description: 'Your ultimate gaming destination',
      subscriberCount: 5200000,
    },
    {
      email: 'music@growthtube.com',
      username: 'musicvibes',
      displayName: 'Music Vibes',
      description: 'The best music compilations',
      subscriberCount: 7800000,
    },
  ]

  for (const channelData of channels) {
    const user = await prisma.user.upsert({
      where: { email: channelData.email },
      update: {},
      create: {
        email: channelData.email,
        username: channelData.username,
        displayName: channelData.displayName,
        password: hashedPassword,
        avatar: `https://picsum.photos/seed/${channelData.username}/200/200`,
        isVerified: true,
      },
    })

    await prisma.channel.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        handle: channelData.username,
        name: channelData.displayName,
        description: channelData.description,
        avatar: `https://picsum.photos/seed/${channelData.username}/200/200`,
        banner: `https://picsum.photos/seed/${channelData.username}-banner/1280/320`,
        subscriberCount: channelData.subscriberCount,
        isVerified: true,
      },
    })
  }

  console.log('✅ Created additional channels')

  // Create sample videos
  const allChannels = await prisma.channel.findMany()
  
  const videoTemplates = [
    { title: 'Getting Started with Web Development', category: 'TECHNOLOGY' as VideoCategory, duration: 1847 },
    { title: 'Top 10 Games of 2024', category: 'GAMING' as VideoCategory, duration: 1523 },
    { title: 'Relaxing Music for Study & Work', category: 'MUSIC' as VideoCategory, duration: 10800 },
    { title: 'How to Build a Startup', category: 'EDUCATION' as VideoCategory, duration: 2456 },
    { title: 'Travel Vlog: Exploring Japan', category: 'TRAVEL' as VideoCategory, duration: 1234 },
    { title: 'Cooking Italian Pasta', category: 'FOOD' as VideoCategory, duration: 845 },
    { title: 'Fitness Workout at Home', category: 'FITNESS' as VideoCategory, duration: 1800 },
    { title: 'Science Explained Simply', category: 'SCIENCE' as VideoCategory, duration: 967 },
    { title: 'Comedy Sketches Compilation', category: 'COMEDY' as VideoCategory, duration: 1456 },
    { title: 'Breaking News Analysis', category: 'NEWS' as VideoCategory, duration: 678 },
  ]

  for (let i = 0; i < 30; i++) {
    const template = videoTemplates[i % videoTemplates.length]
    const channel = allChannels[i % allChannels.length]
    const daysAgo = Math.floor(Math.random() * 90)
    const publishedAt = new Date()
    publishedAt.setDate(publishedAt.getDate() - daysAgo)

    const video = await prisma.video.create({
      data: {
        channelId: channel.id,
        title: `${template.title} #${i + 1}`,
        description: `This is a sample video description for "${template.title}". Watch to learn more about this exciting topic!`,
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        thumbnail: `https://picsum.photos/seed/video${i + 1}/640/360`,
        duration: template.duration + Math.floor(Math.random() * 300),
        views: BigInt(Math.floor(Math.random() * 5000000)),
        likes: Math.floor(Math.random() * 100000),
        dislikes: Math.floor(Math.random() * 1000),
        category: template.category,
        visibility: 'PUBLIC' as VideoVisibility,
        publishedAt,
      },
    })

    // Add tags
    const tags = ['trending', 'viral', template.category.toLowerCase()]
    for (const tag of tags) {
      await prisma.videoTag.create({
        data: {
          videoId: video.id,
          tag,
        },
      })
    }
  }

  console.log('✅ Created sample videos')

  // Update channel video counts
  for (const channel of allChannels) {
    const videoCount = await prisma.video.count({
      where: { channelId: channel.id },
    })
    await prisma.channel.update({
      where: { id: channel.id },
      data: { videoCount },
    })
  }

  console.log('✅ Updated channel video counts')
  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
