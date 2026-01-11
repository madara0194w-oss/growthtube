import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { aiJobManager } from '@/lib/ai-job-manager'
import { evaluateVideo, shouldAutoApprove } from '@/lib/ai-curator'
import { getChannelVideos, getChannelIdFromHandle } from '@/lib/youtube'

/**
 * POST /api/admin/ai-curation
 * Start automated AI curation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if job is already running
    if (aiJobManager.isRunning()) {
      return NextResponse.json({ error: 'AI curation job is already running' }, { status: 400 })
    }

    // Start the job in background
    const jobId = `ai-curation-${Date.now()}`
    
    // Don't await - let it run in background
    startAICuration(jobId).catch(error => {
      console.error('AI Curation error:', error)
      aiJobManager.updateProgress({ 
        status: 'error',
        currentAction: `Error: ${error.message}`
      })
    })

    return NextResponse.json({ 
      success: true, 
      jobId,
      message: 'AI curation started' 
    })

  } catch (error: any) {
    console.error('Error starting AI curation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/admin/ai-curation
 * Get current job status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const status = aiJobManager.getStatus()
    
    return NextResponse.json({ status })

  } catch (error: any) {
    console.error('Error getting job status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/ai-curation
 * Stop the running job
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    aiJobManager.requestStop()
    
    return NextResponse.json({ 
      success: true,
      message: 'Stop requested' 
    })

  } catch (error: any) {
    console.error('Error stopping job:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Discover channels from YouTube by searching for keywords
 * Optimized for minimal API usage
 */
async function discoverChannelsFromYouTube(): Promise<string[]> {
  // Reduced keywords to save API credits
  const keywords = [
    'self improvement', 'productivity', 'psychology',
    'personal development', 'business education',
  ]
  
  const MAX_CHANNELS = 10 // Only discover 10 channels per run (saves API credits)
  
  const discoveredChannelIds = new Set<string>()
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
  
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured')
  }
  
  console.log('[DISCOVERY] Searching YouTube for educational channels...')
  
  // Search for each keyword
  for (const keyword of keywords) {
    try {
      aiJobManager.setAction(`🔍 Discovering channels for: "${keyword}"`)
      console.log(`[DISCOVERY] Searching for: ${keyword}`)
      
      // Only search for 2 channels per keyword (saves 60% API credits)
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(keyword)}&maxResults=2&order=relevance&key=${YOUTUBE_API_KEY}`
      
      console.log('[DISCOVERY] Making request to YouTube API...')
      const response = await fetch(searchUrl)
      const data = await response.json()
      
      aiJobManager.incrementYouTubeRequests()
      
      if (data.error) {
        console.error('[DISCOVERY] YouTube API error:', data.error)
        aiJobManager.addError(`YouTube API error for "${keyword}": ${data.error.message}`)
        
        // If quota exceeded, stop
        if (data.error.code === 403 || data.error.message?.includes('quota')) {
          aiJobManager.addError('YouTube API quota exceeded!')
          break
        }
        continue
      }
      
      if (!data.items || data.items.length === 0) {
        console.log(`[DISCOVERY] No channels found for: ${keyword}`)
        continue
      }
      
      console.log(`[DISCOVERY] Found ${data.items.length} channels for: ${keyword}`)
      
      if (data.items) {
        for (const item of data.items) {
          const channelId = item.snippet?.channelId || item.id?.channelId
          if (channelId) {
            discoveredChannelIds.add(channelId)
            console.log(`[DISCOVERY] Added channel: ${channelId}`)
          }
        }
      }
      
      console.log(`[DISCOVERY] Total unique channels so far: ${discoveredChannelIds.size}`)
      
      // Stop if we have enough channels
      if (discoveredChannelIds.size >= MAX_CHANNELS) {
        console.log(`[DISCOVERY] Reached target of ${MAX_CHANNELS} channels, stopping discovery`)
        break
      }
      
      // Check API limits
      const limitCheck = aiJobManager.checkApiLimits()
      if (limitCheck.limitReached) {
        console.log('[DISCOVERY] API limit reached during discovery')
        aiJobManager.addError(limitCheck.reason || 'API limit reached')
        break
      }
      
      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 300))
      
    } catch (error: any) {
      console.error(`[DISCOVERY] Error searching for "${keyword}":`, error)
      aiJobManager.addError(`Search error for "${keyword}": ${error.message}`)
    }
  }
  
  const channelIds = Array.from(discoveredChannelIds)
  console.log(`[DISCOVERY] ✅ Discovered ${channelIds.length} unique channels`)
  
  if (channelIds.length === 0) {
    console.error('[DISCOVERY] ❌ No channels discovered! Check:')
    console.error('  1. YOUTUBE_API_KEY is set correctly')
    console.error('  2. YouTube API quota is not exceeded')
    console.error('  3. YouTube Data API v3 is enabled in Google Console')
  }
  
  return channelIds
}

/**
 * Background job function - runs automated AI curation with auto-discovery
 */
async function startAICuration(jobId: string) {
  aiJobManager.initializeJob(jobId)
  
  try {
    aiJobManager.setAction('🔍 Discovering educational channels on YouTube...')
    
    // Discover channels from YouTube
    const channelIds = await discoverChannelsFromYouTube()
    
    if (channelIds.length === 0) {
      aiJobManager.addError('No channels discovered from YouTube. Try again later.')
      aiJobManager.completeJob('completed')
      return
    }

    aiJobManager.setAction(`✅ Discovered ${channelIds.length} channels! Starting to process...`)
    console.log('[AI-CURATION] Starting to process discovered channels...')
    
    // Small delay to ensure status is updated
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let totalVideosProcessed = 0
    let totalApproved = 0
    let totalRejected = 0

    // Process each discovered channel
    for (const channelId of channelIds) {
      // Check if stop was requested
      if (aiJobManager.shouldStopJob()) {
        aiJobManager.completeJob('stopped')
        return
      }

      // Check API limits
      const limitCheck = aiJobManager.checkApiLimits()
      if (limitCheck.limitReached) {
        aiJobManager.addError(limitCheck.reason || 'API limit reached')
        aiJobManager.completeJob('completed')
        return
      }

      try {
        // Get channel details from YouTube
        aiJobManager.setAction(`Fetching channel details: ${channelId}`)
        console.log(`[AI-CURATION] Processing channel: ${channelId}`)
        
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
        )
        const channelData = await channelResponse.json()
        aiJobManager.incrementYouTubeRequests()
        
        if (channelData.error || !channelData.items?.[0]) {
          aiJobManager.addError(`Could not fetch channel details: ${channelId}`)
          continue
        }
        
        const channelInfo = channelData.items[0]
        const channelName = channelInfo.snippet.title
        
        aiJobManager.setAction(`Processing channel: ${channelName}`)
        console.log(`[AI-CURATION] Channel name: ${channelName}`)

        // Fetch only recent videos (last 50) to save API credits
        aiJobManager.setAction(`Fetching recent videos from: ${channelName}`)
        aiJobManager.incrementYouTubeRequests(2) // getChannelVideos makes ~2 API calls
        
        const videos = await getChannelVideos(channelId, 50) // Limit to 50 recent videos per channel
        
        console.log(`[AI-CURATION] Got ${videos.length} videos from YouTube API`)
        
        if (videos.length === 0) {
          aiJobManager.addError(`No videos found for channel: ${channel.name}`)
          continue
        }

        aiJobManager.updateProgress({
          totalVideos: totalVideosProcessed + videos.length
        })
        
        // Limit videos per channel to save Groq API credits
        const MAX_VIDEOS_PER_CHANNEL = 20 // Only process 20 videos per channel
        const videosToProcess = videos.slice(0, MAX_VIDEOS_PER_CHANNEL)
        
        console.log(`[AI-CURATION] Processing ${videosToProcess.length} videos from ${channelName}`)

        // Process each video
        for (const video of videosToProcess) {
          // Check if stop was requested
          if (aiJobManager.shouldStopJob()) {
            aiJobManager.completeJob('stopped')
            return
          }

          // Check API limits before each video
          const limitCheck = aiJobManager.checkApiLimits()
          if (limitCheck.limitReached) {
            aiJobManager.addError(limitCheck.reason || 'API limit reached')
            aiJobManager.completeJob('completed')
            return
          }

          totalVideosProcessed++
          
          const duration = video.duration
          const durationMinutes = duration / 60

          // Apply filters
          // Skip videos <= 6 minutes
          if (duration <= 360) {
            totalRejected++
            aiJobManager.updateProgress({
              processedVideos: totalVideosProcessed,
              rejectedVideos: totalRejected,
              currentAction: `Rejected: ${video.title.substring(0, 50)}... (too short)`
            })
            continue
          }

          // Check language (English, Bangla, Hindi only)
          const allowedLanguages = ['en', 'bn', 'hi']
          const videoLanguage = video.snippet?.defaultLanguage || video.snippet?.defaultAudioLanguage || ''
          
          if (videoLanguage && !allowedLanguages.includes(videoLanguage)) {
            totalRejected++
            aiJobManager.updateProgress({
              processedVideos: totalVideosProcessed,
              rejectedVideos: totalRejected,
              currentAction: `Rejected: ${video.title.substring(0, 50)}... (language: ${videoLanguage})`
            })
            continue
          }

          // Check if video already exists
          const videoUrl = `https://www.youtube.com/watch?v=${video.id}`
          const existingVideo = await prisma.video.findFirst({
            where: { videoUrl }
          })

          if (existingVideo) {
            // Skip if already in database
            aiJobManager.updateProgress({
              processedVideos: totalVideosProcessed,
              currentAction: `Skipped: ${video.title.substring(0, 50)}... (already exists)`
            })
            continue
          }

          // Check Groq API limit before each evaluation
          const groqLimitCheck = aiJobManager.checkApiLimits()
          if (groqLimitCheck.limitReached) {
            aiJobManager.addError('Groq API limit reached, stopping evaluation')
            break
          }

          // Evaluate with AI
          aiJobManager.setAction(`AI evaluating: ${video.title.substring(0, 50)}...`)
          aiJobManager.incrementGroqRequests()

          try {
            const evaluation = await evaluateVideo({
              title: video.title,
              description: video.description,
              channel_name: video.channelTitle,
              duration_minutes: durationMinutes,
              tags: []
            })

            // Check if should approve
            if (shouldAutoApprove(evaluation)) {
              // Get or create channel in database
              let dbChannel = await prisma.channel.findUnique({
                where: { handle: channelId }
              })
              
              if (!dbChannel) {
                // Auto-create channel
                aiJobManager.setAction(`Creating channel in database: ${channelName}`)
                
                const username = channelName.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                const email = `${username}@youtube.growthtube.com`
                
                // Create user for channel
                let user = await prisma.user.findUnique({ where: { email } })
                
                if (!user) {
                  const existingUser = await prisma.user.findUnique({ where: { username } })
                  const finalUsername = existingUser ? `${username}_${channelId.slice(-8)}` : username
                  
                  user = await prisma.user.create({
                    data: {
                      email,
                      username: finalUsername,
                      displayName: channelName,
                      avatar: channelInfo.snippet.thumbnails.high?.url || channelInfo.snippet.thumbnails.default?.url,
                      emailVerified: new Date(),
                    }
                  })
                }
                
                // Create channel
                dbChannel = await prisma.channel.create({
                  data: {
                    handle: channelId,  // YouTube channel ID
                    name: channelName,
                    description: channelInfo.snippet.description,
                    avatar: channelInfo.snippet.thumbnails.high?.url || channelInfo.snippet.thumbnails.default?.url,
                    subscriberCount: parseInt(channelInfo.statistics?.subscriberCount || '0'),
                    userId: user.id,
                  }
                })
                
                console.log(`[AI-CURATION] Created channel: ${channelName}`)
              }
              
              // Add video to database
              await prisma.video.create({
                data: {
                  videoId: video.id,
                  videoUrl,
                  title: video.title,
                  description: video.description,
                  thumbnail: video.thumbnail,
                  duration,
                  views: video.viewCount,
                  likes: video.likeCount,
                  category: evaluation.category || 'EDUCATION',
                  visibility: 'PUBLIC',
                  publishedAt: new Date(video.publishedAt),
                  channelId: dbChannel.id
                }
              })

              totalApproved++
              aiJobManager.updateProgress({
                processedVideos: totalVideosProcessed,
                approvedVideos: totalApproved,
                currentAction: `✅ Approved: ${video.title.substring(0, 50)}... (Score: ${evaluation.score})`
              })
            } else {
              totalRejected++
              aiJobManager.updateProgress({
                processedVideos: totalVideosProcessed,
                rejectedVideos: totalRejected,
                currentAction: `❌ Rejected: ${video.title.substring(0, 50)}... (${evaluation.rejection_reason || 'Low score'})`
              })
            }

          } catch (aiError: any) {
            // AI evaluation failed
            aiJobManager.addError(`AI error on "${video.title}": ${aiError.message}`)
            totalRejected++
            aiJobManager.updateProgress({
              processedVideos: totalVideosProcessed,
              rejectedVideos: totalRejected
            })
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } catch (channelError: any) {
        console.error(`[AI-CURATION] Channel error for ${channelId}:`, channelError)
        aiJobManager.addError(`Channel error "${channelId}": ${channelError.message}`)
        continue
      }
    }

    // Job completed
    aiJobManager.completeJob('completed')

  } catch (error: any) {
    console.error('[AI-CURATION] Fatal error:', error)
    console.error('[AI-CURATION] Stack trace:', error.stack)
    aiJobManager.addError(`Fatal error: ${error.message}`)
    aiJobManager.completeJob('error')
  }
}

