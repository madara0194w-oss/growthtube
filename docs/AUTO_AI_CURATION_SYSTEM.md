# Automated AI Curation System

## Overview
Fully automated background video curation system that fetches videos from YouTube channels and uses Groq AI to filter content automatically.

## Features

✅ **Automated Processing**
- Runs in the background (no manual input needed)
- Processes ALL channels in the database
- Fetches ALL videos from each channel
- AI evaluates each video automatically

✅ **Smart Filtering**
- Only videos **OVER 6 minutes** (360 seconds)
- Only languages: **English, Bangla, Hindi**
- AI evaluation using Groq (educational content only)
- Skips duplicates (videos already in database)

✅ **API Limit Management**
- Tracks Groq API usage (14,000 requests/day limit)
- Tracks YouTube API usage (10,000 requests/day limit)
- **Auto-stops when limit reached**
- Shows real-time usage progress

✅ **Real-Time Monitoring**
- Live progress updates (polls every 2 seconds)
- Current action display
- Videos processed/approved/rejected counts
- Estimated completion time
- Error tracking

✅ **Admin Control Panel**
- Start/Stop buttons
- Can't start multiple jobs simultaneously
- View real-time progress
- See API usage with color-coded warnings
- View all errors

## How It Works

### 1. Start the Job
- Admin clicks "Start AI Curation" button
- System starts background processing
- No manual input needed after this

### 2. Automatic Processing Flow
```
For each channel in database:
  ├─ Fetch ALL videos from YouTube
  ├─ For each video:
  │  ├─ Check duration (skip if ≤ 6 minutes)
  │  ├─ Check if already exists (skip duplicates)
  │  ├─ Evaluate with Groq AI
  │  ├─ If approved: Add to database
  │  └─ If rejected: Skip and continue
  └─ Continue until done or API limit reached
```

### 3. Auto-Stop Conditions
- ✅ All channels processed
- ✅ Groq API limit reached (14,000 requests)
- ✅ YouTube API limit reached (10,000 requests)
- ✅ Admin clicks "Stop" button
- ✅ Fatal error occurs

## Access

**URL:** `/admin/ai-curation`

**Button Location:** Admin Dashboard → "🚀 Auto AI Curation"

## API Endpoints

### Start Job
```
POST /api/admin/ai-curation
Response: { success: true, jobId: "ai-curation-1234567890" }
```

### Get Status
```
GET /api/admin/ai-curation
Response: { status: JobProgress }
```

### Stop Job
```
DELETE /api/admin/ai-curation
Response: { success: true, message: "Stop requested" }
```

## Job Status Object

```typescript
{
  jobId: string
  status: 'idle' | 'running' | 'stopped' | 'error' | 'completed'
  currentAction: string
  totalVideos: number
  processedVideos: number
  approvedVideos: number
  rejectedVideos: number
  errors: string[]
  startedAt: Date
  completedAt: Date
  estimatedCompletion: Date
  apiLimits: {
    groqRequestsUsed: number
    groqRequestsLimit: 14000
    youtubeRequestsUsed: number
    youtubeRequestsLimit: 10000
  }
}
```

## Files Created

1. **`src/lib/ai-job-manager.ts`** - Job status tracking and management
2. **`src/app/api/admin/ai-curation/route.ts`** - API endpoints (POST/GET/DELETE)
3. **`src/app/admin/ai-curation/page.tsx`** - Admin UI control panel

## Configuration

### Required Environment Variables
```env
GROQ_API_KEY=your_groq_api_key
YOUTUBE_API_KEY=your_youtube_api_key
ADMIN_EMAILS=admin@example.com
```

### Filter Settings (in code)
```typescript
// Duration filter
if (duration <= 360) continue // Skip videos ≤ 6 minutes

// Language filter
const allowedLanguages = ['en', 'bn', 'hi']

// AI approval threshold
score >= 70 && confidence !== 'low'
```

## Usage Instructions

### For Admins

1. **Prepare Channels**
   - Add YouTube channels to database first (via Import page)
   - System will process all channels automatically

2. **Start Curation**
   - Go to Admin Dashboard
   - Click "🚀 Auto AI Curation"
   - Click "▶ Start AI Curation"
   - Watch progress in real-time

3. **Monitor Progress**
   - View current action
   - Track videos processed/approved/rejected
   - Monitor API usage
   - See errors if any occur

4. **Stop if Needed**
   - Click "⏹ Stop" button
   - System stops gracefully after current video

## API Limits & Reset

- **Groq API:** 14,000 requests/day (resets daily)
- **YouTube API:** 10,000 quota units/day (resets at midnight PT)

If limit reached, wait for the daily reset and restart the job.

## Benefits Over Manual Curation

| Feature | Manual | Automated |
|---------|--------|-----------|
| Processing speed | Slow (one at a time) | Fast (background) |
| Manual input | Required | None |
| Monitoring | Manual refresh | Real-time polling |
| API limit handling | Manual check | Auto-stop |
| Multi-channel | One at a time | All channels |
| Error handling | Stop on error | Continue & log |

## Example Use Case

**Scenario:** You have 10 YouTube channels in your database, each with 500 videos.

**Manual Process:**
- 10 channels × 500 videos = 5,000 videos
- Manually input each channel
- Wait for each to complete
- No visibility into progress
- Time: Hours of manual work

**Automated Process:**
- Click "Start"
- System processes all 10 channels automatically
- Real-time progress monitoring
- Auto-stops at API limits
- Time: 5-10 minutes (mostly AI processing)

## Troubleshooting

### Job Not Starting
- Check if another job is running
- Verify admin credentials
- Check browser console for errors

### Stops Immediately
- Check API keys are valid
- Verify channels exist in database
- Check error panel for details

### Low Approval Rate
- Review AI curator settings in `src/lib/ai-curator.ts`
- Check if channels match content criteria
- Review rejection reasons in errors

## Future Enhancements

Possible improvements:
- Schedule automatic runs (daily/weekly)
- Email notifications on completion
- Batch retry failed videos
- Custom filter rules per channel
- Export curation report
