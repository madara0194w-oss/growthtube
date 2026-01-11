import { PrismaClient, VideoCategory } from '@prisma/client'

const prisma = new PrismaClient()

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBuGqtsenrHu5D5-8QyTWw5eF76wzjJzBU'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// Channels to import
const CHANNELS_TO_IMPORT = [
  { handle: 'FahimAbdullah24', category: 'EDUCATION' as VideoCategory },
  { handle: 'TEDx', category: 'EDUCATION' as VideoCategory },
  { handle: '2centspodcastofficial', category: 'EDUCATION' as VideoCategory },
  { handle: 'iamkhalidfarhan', category: 'EDUCATION' as VideoCategory },
]

// Convert ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

async function getChannelId(handle: string): Promise<string | null> {
  try {
    // Try forHandle parameter first (for @username format)
    let url = `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${handle}&key=${YOUTUBE_API_KEY}`
    let response = await fetch(url)
    let data = await response.json()
    
    if (data.items && data.items.length > 0) {
      return data.items[0].id
    }
    
    // Fallback to search
    url = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`
    response = await fetch(url)
    data = await response.json()
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId
    }
    
    return null
  } catch (error) {
    console.error(`Error getting channel ID for ${handle}:`, error)
    return null
  }
}

async function getChannelDetails(channelId: string) {
  try {
    const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) return null
    
    const channel = data.items[0]
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description || '',
      thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
    }
  } catch (error) {
    console.error('Error getting channel details:', error)
    return null
  }
}

async function getChannelVideos(channelId: string, maxResults: number = 100) {
  const videos: any[] = []
  let pageToken = ''
  
  try {
    while (videos.length < maxResults) {
      // Get video IDs from search
      const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}&key=${YOUTUBE_API_KEY}`
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (searchData.error) {
        console.error('YouTube API Error:', searchData.error.message)
        break
      }
      
      if (!searchData.items || searchData.items.length === 0) break
      
      // Get video IDs
      const videoIds = searchData.items.map((item: any) => item.id.videoId).filter(Boolean).join(',')
      
      if (!videoIds) break
      
      // Get detailed video info
      const videosUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      const videosResponse = await fetch(videosUrl)
      const videosData = await videosResponse.json()
      
      if (videosData.items) {
        for (const video of videosData.items) {
          const duration = parseDuration(video.contentDetails.duration)
          
          // Skip shorts (less than 60 seconds)
          if (duration < 60) {
            console.log(`  ⏭️ Skipping short: ${video.snippet.title}`)
            continue
          }
          
          videos.push({
            youtubeId: video.id,
            title: video.snippet.title,
            description: video.snippet.description || '',
            thumbnail: video.snippet.thumbnails.maxres?.url || 
                       video.snippet.thumbnails.high?.url || 
                       video.snippet.thumbnails.medium?.url ||
                       `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
            channelId: video.snippet.channelId,
            channelTitle: video.snippet.channelTitle,
            publishedAt: new Date(video.snippet.publishedAt),
            duration,
            viewCount: parseInt(video.statistics.viewCount) || 0,
            likeCount: parseInt(video.statistics.likeCount) || 0,
          })
        }
      }
      
      pageToken = searchData.nextPageToken
      if (!pageToken) break
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  } catch (error) {
    console.error('Error getting videos:', error)
  }
  
  return videos.slice(0, maxResults)
}

async function main() {
  console.log('🎬 Starting YouTube video import...\n')
  
  // Create separate users for each YouTube channel
  async function getOrCreateUserForChannel(handle: string, channelTitle: string) {
    const email = `${handle.toLowerCase()}@youtube.growthtube.com`
    let user = await prisma.user.findFirst({
      where: { email }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: handle.toLowerCase(),
          displayName: channelTitle,
          isVerified: true,
        }
      })
    }
    return user
  }
  
  let totalImported = 0
  
  for (const channelConfig of CHANNELS_TO_IMPORT) {
    console.log(`\n📺 Processing channel: @${channelConfig.handle}`)
    
    // Get channel ID
    const youtubeChannelId = await getChannelId(channelConfig.handle)
    if (!youtubeChannelId) {
      console.log(`  ❌ Could not find channel ID for @${channelConfig.handle}`)
      continue
    }
    console.log(`  ✅ Found channel ID: ${youtubeChannelId}`)
    
    // Get channel details
    const channelDetails = await getChannelDetails(youtubeChannelId)
    if (!channelDetails) {
      console.log(`  ❌ Could not get channel details`)
      continue
    }
    console.log(`  📊 Channel: ${channelDetails.title} (${channelDetails.subscriberCount.toLocaleString()} subscribers)`)
    
    // Create or update channel in our database
    let dbChannel = await prisma.channel.findFirst({
      where: { handle: channelConfig.handle.toLowerCase() }
    })
    
    if (!dbChannel) {
      // Create a user for this YouTube channel
      const channelUser = await getOrCreateUserForChannel(channelConfig.handle, channelDetails.title)
      
      dbChannel = await prisma.channel.create({
        data: {
          userId: channelUser.id,
          handle: channelConfig.handle.toLowerCase(),
          name: channelDetails.title,
          description: channelDetails.description.slice(0, 1000),
          avatar: channelDetails.thumbnail,
          subscriberCount: channelDetails.subscriberCount,
          isVerified: true,
        }
      })
      console.log(`  ✅ Created channel in database`)
    } else {
      await prisma.channel.update({
        where: { id: dbChannel.id },
        data: {
          name: channelDetails.title,
          description: channelDetails.description.slice(0, 1000),
          avatar: channelDetails.thumbnail,
          subscriberCount: channelDetails.subscriberCount,
        }
      })
      console.log(`  ✅ Updated channel in database`)
    }
    
    // Get videos from YouTube
    console.log(`  📥 Fetching videos...`)
    const videos = await getChannelVideos(youtubeChannelId, 100)
    console.log(`  📊 Found ${videos.length} videos (excluding shorts)`)
    
    // Import videos
    let imported = 0
    for (const video of videos) {
      // Check if video already exists
      const existingVideo = await prisma.video.findFirst({
        where: { videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}` }
      })
      
      if (existingVideo) {
        continue // Skip existing videos
      }
      
      await prisma.video.create({
        data: {
          channelId: dbChannel.id,
          title: video.title,
          description: video.description.slice(0, 5000),
          videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
          thumbnail: video.thumbnail,
          duration: video.duration,
          views: BigInt(video.viewCount),
          likes: video.likeCount,
          category: channelConfig.category,
          visibility: 'PUBLIC',
          publishedAt: video.publishedAt,
        }
      })
      imported++
    }
    
    // Update channel video count
    const videoCount = await prisma.video.count({
      where: { channelId: dbChannel.id }
    })
    await prisma.channel.update({
      where: { id: dbChannel.id },
      data: { videoCount }
    })
    
    console.log(`  ✅ Imported ${imported} new videos`)
    totalImported += imported
  }
  
  console.log(`\n🎉 Import complete! Total videos imported: ${totalImported}`)
}

main()
  .catch((e) => {
    console.error('❌ Import error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
