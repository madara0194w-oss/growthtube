import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      maxres?: { url: string }
      high?: { url: string }
      medium?: { url: string }
      default?: { url: string }
    }
    channelId: string
    channelTitle: string
    publishedAt: string
    categoryId?: string
  }
  contentDetails?: {
    duration: string
  }
  statistics?: {
    viewCount: string
    likeCount: string
  }
}

interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    description: string
    customUrl?: string
    thumbnails: {
      high?: { url: string }
      medium?: { url: string }
      default?: { url: string }
    }
  }
  statistics?: {
    subscriberCount: string
    videoCount: string
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

function extractChannelHandle(url: string): string | null {
  // Match @handle format (e.g., youtube.com/@MrBeast)
  const handleMatch = url.match(/@([a-zA-Z0-9_.-]+)/)
  if (handleMatch) return handleMatch[1]
  
  // Match /c/CustomName format (e.g., youtube.com/c/MrBeast)
  const customMatch = url.match(/\/c\/([a-zA-Z0-9_.-]+)/)
  if (customMatch) return customMatch[1]
  
  // Match /user/Username format (e.g., youtube.com/user/MrBeast)
  const userMatch = url.match(/\/user\/([a-zA-Z0-9_.-]+)/)
  if (userMatch) return userMatch[1]
  
  return null
}

function extractChannelId(url: string): string | null {
  // Match /channel/UC... format (e.g., youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA)
  const channelMatch = url.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/)
  if (channelMatch) return channelMatch[1]
  
  return null
}

function extractVideoId(url: string): string | null {
  // Match watch?v=... or youtu.be/...
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
  if (watchMatch) return watchMatch[1]
  
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) return shortMatch[1]
  
  return null
}

async function getChannelByHandle(handle: string, apiKey: string): Promise<YouTubeChannel | null> {
  console.log('Looking up channel by handle:', handle)
  
  try {
    // Try forHandle first (works for @handles)
    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`
    )
    const data = await response.json()
    
    // Check for API errors
    if (data.error) {
      console.error('YouTube API Error (forHandle):', data.error.message)
      throw new Error(`YouTube API Error: ${data.error.message}`)
    }
    
    if (data.items?.[0]) {
      console.log('Found channel via forHandle:', data.items[0].snippet.title)
      return data.items[0]
    }
    
    // If forHandle fails, try forUsername (for legacy usernames)
    const usernameResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&forUsername=${handle}&key=${apiKey}`
    )
    const usernameData = await usernameResponse.json()
    
    // Check for API errors
    if (usernameData.error) {
      console.error('YouTube API Error (forUsername):', usernameData.error.message)
      throw new Error(`YouTube API Error: ${usernameData.error.message}`)
    }
    
    if (usernameData.items?.[0]) {
      console.log('Found channel via forUsername:', usernameData.items[0].snippet.title)
      return usernameData.items[0]
    }
    
    // If both fail, try searching for the channel
    console.log('Trying search fallback for:', handle)
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1&key=${apiKey}`
    )
    const searchData = await searchResponse.json()
    
    // Check for API errors
    if (searchData.error) {
      console.error('YouTube API Error (search):', searchData.error.message)
      throw new Error(`YouTube API Error: ${searchData.error.message}`)
    }
    
    if (searchData.items?.[0]) {
      const channelId = searchData.items[0].snippet.channelId || searchData.items[0].id?.channelId
      console.log('Found channel via search, getting details for:', channelId)
      return getChannelById(channelId, apiKey)
    }
    
    console.log('Could not find channel for handle:', handle)
    return null
  } catch (error: any) {
    console.error('Error in getChannelByHandle:', error.message)
    throw error
  }
}

async function getChannelById(channelId: string, apiKey: string): Promise<YouTubeChannel | null> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    )
    const data = await response.json()
    
    // Check for API errors
    if (data.error) {
      console.error('YouTube API Error (getChannelById):', data.error.message)
      throw new Error(`YouTube API Error: ${data.error.message}`)
    }
    
    return data.items?.[0] || null
  } catch (error: any) {
    console.error('Error in getChannelById:', error.message)
    throw error
  }
}

async function getChannelVideos(channelId: string, apiKey: string): Promise<YouTubeVideo[]> {
  try {
    console.log(`Fetching ALL videos for channel: ${channelId}`)
    
    // First get the uploads playlist
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    )
    const channelData = await channelResponse.json()
    
    // Check for API errors
    if (channelData.error) {
      console.error('YouTube API Error (getChannelVideos - uploads):', channelData.error.message)
      throw new Error(`YouTube API Error: ${channelData.error.message}`)
    }
    
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    
    if (!uploadsPlaylistId) {
      console.log('No uploads playlist found')
      return []
    }

    console.log(`Found uploads playlist: ${uploadsPlaylistId}`)

    // Fetch ALL videos using pagination
    const allVideoIds: string[] = []
    let nextPageToken: string | undefined = undefined
    let pageCount = 0

    do {
      pageCount++
      const playlistUrl = `${YOUTUBE_API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}&key=${apiKey}`
      
      console.log(`Fetching page ${pageCount}...`)
      const playlistResponse = await fetch(playlistUrl)
      const playlistData = await playlistResponse.json()
      
      // Check for API errors
      if (playlistData.error) {
        console.error('YouTube API Error (getChannelVideos - playlist):', playlistData.error.message)
        throw new Error(`YouTube API Error: ${playlistData.error.message}`)
      }
      
      const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId) || []
      allVideoIds.push(...videoIds)
      
      nextPageToken = playlistData.nextPageToken
      console.log(`Page ${pageCount}: Found ${videoIds.length} videos, Total: ${allVideoIds.length}`)
      
    } while (nextPageToken)
    
    if (allVideoIds.length === 0) {
      console.log('No videos found in playlist')
      return []
    }

    console.log(`Total videos found: ${allVideoIds.length}, fetching details...`)

    // Fetch video details in batches of 50 (YouTube API limit)
    const allVideos: YouTubeVideo[] = []
    const batchSize = 50
    
    for (let i = 0; i < allVideoIds.length; i += batchSize) {
      const batchIds = allVideoIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(allVideoIds.length / batchSize)
      
      console.log(`Fetching video details batch ${batchNumber}/${totalBatches}...`)
      
      const videosResponse = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${batchIds.join(',')}&key=${apiKey}`
      )
      const videosData = await videosResponse.json()
      
      // Check for API errors
      if (videosData.error) {
        console.error('YouTube API Error (getChannelVideos - details):', videosData.error.message)
        throw new Error(`YouTube API Error: ${videosData.error.message}`)
      }
      
      if (videosData.items) {
        allVideos.push(...videosData.items)
      }
    }
    
    console.log(`Successfully fetched ${allVideos.length} video details`)
    return allVideos
  } catch (error: any) {
    console.error('Error in getChannelVideos:', error.message)
    throw error
  }
}

async function getVideoById(videoId: string, apiKey: string): Promise<YouTubeVideo | null> {
  try {
    console.log(`Fetching video by ID: ${videoId}`)
    
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    )
    const data = await response.json()
    
    // Check for API errors
    if (data.error) {
      console.error('YouTube API Error (getVideoById):', data.error.message)
      throw new Error(`YouTube API Error: ${data.error.message}`)
    }
    
    if (!data.items?.[0]) {
      console.log(`Video not found: ${videoId}`)
      return null
    }
    
    console.log(`Found video: ${data.items[0].snippet.title}`)
    return data.items[0]
  } catch (error: any) {
    console.error('Error in getVideoById:', error.message)
    throw error
  }
}

async function importChannel(channel: YouTubeChannel, videos: YouTubeVideo[]): Promise<number> {
  // Use YouTube channel ID as handle (unique identifier)
  const handle = channel.id  // YouTube channel ID (e.g., UCX6OQ3DkcsbYNE6H8uQQuVA)
  const displayHandle = channel.snippet.customUrl?.replace('@', '') || channel.id
  let username = displayHandle.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const email = `${username}@youtube.growthtube.com`
  
  // Check if user already exists by email
  let user = await prisma.user.findUnique({
    where: { email },
    include: { channel: true } // Include channel to check if user already has one
  })
  
  // If user doesn't exist, create it with a unique username
  if (!user) {
    // Check if username is taken
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    
    // If username exists, append channel ID to make it unique
    if (existingUser) {
      username = `${username}_${channel.id.slice(-8)}`
    }
    
    user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: channel.snippet.title,
        avatar: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
        emailVerified: new Date(), // Auto-verify imported channels
      },
      include: { channel: true }
    })
  }

  // Check if channel already exists (either by handle or by userId)
  let dbChannel = await prisma.channel.findUnique({
    where: { handle }
  })

  if (dbChannel) {
    // Channel exists - just update it (keep the same userId)
    dbChannel = await prisma.channel.update({
      where: { handle },
      data: {
        name: channel.snippet.title,
        description: channel.snippet.description,
        avatar: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
      }
    })
  } else if (user.channel) {
    // User already has a channel with a different handle - update that channel's handle
    dbChannel = await prisma.channel.update({
      where: { id: user.channel.id },
      data: {
        handle,
        name: channel.snippet.title,
        description: channel.snippet.description,
        avatar: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
      }
    })
  } else {
    // Channel doesn't exist and user doesn't have a channel - create it
    dbChannel = await prisma.channel.create({
      data: {
        handle,
        name: channel.snippet.title,
        description: channel.snippet.description,
        avatar: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
        banner: null,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        userId: user.id,
      }
    })
  }

  let importedCount = 0

  // Import videos
  for (const video of videos) {
    const duration = parseDuration(video.contentDetails?.duration || 'PT0S')
    
    // Skip videos UNDER or equal to 6 minutes (360 seconds) - only keep videos over 6 minutes
    if (duration <= 360) continue
    
    // Only allow English, Bangla, and Hindi videos
    const allowedLanguages = ['en', 'bn', 'hi']
    const videoLanguage = video.snippet?.defaultLanguage || video.snippet?.defaultAudioLanguage || ''
    
    // Skip videos not in allowed languages (if language is detected)
    if (videoLanguage && !allowedLanguages.includes(videoLanguage)) {
      console.log(`Skipping video "${video.snippet.title}" - Language: ${videoLanguage}`)
      continue
    }

    const thumbnail = video.snippet.thumbnails.maxres?.url ||
                     video.snippet.thumbnails.high?.url ||
                     video.snippet.thumbnails.medium?.url ||
                     video.snippet.thumbnails.default?.url || ''

    try {
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`
      
      // Check if video already exists by URL
      const existingVideo = await prisma.video.findFirst({
        where: { videoUrl }
      })
      
      if (existingVideo) {
        await prisma.video.update({
          where: { id: existingVideo.id },
          data: {
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail,
            duration,
            views: parseInt(video.statistics?.viewCount || '0'),
            likes: parseInt(video.statistics?.likeCount || '0'),
          }
        })
      } else {
        await prisma.video.create({
          data: {
            videoUrl,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail,
            duration,
            views: parseInt(video.statistics?.viewCount || '0'),
            likes: parseInt(video.statistics?.likeCount || '0'),
            publishedAt: new Date(video.snippet.publishedAt),
            channelId: dbChannel.id,
            category: 'EDUCATION',
            visibility: 'PUBLIC',
          }
        })
      }
      importedCount++
    } catch (error) {
      console.error(`Failed to import video ${video.id}:`, error)
    }
  }

  return importedCount
}

export async function POST(request: NextRequest) {
  try {
    // Check for custom admin token from admin panel
    const adminToken = request.headers.get('x-admin-token')
    let isAdminAuthorized = false
    let adminEmail = 'admin@growthtube.com'
    
    if (adminToken) {
      // Verify custom admin token
      try {
        const decoded = JSON.parse(Buffer.from(adminToken, 'base64').toString())
        if (decoded.expiry && decoded.expiry > Date.now()) {
          isAdminAuthorized = true
          adminEmail = 'admin-panel@growthtube.com'
        }
      } catch (error) {
        console.error('Invalid admin token:', error)
      }
    }
    
    // If no admin token, check for NextAuth session
    if (!isAdminAuthorized) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized - Please sign in or use admin panel' },
          { status: 401 }
        )
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
      })

      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, message: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }
      
      adminEmail = user.email
    }

    const { url, apiKey } = await request.json()

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'YouTube API key is required' },
        { status: 400 }
      )
    }

    console.log('=== Import Request ===')
    console.log('Admin:', adminEmail)
    console.log('URL:', url)
    console.log('API Key length:', apiKey.length)
    console.log('API Key starts with:', apiKey.substring(0, 10))

    // Check if it's a video URL
    const videoId = extractVideoId(url)
    if (videoId) {
      const video = await getVideoById(videoId, apiKey)
      if (!video) {
        return NextResponse.json(
          { success: false, message: 'Video not found' },
          { status: 404 }
        )
      }

      // Get channel info
      const channel = await getChannelById(video.snippet.channelId, apiKey)
      if (!channel) {
        return NextResponse.json(
          { success: false, message: 'Channel not found' },
          { status: 404 }
        )
      }

      const importedCount = await importChannel(channel, [video])
      
      return NextResponse.json({
        success: true,
        message: `Successfully imported video: ${video.snippet.title}`,
        videosImported: importedCount,
        channelName: channel.snippet.title
      })
    }

    // Check if it's a channel URL
    let channel: YouTubeChannel | null = null
    
    const handle = extractChannelHandle(url)
    if (handle) {
      channel = await getChannelByHandle(handle, apiKey)
    }
    
    if (!channel) {
      const channelId = extractChannelId(url)
      if (channelId) {
        channel = await getChannelById(channelId, apiKey)
      }
    }

    if (!channel) {
      return NextResponse.json(
        { success: false, message: 'Could not find channel. Please check the URL.' },
        { status: 404 }
      )
    }

    // Get channel videos (fetch ALL videos)
    const videos = await getChannelVideos(channel.id, apiKey)
    
    if (videos.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No videos found on this channel' },
        { status: 404 }
      )
    }

    const importedCount = await importChannel(channel, videos)

    return NextResponse.json({
      success: true,
      message: `Successfully imported from ${channel.snippet.title}`,
      videosImported: importedCount,
      channelName: channel.snippet.title
    })

  } catch (error: any) {
    console.error('Import error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error message:', error.message)
    
    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { success: false, message: 'YouTube API quota exceeded. Try again tomorrow.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { success: false, message: `Failed to import: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
