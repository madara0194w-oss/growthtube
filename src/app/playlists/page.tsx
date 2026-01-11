'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, List, Lock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function PlaylistsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        // Placeholder - API endpoint doesn't exist yet
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch playlists:', error)
        setIsLoading(false)
      }
    }

    if (session) {
      fetchPlaylists()
    }
  }, [session])

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
        <Button leftIcon={<Plus className="w-5 h-5" />} disabled>
          Create Playlist
        </Button>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-xl p-12 text-center">
        <List className="w-20 h-20 mx-auto mb-4 text-[var(--text-secondary)]" />
        <h2 className="text-2xl font-semibold mb-2">No playlists yet</h2>
        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
          Playlist functionality is not yet implemented. API endpoints for creating and managing playlists need to be added.
        </p>
        <Button disabled leftIcon={<Plus className="w-5 h-5" />}>
          Create Your First Playlist
        </Button>
      </div>

      {/* Feature Preview */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
          <Globe className="w-8 h-8 mb-3 text-[var(--accent)]" />
          <h3 className="font-semibold mb-2">Public Playlists</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Create public playlists that anyone can view and share
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
          <Lock className="w-8 h-8 mb-3 text-[var(--accent)]" />
          <h3 className="font-semibold mb-2">Private Playlists</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Keep your playlists private for your eyes only
          </p>
        </div>
      </div>
    </div>
  )
}
