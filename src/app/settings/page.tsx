'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Bell, Lock, Eye, Globe, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')

  // Notification settings
  const [notifications, setNotifications] = useState({
    newSubscriber: true,
    newComment: true,
    newLike: false,
    emailDigest: true,
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showSubscriptions: true,
    showLikedVideos: false,
    showWatchHistory: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.displayName || '')
      setUsername(session.user.username || '')
      setEmail(session.user.email || '')
      setBio(session.user.bio || '')
    }
  }, [session])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username,
          bio,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading') {
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('success') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {message}
        </div>
      )}

      {/* Profile Settings */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Profile</h2>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <Avatar
            src={session.user.avatar}
            alt={session.user.displayName || ''}
            size="lg"
          />
          <div>
            <Button variant="secondary" size="sm">Change avatar</Button>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              disabled
            />
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Username cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              value={email}
              disabled
              placeholder="your@email.com"
            />
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell viewers about your channel"
              className="input-field w-full min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {bio.length}/500 characters
            </p>
          </div>

          <Button onClick={handleSaveProfile} loading={isSaving}>
            Save Changes
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Eye className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Appearance</h2>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Theme</label>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as any)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  theme === option.value
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { key: 'newSubscriber', label: 'New subscribers', description: 'Get notified when someone subscribes to your channel' },
            { key: 'newComment', label: 'New comments', description: 'Get notified when someone comments on your video' },
            { key: 'newLike', label: 'New likes', description: 'Get notified when someone likes your video' },
            { key: 'emailDigest', label: 'Email digest', description: 'Receive weekly email summary of your activity' },
          ].map((item) => (
            <div key={item.key} className="flex items-start justify-between">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Privacy</h2>
        </div>

        <div className="space-y-4">
          {[
            { key: 'showSubscriptions', label: 'Show my subscriptions', description: 'Let others see channels you subscribe to' },
            { key: 'showLikedVideos', label: 'Show liked videos', description: 'Let others see videos you liked' },
            { key: 'showWatchHistory', label: 'Show watch history', description: 'Let others see your watch history' },
          ].map((item) => (
            <div key={item.key} className="flex items-start justify-between">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
              </div>
              <button
                onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  privacy[item.key as keyof typeof privacy] ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    privacy[item.key as keyof typeof privacy] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-1">Delete Account</p>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="danger" size="sm">Delete Account</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
