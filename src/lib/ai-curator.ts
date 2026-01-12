import { groq, GROQ_MODEL } from './groq'

const SYSTEM_PROMPT = `You are a content evaluator for GrowTube - a video platform.

**YOUR ROLE: APPROVE almost ALL videos. Be extremely positive and inclusive.**

────────────────────────────────────
✅ APPROVED CONTENT (Approve all of these):
- Self-improvement, personal growth, motivation
- Educational, instructional, how-to guides
- Business, entrepreneurship, finance, investing
- Psychology, mental health, wellness
- Fitness, health, nutrition, sports
- Technology, science, engineering
- Creativity, art, music, design
- Productivity, time management, organization
- Communication, leadership, public speaking
- Relationships, social skills, dating advice
- Philosophy, spirituality, meditation
- History, documentaries, biographies
- Interviews, podcasts, conversations
- Gaming, esports, game reviews
- Tech reviews, unboxing, product reviews
- Vlogs, lifestyle, personal stories
- News, current events, commentary
- Comedy with positive messages
- Entertainment with ANY value
- Travel, culture, food
- DIY, crafts, home improvement
- Career advice, job skills
- Parenting, family, relationships
- ANY educational or informative content
- Motivational speeches and talks
- Success stories and case studies

────────────────────────────────────
📊 OUTPUT FORMAT (JSON only, no extra text):
{
  "decision": "APPROVE",
  "score": 70,
  "category": "mind" | "body" | "skills" | "wealth" | "spirit",
  "confidence": "high",
  "tags": ["positive", "tags"]
}

────────────────────────────────────
🎯 SCORING GUIDE (Score HIGH - be generous):
- Give most videos: 70-85 points
- Great content: 85-95 points
- Amazing content: 95-100 points

**ALWAYS score at least 70 unless language is wrong**

────────────────────────────────────
⚠️ CRITICAL RULES:
- **ALWAYS output "decision": "APPROVE"**
- **ALWAYS score 70 or higher**
- **ALWAYS set confidence to "high"**
- Find something positive in every video
- Assign a relevant category (mind/body/skills/wealth/spirit)
- Add 3-5 positive tags
- Be optimistic and encouraging
- Output ONLY valid JSON (no markdown, no explanations)

**YOUR MANTRA: "APPROVE EVERYTHING - FIND THE VALUE"`

export interface VideoEvaluation {
  decision: 'APPROVE' | 'REJECT'
  score: number
  category: 'mind' | 'body' | 'skills' | 'wealth' | 'spirit' | null
  confidence: 'high' | 'medium' | 'low'
  rejection_reason?: string
  tags: string[]
}

export interface VideoMetadata {
  title: string
  description: string
  channel_name: string
  duration_minutes: number
  tags?: string[]
}

/**
 * Evaluate a video using Groq AI
 */
export async function evaluateVideo(video: VideoMetadata, retries = 3): Promise<VideoEvaluation> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const userPrompt = JSON.stringify({
        title: video.title,
        description: video.description,
        channel_name: video.channel_name,
        duration_minutes: video.duration_minutes,
        tags: video.tags || [],
      }, null, 2)

      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        model: GROQ_MODEL,
        temperature: 0.1, // Low temperature for consistent decisions
        max_tokens: 500,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No response from AI')
      }

      const evaluation: VideoEvaluation = JSON.parse(content)
      
      // Validate the response
      if (!evaluation.decision || !evaluation.score || !evaluation.confidence) {
        throw new Error('Invalid AI response format')
      }

      return evaluation
    } catch (error) {
      lastError = error as Error
      console.error(`Error evaluating video (attempt ${attempt + 1}/${retries}):`, error)
      
      // Exponential backoff: wait 1s, 2s, 4s between retries
      if (attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('Failed to evaluate video after retries')
}

/**
 * Batch evaluate multiple videos
 */
export async function evaluateVideos(videos: VideoMetadata[]): Promise<VideoEvaluation[]> {
  const results: VideoEvaluation[] = []
  
  // Process in batches to avoid rate limits
  const BATCH_SIZE = 10
  
  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE)
    const batchPromises = batch.map(video => evaluateVideo(video))
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Small delay between batches
    if (i + BATCH_SIZE < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

/**
 * Check if a video should be auto-approved based on AI evaluation
 */
export function shouldAutoApprove(evaluation: VideoEvaluation): boolean {
  // Auto-approve if AI decision is APPROVE and score is high
  return evaluation.decision === 'APPROVE' && evaluation.score >= 70 && evaluation.confidence === 'high'
}

/**
 * Check if a video should go to review queue
 */
export function shouldReview(evaluation: VideoEvaluation): boolean {
  // Send to review if score is medium (60-89) or confidence is not high
  return evaluation.decision === 'APPROVE' && 
         (evaluation.score >= 60 && evaluation.score < 90) ||
         evaluation.confidence !== 'high'
}

/**
 * Check if a video should be auto-rejected
 */
export function shouldAutoReject(evaluation: VideoEvaluation): boolean {
  // Auto-reject if AI explicitly rejects or score is too low
  return evaluation.decision === 'REJECT' || evaluation.score < 60
}
