'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Youtube, 
  Key, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Settings,
  Database,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface ImportResult {
  success: boolean
  message: string
  videosImported?: number
  channelName?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // API Key state
  const [apiKey, setApiKey] = useState('')
  const [hasApiKeySaved, setHasApiKeySaved] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // Import state
  const [importUrl, setImportUrl] = useState('')
  const [importHistory, setImportHistory] = useState<ImportResult[]>([])
  const [isImporting, setIsImporting] = useState(false)
  
  // Stats
  const [stats, setStats] = useState<{ videos: number; channels: number } | null>(null)

  useEffect(() => {
    // Check if user has valid admin token
    const token = sessionStorage.getItem('adminToken')
    if (!token) {
      router.push('/')
      return
    }

    // Verify token
    verifyToken(token)
  }, [router])

  const verifyToken = async (token: string) => {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
      if (decoded.expiry && decoded.expiry > Date.now()) {
        setIsAuthorized(true)
        loadSavedApiKey()
        loadStats()
      } else {
        sessionStorage.removeItem('adminToken')
        router.push('/')
      }
    } catch {
      sessionStorage.removeItem('adminToken')
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavedApiKey = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        // Only set the flag that we have a saved API key
        // Don't populate the input field with the masked key
        setHasApiKeySaved(data.hasApiKey || false)
        if (data.hasApiKey && data.apiKey) {
          // Show masked key in the input field
          setApiKey(data.apiKey)
        }
      }
    } catch (error) {
      console.error('Failed to load API key:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSaveApiKey = async () => {
    setApiKeyStatus('saving')
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      if (response.ok) {
        setHasApiKeySaved(true)
        setApiKeyStatus('saved')
        // Reload to show masked version
        setTimeout(() => {
          setApiKeyStatus('idle')
          loadSavedApiKey()
        }, 2000)
      } else {
        setApiKeyStatus('error')
      }
    } catch {
      setApiKeyStatus('error')
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) return
    
    setIsImporting(true)
    try {
      // Determine which API key to use
      let keyToUse = ''
      
      // If the current apiKey is not masked, use it (user just entered it)
      if (apiKey && !apiKey.includes('•')) {
        keyToUse = apiKey
      } 
      // Otherwise, fetch the real API key from settings if saved
      else if (hasApiKeySaved) {
        const adminToken = sessionStorage.getItem('adminToken')
        const settingsResponse = await fetch('/api/admin/settings?real=true', {
          headers: {
            ...(adminToken && { 'x-admin-token': adminToken })
          }
        })
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          keyToUse = settingsData.apiKey || ''
        }
      }
      
      if (!keyToUse) {
        setImportHistory(prev => [{
          success: false,
          message: 'Please enter and save your YouTube API key first.'
        }, ...prev])
        return
      }
      
      // Get admin token for authentication
      const adminToken = sessionStorage.getItem('adminToken')
      
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(adminToken && { 'x-admin-token': adminToken })
        },
        body: JSON.stringify({ url: importUrl, apiKey: keyToUse })
      })

      const data = await response.json()
      
      setImportHistory(prev => [data, ...prev])
      
      if (data.success) {
        setImportUrl('')
        loadStats() // Refresh stats
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportHistory(prev => [{
        success: false,
        message: 'Failed to import. Please try again.'
      }, ...prev])
    } finally {
      setIsImporting(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-[var(--accent)]" />
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-[var(--bg-tertiary)] hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/admin/curate"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <Database className="w-6 h-6" />
            <div>
              <div className="text-lg">🤖 AI Video Curation (Manual)</div>
              <div className="text-sm opacity-90">Import channels with AI filtering</div>
            </div>
          </Link>
          
          <Link 
            href="/admin/ai-curation"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <Database className="w-6 h-6" />
            <div>
              <div className="text-lg">🚀 Auto AI Curation</div>
              <div className="text-sm opacity-90">Automated background processing</div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Database className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Total Videos</p>
                  <p className="text-2xl font-bold">{stats.videos.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Youtube className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Total Channels</p>
                  <p className="text-2xl font-bold">{stats.channels.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* YouTube API Key Section */}
          <section className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Key className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">YouTube API Key</h2>
                <p className="text-sm text-[var(--text-secondary)]">Required for importing videos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your YouTube Data API v3 key"
                  className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>

              <button
                onClick={handleSaveApiKey}
                disabled={!apiKey || apiKeyStatus === 'saving'}
                className="w-full py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {apiKeyStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                {apiKeyStatus === 'saved' && <CheckCircle className="w-4 h-4" />}
                {apiKeyStatus === 'error' && <XCircle className="w-4 h-4" />}
                {apiKeyStatus === 'saving' ? 'Saving...' : apiKeyStatus === 'saved' ? 'Saved!' : 'Save API Key'}
              </button>

              <p className="text-xs text-[var(--text-tertiary)]">
                Get your API key from{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>
          </section>

          {/* Import Videos Section */}
          <section className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Import from YouTube</h2>
                <p className="text-sm text-[var(--text-secondary)]">Add channel or video URL</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                    <input
                      type="text"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://youtube.com/@channel or video URL"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={!importUrl.trim() || isImporting || (!hasApiKeySaved && !apiKey)}
                className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Import Videos
                  </>
                )}
              </button>

              {!hasApiKeySaved && !apiKey && (
                <p className="text-xs text-yellow-500">
                  ⚠️ Please save your YouTube API key first
                </p>
              )}

              <div className="text-xs text-[var(--text-tertiary)] space-y-1">
                <p>Supported formats:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>Channel: youtube.com/@channelname</li>
                  <li>Channel: youtube.com/channel/UC...</li>
                  <li>Video: youtube.com/watch?v=...</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Import History */}
        {importHistory.length > 0 && (
          <section className="mt-8 bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Import History</h2>
              <button
                onClick={() => setImportHistory([])}
                className="text-sm text-[var(--text-secondary)] hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="space-y-3">
              {importHistory.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={result.success ? 'text-green-500' : 'text-red-500'}>
                      {result.message}
                    </p>
                    {result.channelName && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        Channel: {result.channelName}
                      </p>
                    )}
                    {result.videosImported !== undefined && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        Videos imported: {result.videosImported}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
