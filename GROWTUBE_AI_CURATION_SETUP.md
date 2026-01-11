# 🤖 GrowTube AI Curation System - Complete Guide

## 🎉 What We Built

An **AI-powered video curation system** that automatically evaluates YouTube videos to determine if they belong on GrowTube - your dopamine-free, growth-focused platform.

### Key Features:
✅ **AI Evaluation** - Uses Groq AI (Llama 3.3 70B) to score videos 0-100
✅ **Auto-Approval** - Videos scoring ≥90 are automatically approved
✅ **Review Queue** - Videos scoring 70-89 go to manual review
✅ **Auto-Rejection** - Videos scoring <70 are automatically rejected
✅ **Batch Processing** - Import entire YouTube channels at once
✅ **Smart Filtering** - Rejects shorts, clickbait, entertainment content
✅ **Multi-Language** - Supports English, Bangla, and Hindi only

---

## 📊 How It Works

```
YouTube URL → Fetch Videos → AI Evaluation → Auto-Approve/Review/Reject
                                    ↓
                            Score 90-100: ✅ Auto-Import
                            Score 70-89:  📋 Review Queue
                            Score 0-69:   ❌ Auto-Reject
```

### AI Evaluation Criteria:

**✅ APPROVED Topics:**
- Psychology & Neuroscience
- Physical training & health (science-based)
- Learning strategies
- Skills (sales, communication, thinking)
- Money management (evidence-based)
- Philosophy (stoicism, ethics)
- Productivity, habits, self-improvement

**❌ REJECTED Content:**
- Shorts/reels (<8 minutes)
- Entertainment/drama
- Clickbait titles
- Gaming (unless educational)
- "Get rich quick" schemes
- Reaction videos
- Celebrity gossip

---

## 🚀 Setup Instructions

### Step 1: Database Migration

Your Prisma schema has been updated with the `CurationQueue` model. Run:

```bash
npx prisma migrate dev --name add-curation-queue
npx prisma generate
```

If migration fails, you can reset and re-seed:
```bash
npx prisma migrate reset
npx prisma db push
```

### Step 2: Add Your Admin Email

Open `.env` and update:
```
ADMIN_EMAILS="your-actual-email@example.com"
```

Replace with the email you use to login to GrowTube.

### Step 3: Verify Environment Variables

Make sure these are set in `.env`:
```
GROQ_API_KEY="your_groq_api_key_here"
YOUTUBE_API_KEY="your_youtube_api_key"
ADMIN_EMAILS="your@email.com"
```

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Access Admin Panel

Navigate to: **http://localhost:3000/admin/curate**

---

## 📖 How to Use

### Import Single Video

1. Go to http://localhost:3000/admin/curate
2. Paste YouTube video URL: `https://youtube.com/watch?v=VIDEO_ID`
3. Click "Import & Analyze"
4. AI will evaluate and show results instantly

### Import Entire Channel

1. Go to http://localhost:3000/admin/curate
2. Paste channel URL: `https://youtube.com/@channelname`
3. Click "Import & Analyze"
4. AI will process all videos from the channel
5. View results:
   - 🟢 **Auto-Approved**: Ready to import
   - 🟡 **Needs Review**: Check manually
   - 🔴 **Rejected**: Doesn't meet criteria

### Review Queue

1. Click "Review Queue" tab
2. Filter by status (Pending, Auto-Approved, Rejected)
3. See all videos with AI scores and reasons
4. Manually approve/reject videos that need review

---

## 📁 Files Created

### Core System:
- `src/lib/groq.ts` - Groq AI client
- `src/lib/ai-curator.ts` - AI evaluation logic
- `src/app/api/admin/curate/route.ts` - API endpoints
- `src/app/admin/curate/page.tsx` - Admin UI
- `prisma/schema.prisma` - Added CurationQueue model

### Documentation:
- `docs/AI_CURATION_SYSTEM.md` - System architecture
- `GROWTUBE_AI_CURATION_SETUP.md` - This guide

---

## 💡 Your Free Tier Limits

**Groq API (Free):**
- ✅ 14,000 requests per day
- ✅ 1 video = 1 request
- ✅ Can analyze 14,000 videos daily
- ✅ ~420,000 videos per month
- 💰 Cost: **$0.00** (free tier)

**Estimated Usage:**
- 100 videos = 100 requests (takes ~30 seconds)
- 1,000 videos = 1,000 requests (takes ~5 minutes)
- Still have 13,000 requests left for the day!

---

## 🎯 Recommended Workflow

### For Building Initial Content Library:

1. **Start with Trusted Channels** (20-30 channels)
   - Andrew Huberman (neuroscience)
   - Lex Fridman (interviews)
   - Ali Abdaal (productivity)
   - Thomas Frank (learning)
   - The Plain Bagel (finance)
   - TEDx Talks (various)

2. **Import Channel**
   ```
   https://youtube.com/@hubermanlab
   ```

3. **Review Results**
   - Auto-approved: Import immediately
   - Review queue: Check manually
   - Rejected: Ignore

4. **Repeat for Each Channel**
   - You can process multiple channels per day
   - AI learns from consistent patterns

### For Ongoing Curation:

1. **Weekly Channel Check**
   - Re-import trusted channels to get new videos
   - System skips duplicates automatically

2. **Community Suggestions**
   - Users suggest channels
   - You import and let AI filter

3. **Manual Overrides**
   - You can always approve/reject manually
   - Your decisions help refine the system

---

## 🔧 Customization

### Adjust AI Strictness

Edit `src/lib/ai-curator.ts`:

```typescript
// Current thresholds:
export function shouldAutoApprove(evaluation: VideoEvaluation): boolean {
  return evaluation.score >= 90  // Change to 85 for more lenient
}

export function shouldReview(evaluation: VideoEvaluation): boolean {
  return evaluation.score >= 70  // Change to 60 for more lenient
}
```

### Modify System Prompt

Edit the system prompt in `src/lib/ai-curator.ts` to:
- Add more allowed topics
- Add more languages
- Adjust duration requirements
- Change strictness

### Add More Categories

Edit `docs/AI_CURATION_SYSTEM.md` and update the AI prompt to include new categories beyond:
- mind, body, skills, wealth, spirit

---

## 📊 Database Schema

The `CurationQueue` table stores:
- YouTube video metadata
- AI evaluation results (score, category, confidence)
- Review status (PENDING, AUTO_APPROVED, REJECTED, IMPORTED)
- Admin review notes

```sql
-- Check queue stats
SELECT status, COUNT(*) FROM curation_queue GROUP BY status;

-- High-scoring videos
SELECT title, aiScore, aiCategory FROM curation_queue 
WHERE aiScore >= 90 ORDER BY aiScore DESC;
```

---

## 🐛 Troubleshooting

### "Operation not permitted" (Prisma)

Close your dev server and run:
```bash
npx prisma generate
npm run dev
```

### "Unauthorized" Error

Make sure:
1. You're logged in to GrowTube
2. Your email is in `ADMIN_EMAILS` in `.env`
3. Restart dev server after changing `.env`

### "Invalid YouTube URL"

Supported formats:
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/@channelname`
- `https://youtube.com/channel/CHANNEL_ID`

### AI Not Working

Check:
1. `GROQ_API_KEY` is set in `.env`
2. API key is valid (test at console.groq.com)
3. You haven't exceeded 14,000 requests today

---

## 🎓 Example AI Decisions

### ✅ APPROVED (Score: 98)
**Title**: "The Science of Sleep and Dreams - Andrew Huberman"  
**Reason**: Educational neuroscience content, professional, no clickbait  
**Category**: mind  

### ✅ APPROVED (Score: 92)
**Title**: "Understanding Compound Interest and Long-Term Investing"  
**Reason**: Evidence-based finance education, long-form  
**Category**: wealth  

### ❌ REJECTED (Score: 10)
**Title**: "I Tried MrBeast's Challenge!! YOU WON'T BELIEVE!!!"  
**Reason**: Clickbait, entertainment-focused, no educational value  

### ❌ REJECTED (Score: 0)
**Title**: "Quick Productivity Tip"  
**Duration**: 30 seconds  
**Reason**: Duration less than 8 minutes (shorts/reels not allowed)  

---

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Update your admin email in `.env`
3. ✅ Start dev server
4. ✅ Visit http://localhost:3000/admin/curate
5. ✅ Import your first channel!
6. ✅ Build your growth-focused content library

---

## 📈 Scaling Tips

**Phase 1: Manual (Now)**
- Import 20-30 trusted channels
- Review AI decisions
- Build initial 500-1000 videos

**Phase 2: Semi-Automated**
- Auto-import videos scoring ≥90
- Review 70-89 weekly
- Whitelist channels that consistently score high

**Phase 3: Fully Automated**
- Trusted channels auto-import everything
- AI handles 95% of decisions
- You only review edge cases

---

## 💬 Need Help?

If you encounter issues:
1. Check this guide first
2. Check console logs in browser (F12)
3. Check terminal logs
4. Verify all environment variables are set

---

## 🎉 Success!

You now have an AI-powered curation system that can:
- ✅ Analyze 14,000 videos per day
- ✅ Automatically approve high-quality content
- ✅ Filter out dopamine-triggering content
- ✅ Save hours of manual work
- ✅ Scale your content library rapidly

**Welcome to the future of content curation! 🚀**
