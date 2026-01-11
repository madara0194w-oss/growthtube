'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Video, BarChart3, MessageSquare, DollarSign, Settings, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function StudioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Channel Dashboard</h1>
        <p className="text-[var(--text-secondary)]">
          Manage your channel, videos, and analytics
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Views', value: '0', icon: BarChart3 },
          { label: 'Subscribers', value: '0', icon: Video },
          { label: 'Comments', value: '0', icon: MessageSquare },
          { label: 'Videos', value: '0', icon: Video },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--bg-secondary)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Feature Coming Soon */}
      <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-12 text-center mb-8">
        <Video className="w-20 h-20 mx-auto mb-4 text-[var(--accent)]" />
        <h2 className="text-2xl font-bold mb-4">GrowthTube Studio</h2>
        <p className="text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto">
          The full creator studio experience is coming soon. You'll be able to upload videos, 
          view detailed analytics, manage comments, and customize your channel.
        </p>
        <Button leftIcon={<Upload className="w-5 h-5" />} disabled>
          Upload Video
        </Button>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            icon: Video,
            title: 'Content Management',
            description: 'Upload, edit, and organize your videos with ease',
          },
          {
            icon: BarChart3,
            title: 'Analytics',
            description: 'Track your performance with detailed insights',
          },
          {
            icon: MessageSquare,
            title: 'Comments',
            description: 'Engage with your audience and moderate discussions',
          },
          {
            icon: DollarSign,
            title: 'Monetization',
            description: 'Earn revenue from your content (coming soon)',
          },
          {
            icon: Settings,
            title: 'Channel Settings',
            description: 'Customize your channel appearance and settings',
          },
          {
            icon: BarChart3,
            title: 'Growth Tools',
            description: 'Optimize your content for maximum reach',
          },
        ].map((feature) => (
          <div key={feature.title} className="bg-[var(--bg-secondary)] rounded-xl p-6">
            <feature.icon className="w-8 h-8 mb-3 text-[var(--accent)]" />
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
