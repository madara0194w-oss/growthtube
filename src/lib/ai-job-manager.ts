/**
 * AI Curation Job Manager
 * Manages background AI curation jobs with status tracking
 */

import { EventEmitter } from 'events'

export type JobStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error' | 'completed'

export interface JobProgress {
  jobId: string
  status: JobStatus
  currentAction: string
  totalVideos: number
  processedVideos: number
  approvedVideos: number
  rejectedVideos: number
  errors: string[]
  startedAt: Date | null
  completedAt: Date | null
  estimatedCompletion: Date | null
  apiLimits: {
    groqRequestsUsed: number
    groqRequestsLimit: number
    youtubeRequestsUsed: number
    youtubeRequestsLimit: number
  }
}

class AIJobManager extends EventEmitter {
  private currentJob: JobProgress | null = null
  private shouldStop = false

  constructor() {
    super()
    // Set max listeners to prevent memory leak warnings
    this.setMaxListeners(20)
  }

  /**
   * Get current job status
   */
  getStatus(): JobProgress | null {
    return this.currentJob
  }

  /**
   * Check if a job is running
   */
  isRunning(): boolean {
    return this.currentJob?.status === 'running'
  }

  /**
   * Initialize a new job
   */
  initializeJob(jobId: string): void {
    this.currentJob = {
      jobId,
      status: 'running',
      currentAction: 'Initializing...',
      totalVideos: 0,
      processedVideos: 0,
      approvedVideos: 0,
      rejectedVideos: 0,
      errors: [],
      startedAt: new Date(),
      completedAt: null,
      estimatedCompletion: null,
      apiLimits: {
        groqRequestsUsed: 0,
        groqRequestsLimit: 14000,
        youtubeRequestsUsed: 0,
        youtubeRequestsLimit: 10000,
      }
    }
    this.shouldStop = false
    this.emit('status-change', this.currentJob)
  }

  /**
   * Update job progress
   */
  updateProgress(updates: Partial<JobProgress>): void {
    if (!this.currentJob) return

    this.currentJob = {
      ...this.currentJob,
      ...updates,
    }

    // Calculate estimated completion
    if (this.currentJob.totalVideos > 0 && this.currentJob.processedVideos > 0) {
      const elapsedMs = new Date().getTime() - (this.currentJob.startedAt?.getTime() || 0)
      const avgTimePerVideo = elapsedMs / this.currentJob.processedVideos
      const remainingVideos = this.currentJob.totalVideos - this.currentJob.processedVideos
      const estimatedRemainingMs = avgTimePerVideo * remainingVideos
      this.currentJob.estimatedCompletion = new Date(Date.now() + estimatedRemainingMs)
    }

    this.emit('status-change', this.currentJob)
  }

  /**
   * Update current action
   */
  setAction(action: string): void {
    this.updateProgress({ currentAction: action })
  }

  /**
   * Increment API usage counters
   */
  incrementGroqRequests(count: number = 1): void {
    if (!this.currentJob) return
    this.currentJob.apiLimits.groqRequestsUsed += count
    this.emit('status-change', this.currentJob)
  }

  incrementYouTubeRequests(count: number = 1): void {
    if (!this.currentJob) return
    this.currentJob.apiLimits.youtubeRequestsUsed += count
    this.emit('status-change', this.currentJob)
  }

  /**
   * Check if API limits are reached
   */
  checkApiLimits(): { limitReached: boolean; reason?: string } {
    if (!this.currentJob) return { limitReached: false }

    const { groqRequestsUsed, groqRequestsLimit, youtubeRequestsUsed, youtubeRequestsLimit } = this.currentJob.apiLimits

    if (groqRequestsUsed >= groqRequestsLimit) {
      return { limitReached: true, reason: `Groq API limit reached (${groqRequestsUsed}/${groqRequestsLimit})` }
    }

    if (youtubeRequestsUsed >= youtubeRequestsLimit) {
      return { limitReached: true, reason: `YouTube API limit reached (${youtubeRequestsUsed}/${youtubeRequestsLimit})` }
    }

    return { limitReached: false }
  }

  /**
   * Add error to job
   */
  addError(error: string): void {
    if (!this.currentJob) return
    this.currentJob.errors.push(error)
    this.emit('status-change', this.currentJob)
  }

  /**
   * Request job to stop
   */
  requestStop(): void {
    this.shouldStop = true
    if (this.currentJob) {
      this.currentJob.status = 'stopped'
      this.currentJob.completedAt = new Date()
      this.emit('status-change', this.currentJob)
    }
  }

  /**
   * Check if stop was requested
   */
  shouldStopJob(): boolean {
    return this.shouldStop
  }

  /**
   * Complete the job
   */
  completeJob(status: JobStatus = 'completed'): void {
    if (!this.currentJob) return
    this.currentJob.status = status
    this.currentJob.completedAt = new Date()
    this.currentJob.currentAction = status === 'completed' ? 'Completed successfully' : 'Stopped'
    this.emit('status-change', this.currentJob)
  }

  /**
   * Reset job (clear current job)
   */
  reset(): void {
    this.currentJob = null
    this.shouldStop = false
    this.emit('status-change', null)
  }
}

// Singleton instance
export const aiJobManager = new AIJobManager()
