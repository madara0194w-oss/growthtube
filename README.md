# GrowthTube - Video Streaming Platform

A production-ready YouTube-like video streaming platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Features (MVP)
- ✅ **Home Feed** - Responsive video grid with category filtering
- ✅ **Video Player** - Full-featured player with keyboard shortcuts, PiP, theater mode
- ✅ **Search** - Advanced search with filters (duration, date, sort)
- ✅ **Channel Pages** - Complete channel view with tabs (videos, about, etc.)
- ✅ **User Authentication** - Login/Register modals with form validation
- ✅ **Dark/Light Theme** - System-aware theme with manual toggle
- ✅ **Responsive Design** - Mobile-first, works on all screen sizes
- ✅ **Shorts** - Vertical video feed (TikTok-style)

### Additional Features
- ✅ Watch History
- ✅ Subscriptions
- ✅ Trending Page
- ✅ Like/Dislike videos
- ✅ Save to Watch Later
- ✅ Comments Section
- ✅ Share functionality
- ✅ Toast notifications

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (with persist middleware)
- **Icons**: Lucide React
- **Utilities**: clsx, date-fns

## 📁 Project Structure

```
vidtube/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── watch/             # Video watch page
│   │   ├── results/           # Search results page
│   │   ├── shorts/            # Shorts page
│   │   ├── [handle]/          # Channel page (dynamic)
│   │   └── feed/              # Feed pages
│   │       ├── trending/
│   │       ├── subscriptions/
│   │       └── history/
│   ├── components/
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Avatar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── IconButton.tsx
│   │   ├── video/             # Video-related components
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoGrid.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoActions.tsx
│   │   │   ├── CategoryChips.tsx
│   │   │   └── CommentSection.tsx
│   │   ├── auth/              # Authentication components
│   │   │   └── AuthModals.tsx
│   │   └── providers/         # Context providers
│   │       └── ThemeProvider.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── useApi.ts
│   ├── lib/                   # Utilities and helpers
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── api.ts
│   │   └── mock-data.ts
│   ├── store/                 # Zustand store
│   │   └── useStore.ts
│   └── types/                 # TypeScript types
│       └── index.ts
├── public/                    # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Neon PostgreSQL database (or any PostgreSQL)

### Installation

1. Navigate to the project directory:
```bash
cd vidtube
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your Neon database credentials:
```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

5. Generate Prisma client and push schema to database:
```bash
npm run db:generate
npm run db:push
```

6. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Commands

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database with sample data
```

### Build for Production

```bash
npm run build
npm start
```

## ⌨️ Keyboard Shortcuts (Video Player)

| Key | Action |
|-----|--------|
| `Space` / `K` | Play/Pause |
| `M` | Mute/Unmute |
| `F` | Toggle Fullscreen |
| `T` | Toggle Theater Mode |
| `I` | Toggle Mini Player |
| `←` / `J` | Seek backward 10s |
| `→` / `L` | Seek forward 10s |
| `↑` | Volume up |
| `↓` | Volume down |
| `>` | Increase playback speed |
| `<` | Decrease playback speed |

## 🎨 Theming

The app supports both dark and light themes:
- **Dark Theme** (default): YouTube-inspired dark colors
- **Light Theme**: Clean, light design
- **System**: Follows OS preference

Theme can be toggled from the header menu.

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Video Storage (configure later)
VIDEO_STORAGE_URL=""
VIDEO_STORAGE_API_KEY=""
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Videos
- `GET /api/videos` - List videos (with pagination & filters)
- `POST /api/videos` - Create video (authenticated)
- `GET /api/videos/[videoId]` - Get single video
- `PATCH /api/videos/[videoId]` - Update video
- `DELETE /api/videos/[videoId]` - Delete video
- `POST /api/videos/[videoId]/like` - Like/unlike video
- `POST /api/videos/[videoId]/dislike` - Dislike video
- `GET /api/videos/[videoId]/comments` - Get comments
- `POST /api/videos/[videoId]/comments` - Add comment
- `GET /api/videos/trending` - Get trending videos

### Channels
- `GET /api/channels/[handle]` - Get channel
- `PATCH /api/channels/[handle]` - Update channel
- `GET /api/channels/[handle]/videos` - Get channel videos
- `POST /api/channels/[handle]/subscribe` - Subscribe/unsubscribe

### User
- `GET /api/user` - Get current user
- `PATCH /api/user` - Update profile
- `GET /api/subscriptions` - Get subscriptions
- `GET /api/subscriptions/feed` - Get subscription feed
- `GET /api/history` - Get watch history
- `GET /api/watch-later` - Get watch later list
- `GET /api/notifications` - Get notifications

### Search
- `GET /api/search` - Search videos, channels, playlists

## 🚧 Future Enhancements

- [ ] Video upload functionality
- [ ] Real-time notifications (WebSocket)
- [ ] Live streaming support
- [ ] Playlists management
- [ ] Creator Studio dashboard
- [ ] Analytics dashboard
- [ ] Monetization features
- [ ] Multi-language support (i18n)
- [ ] PWA support

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
