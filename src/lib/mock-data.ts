import { Video, Channel, Comment, Playlist } from '@/types'

// Mock Channels
export const mockChannels: Channel[] = [
  {
    id: 'ch-1',
    name: 'TechVision',
    handle: 'techvision',
    avatar: 'https://picsum.photos/seed/ch1/100/100',
    banner: 'https://picsum.photos/seed/ch1-banner/1280/320',
    description: 'Exploring the future of technology. Daily tech news, reviews, and tutorials.',
    subscriberCount: 2450000,
    videoCount: 342,
    totalViews: 156000000,
    joinedAt: '2019-03-15T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'ch-2',
    name: 'GamersHub',
    handle: 'gamershub',
    avatar: 'https://picsum.photos/seed/ch2/100/100',
    banner: 'https://picsum.photos/seed/ch2-banner/1280/320',
    description: 'Your ultimate gaming destination. Walkthroughs, reviews, and live streams.',
    subscriberCount: 5200000,
    videoCount: 891,
    totalViews: 890000000,
    joinedAt: '2017-08-22T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'ch-3',
    name: 'Culinary Arts',
    handle: 'culinaryarts',
    avatar: 'https://picsum.photos/seed/ch3/100/100',
    banner: 'https://picsum.photos/seed/ch3-banner/1280/320',
    description: 'Master chef sharing recipes from around the world.',
    subscriberCount: 890000,
    videoCount: 156,
    totalViews: 45000000,
    joinedAt: '2020-01-10T00:00:00Z',
    isVerified: false,
  },
  {
    id: 'ch-4',
    name: 'Science Simplified',
    handle: 'sciencesimplified',
    avatar: 'https://picsum.photos/seed/ch4/100/100',
    banner: 'https://picsum.photos/seed/ch4-banner/1280/320',
    description: 'Making complex science accessible to everyone.',
    subscriberCount: 3100000,
    videoCount: 245,
    totalViews: 234000000,
    joinedAt: '2018-06-05T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'ch-5',
    name: 'Music Vibes',
    handle: 'musicvibes',
    avatar: 'https://picsum.photos/seed/ch5/100/100',
    banner: 'https://picsum.photos/seed/ch5-banner/1280/320',
    description: 'The best music compilations and live performances.',
    subscriberCount: 7800000,
    videoCount: 523,
    totalViews: 1200000000,
    joinedAt: '2016-11-30T00:00:00Z',
    isVerified: true,
  },
]

// Mock Videos
export const mockVideos: Video[] = [
  {
    id: 'v-1',
    title: 'Building a Full-Stack App in 2024 - Complete Guide',
    description: 'Learn how to build a modern full-stack application using the latest technologies.',
    thumbnail: 'https://picsum.photos/seed/v1/640/360',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: 2847,
    views: 1250000,
    likes: 45000,
    dislikes: 890,
    publishedAt: '2024-01-05T14:30:00Z',
    channel: mockChannels[0],
    category: 'technology',
    tags: ['programming', 'web development', 'tutorial'],
    visibility: 'public',
  },
  {
    id: 'v-2',
    title: 'Top 10 Games of the Year - Ultimate Ranking',
    description: 'Our definitive ranking of the best games released this year.',
    thumbnail: 'https://picsum.photos/seed/v2/640/360',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: 1523,
    views: 3400000,
    likes: 125000,
    dislikes: 4500,
    publishedAt: '2024-01-08T10:00:00Z',
    channel: mockChannels[1],
    category: 'gaming',
    tags: ['gaming', 'top 10', 'review'],
    visibility: 'public',
  },
  {
    id: 'v-3',
    title: 'Perfect Pasta Carbonara - Traditional Italian Recipe',
    description: 'Learn the authentic way to make creamy pasta carbonara.',
    thumbnail: 'https://picsum.photos/seed/v3/640/360',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: 845,
    views: 890000,
    likes: 32000,
    dislikes: 450,
    publishedAt: '2024-01-07T18:00:00Z',
    channel: mockChannels[2],
    category: 'food',
    tags: ['cooking', 'italian', 'pasta', 'recipe'],
    visibility: 'public',
  },
  {
    id: 'v-4',
    title: 'Quantum Computing Explained Simply',
    description: 'Understanding quantum computing without the complexity.',
    thumbnail: 'https://picsum.photos/seed/v4/640/360',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: 1234,
    views: 2100000,
    likes: 89000,
    dislikes: 1200,
    publishedAt: '2024-01-06T12:00:00Z',
    channel: mockChannels[3],
    category: 'science',
    tags: ['science', 'quantum', 'physics', 'education'],
    visibility: 'public',
  },
  {
    id: 'v-5',
    title: 'Chill Lofi Beats - Study & Relax Music',
    description: '3 hours of relaxing lofi hip hop beats to study/relax to.',
    thumbnail: 'https://picsum.photos/seed/v5/640/360',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    duration: 10800,
    views: 15000000,
    likes: 450000,
    dislikes: 5000,
    publishedAt: '2024-01-01T00:00:00Z',
    channel: mockChannels[4],
    category: 'music',
    tags: ['lofi', 'music', 'study', 'relax'],
    visibility: 'public',
  },
]

// Generate more mock videos
export function generateMockVideos(count: number): Video[] {
  const titles = [
    'How I Made $10K in One Month',
    'Ultimate Morning Routine for Success',
    'Reacting to Viral Videos',
    'Day in My Life as a Developer',
    '10 Tips That Changed My Life',
    'Building My Dream Setup',
    'What Nobody Tells You About...',
    'I Tried This for 30 Days',
    'The Truth About Social Media',
    'Why Everyone is Wrong About This',
  ]
  const videos: Video[] = [...mockVideos]
  
  for (let i = mockVideos.length; i < count; i++) {
    const channel = mockChannels[i % mockChannels.length]
    const daysAgo = Math.floor(Math.random() * 365)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    
    videos.push({
      id: `v-${i + 1}`,
      title: titles[i % titles.length] + ` #${i}`,
      description: 'This is a sample video description.',
      thumbnail: `https://picsum.photos/seed/v${i + 1}/640/360`,
      videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      duration: Math.floor(Math.random() * 3600) + 60,
      views: Math.floor(Math.random() * 10000000),
      likes: Math.floor(Math.random() * 100000),
      dislikes: Math.floor(Math.random() * 5000),
      publishedAt: date.toISOString(),
      channel,
      category: 'entertainment',
      tags: ['trending', 'viral'],
      visibility: 'public',
    })
  }
  
  return videos
}

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: 'c-1',
    text: 'This is exactly what I needed! Great explanation.',
    author: { id: 'u-1', name: 'John Doe', avatar: 'https://picsum.photos/seed/u1/100/100', handle: 'johndoe' },
    likes: 245,
    dislikes: 3,
    publishedAt: '2024-01-08T15:30:00Z',
    isEdited: false,
    isPinned: true,
    isHearted: true,
    replyCount: 12,
  },
  {
    id: 'c-2',
    text: 'Who else is watching this in 2024?',
    author: { id: 'u-2', name: 'Jane Smith', avatar: 'https://picsum.photos/seed/u2/100/100', handle: 'janesmith' },
    likes: 1523,
    dislikes: 45,
    publishedAt: '2024-01-07T10:00:00Z',
    isEdited: false,
    isPinned: false,
    isHearted: false,
    replyCount: 89,
  },
]

// Mock Playlists
export const mockPlaylists: Playlist[] = [
  {
    id: 'pl-1',
    title: 'Web Development Tutorials',
    description: 'Complete guide to modern web development',
    thumbnail: 'https://picsum.photos/seed/pl1/640/360',
    videoCount: 24,
    totalDuration: 28800,
    visibility: 'public',
    createdAt: '2023-06-15T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    owner: { id: mockChannels[0].id, name: mockChannels[0].name, avatar: mockChannels[0].avatar },
  },
]

export const allMockVideos = generateMockVideos(50)
