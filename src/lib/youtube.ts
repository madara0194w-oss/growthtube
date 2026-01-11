// YouTube API Integration

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount: number
  videoCount: number
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  channelId: string
  channelTitle: string
  publishedAt: string
  duration: number // in seconds
  viewCount: number
  likeCount: number
}

// Convert ISO 8601 duration to seconds (PT1H2M3S -> 3723)
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

// Get channel ID from handle/username
export async function getChannelIdFromHandle(handle: string): Promise<string | null> {
  try {
    // Remove @ if present
    const cleanHandle = handle.replace('@', '')

    // First try to search for the channel
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${YOUTUBE_API_KEY}`
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.items && searchData.items.length > 0) {
      // Find exact match or best match
      for (const item of searchData.items) {
        const channelTitle = item.snippet.channelTitle.toLowerCase().replace(/\s/g, '')
        if (channelTitle.includes(cleanHandle.toLowerCase())) {
          return item.snippet.channelId
        }
      }
      // If no exact match, return first result
      return searchData.items[0].snippet.channelId
    }

    return null
  } catch (error) {
    console.error('Error getting channel ID:', error)
    return null
  }
}

// Get channel details
export async function getChannelDetails(channelId: string): Promise<YouTubeChannel | null> {
  try {
    const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items || data.items.length === 0) return null

    const channel = data.items[0]
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
    }
  } catch (error) {
    console.error('Error getting channel details:', error)
    return null
  }
}

// Get all videos from a channel
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    const videos: YouTubeVideo[] = []
    let pageToken = ''

    while (videos.length < maxResults) {
      // First get video IDs from search
      const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}&key=${YOUTUBE_API_KEY}`
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()

      if (!searchData.items || searchData.items.length === 0) break

      // Get video IDs
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')

      // Get detailed video info
      const videosUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      const videosResponse = await fetch(videosUrl)
      const videosData = await videosResponse.json()

      if (videosData.items) {
        for (const video of videosData.items) {
          const duration = parseDuration(video.contentDetails.duration)

          // Don't filter here - let the calling code decide what to filter
          // (AI curation needs videos > 6 minutes, import needs different filters)

          videos.push({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.maxres?.url ||
              video.snippet.thumbnails.high?.url ||
              video.snippet.thumbnails.medium?.url,
            channelId: video.snippet.channelId,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            duration,
            viewCount: parseInt(video.statistics.viewCount) || 0,
            likeCount: parseInt(video.statistics.likeCount) || 0,
          })
        }
      }

      pageToken = searchData.nextPageToken
      if (!pageToken) break
    }

    return videos.slice(0, maxResults)
  } catch (error) {
    console.error('Error getting channel videos:', error)
    return []
  }
}

// Get YouTube embed URL
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}
