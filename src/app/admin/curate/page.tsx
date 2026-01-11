'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function CuratePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'import' | 'queue'>('import')

  const handleImport = async () => {
    if (!url.trim()) return

    setLoading(true)
    setResults(null)

    try {
      const type = url.includes('watch?v=') || url.includes('youtu.be/') ? 'video' : 'channel'
      
      console.log('[FRONTEND] Sending request:', { type, url })

      const response = await fetch('/api/admin/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url }),
      })

      console.log('[FRONTEND] Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('[FRONTEND] Error response:', error)
        throw new Error(error.error || 'Failed to import')
      }

      const data = await response.json()
      console.log('[FRONTEND] Success response:', data)
      setResults(data)

      // Refresh queue
      fetchQueue()

    } catch (error: any) {
      console.error('[FRONTEND] Exception:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchQueue = async (status = 'PENDING') => {
    try {
      const response = await fetch(`/api/admin/curate?status=${status}`)
      if (response.ok) {
        const data = await response.json()
        setQueue(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      AUTO_APPROVED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      IMPORTED: 'bg-purple-100 text-purple-800',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || ''}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🤖 AI Video Curation</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium ${activeTab === 'import'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
            }`}
        >
          Import Videos
        </button>
        <button
          onClick={() => {
            setActiveTab('queue')
            fetchQueue()
          }}
          className={`px-4 py-2 font-medium ${activeTab === 'queue'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
            }`}
        >
          Review Queue
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Import from YouTube</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                YouTube URL (Video or Channel)
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://youtube.com/@channel"
                  className="flex-1"
                />
                <Button onClick={handleImport} disabled={loading || !url.trim()}>
                  {loading ? 'Processing...' : 'Import & Analyze'}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>✅ Supports:</p>
              <ul className="list-disc list-inside ml-4">
                <li>Single video: <code>youtube.com/watch?v=...</code></li>
                <li>Channel: <code>youtube.com/@channelname</code></li>
                <li>Channel: <code>youtube.com/channel/...</code></li>
              </ul>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">📊 Import Results</h3>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-white p-3 rounded">
                  <div className="text-2xl font-bold">{results.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-2xl font-bold text-green-600">{results.autoApproved}</div>
                  <div className="text-sm text-gray-600">Auto-Approved</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-600">{results.imported || 0}</div>
                  <div className="text-sm text-gray-600">✅ Imported</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{results.needsReview}</div>
                  <div className="text-sm text-gray-600">Needs Review</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-2xl font-bold text-red-600">{results.rejected}</div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.items?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.aiCategory && (
                            <span className="mr-3">📁 {item.aiCategory}</span>
                          )}
                          {item.aiScore !== undefined && (
                            <span className={`font-semibold ${getScoreColor(item.aiScore)}`}>
                              Score: {item.aiScore}/100
                            </span>
                          )}
                        </div>
                        {item.aiReason && (
                          <div className="text-xs text-gray-500 mt-1">
                            Reason: {item.aiReason}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Review Queue</h2>
            <select
              className="border rounded px-3 py-1"
              onChange={(e) => fetchQueue(e.target.value)}
              defaultValue="PENDING"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="AUTO_APPROVED">Auto-Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="space-y-3">
            {queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No videos in queue
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex gap-4">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-40 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Channel: {item.channelName}</div>
                        <div>Duration: {Math.floor(item.duration / 60)} min</div>
                        <div>
                          AI Score: <span className={`font-semibold ${getScoreColor(item.aiScore || 0)}`}>
                            {item.aiScore}/100
                          </span>
                          {item.aiCategory && ` | Category: ${item.aiCategory}`}
                        </div>
                        {item.aiReason && (
                          <div className="text-xs text-red-600">
                            Reason: {item.aiReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(item.status)}
                      {item.status === 'PENDING' && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="primary">Approve</Button>
                          <Button size="sm" variant="secondary">Reject</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
