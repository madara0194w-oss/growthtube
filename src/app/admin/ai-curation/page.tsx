'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface JobStatus {
  jobId: string
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error' | 'completed'
  currentAction: string
  totalVideos: number
  processedVideos: number
  approvedVideos: number
  rejectedVideos: number
  errors: string[]
  startedAt: string | null
  completedAt: string | null
  estimatedCompletion: string | null
  apiLimits: {
    groqRequestsUsed: number
    groqRequestsLimit: number
    youtubeRequestsUsed: number
    youtubeRequestsLimit: number
  }
}

export default function AICurationPage() {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Poll for status continuously (every 1 second)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/admin/ai-curation')
        const data = await response.json()
        
        if (data.status) {
          setJobStatus(data.status)
        } else {
          setJobStatus(null)
        }
      } catch (err) {
        console.error('Error fetching status:', err)
      }
    }

    // Initial fetch
    fetchStatus()

    // Always poll when component is mounted
    const interval = setInterval(fetchStatus, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const startJob = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/ai-curation', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start job')
      }

      // Status will be updated via polling
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const stopJob = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/ai-curation', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop job')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isRunning = jobStatus?.status === 'running'
  const progress = jobStatus?.totalVideos 
    ? Math.round((jobStatus.processedVideos / jobStatus.totalVideos) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">AI Video Curation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically fetch and curate videos using AI. The system will process all channels in your database.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Control Panel</h2>
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  onClick={startJob}
                  disabled={loading || jobStatus?.status === 'running'}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3"
                >
                  {loading ? '⏳ Starting...' : '▶ Start AI Curation'}
                </Button>
              ) : (
                <Button
                  onClick={stopJob}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3"
                >
                  {loading ? '⏳ Stopping...' : '⏹ Stop AI Curation'}
                </Button>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
              jobStatus?.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 animate-pulse' :
              jobStatus?.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
              jobStatus?.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              jobStatus?.status === 'stopped' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {jobStatus?.status === 'running' && '🔄 '}
              {jobStatus?.status === 'completed' && '✅ '}
              {jobStatus?.status === 'error' && '❌ '}
              {jobStatus?.status === 'stopped' && '⏸️ '}
              {jobStatus?.status ? jobStatus.status.toUpperCase() : 'IDLE'}
            </span>
          </div>
        </div>

        {/* LARGE CURRENT ACTION DISPLAY */}
        {jobStatus && isRunning && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-8 mb-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🤖</div>
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-1">AI IS CURRENTLY WORKING ON:</p>
                <p className="text-2xl font-bold break-words">{jobStatus.currentAction}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Panel */}
        {jobStatus && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Progress Details</h2>

            {/* Progress Bar */}
            {jobStatus.totalVideos > 0 && (
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Processing: {jobStatus.processedVideos} / {jobStatus.totalVideos}
                  </span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {jobStatus.approvedVideos}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {jobStatus.rejectedVideos}
                </p>
              </div>
            </div>

            {/* Time Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {jobStatus.startedAt && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Started:</p>
                  <p className="font-medium">
                    {new Date(jobStatus.startedAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
              {jobStatus.estimatedCompletion && jobStatus.status === 'running' && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Est. Completion:</p>
                  <p className="font-medium">
                    {new Date(jobStatus.estimatedCompletion).toLocaleTimeString()}
                  </p>
                </div>
              )}
              {jobStatus.completedAt && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Completed:</p>
                  <p className="font-medium">
                    {new Date(jobStatus.completedAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Limits Panel */}
        {jobStatus && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">API Usage</h2>
            
            {/* Groq API */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Groq AI Requests
                </span>
                <span className="text-sm font-medium">
                  {jobStatus.apiLimits.groqRequestsUsed} / {jobStatus.apiLimits.groqRequestsLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (jobStatus.apiLimits.groqRequestsUsed / jobStatus.apiLimits.groqRequestsLimit) > 0.9
                      ? 'bg-red-600'
                      : (jobStatus.apiLimits.groqRequestsUsed / jobStatus.apiLimits.groqRequestsLimit) > 0.7
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{
                    width: `${Math.min((jobStatus.apiLimits.groqRequestsUsed / jobStatus.apiLimits.groqRequestsLimit) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* YouTube API */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  YouTube API Requests
                </span>
                <span className="text-sm font-medium">
                  {jobStatus.apiLimits.youtubeRequestsUsed} / {jobStatus.apiLimits.youtubeRequestsLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (jobStatus.apiLimits.youtubeRequestsUsed / jobStatus.apiLimits.youtubeRequestsLimit) > 0.9
                      ? 'bg-red-600'
                      : (jobStatus.apiLimits.youtubeRequestsUsed / jobStatus.apiLimits.youtubeRequestsLimit) > 0.7
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{
                    width: `${Math.min((jobStatus.apiLimits.youtubeRequestsUsed / jobStatus.apiLimits.youtubeRequestsLimit) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Errors Panel */}
        {jobStatus && jobStatus.errors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Errors ({jobStatus.errors.length})
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {jobStatus.errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm"
                >
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
