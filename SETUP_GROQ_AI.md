# Setting Up Groq AI for Video Curation

## Step 1: Get Your Groq API Key

1. Go to https://console.groq.com/
2. Sign up or login
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

## Step 2: Add to .env file

Open your `.env` file and add:
```
GROQ_API_KEY="your_groq_api_key_here"
```

## Step 3: Install Dependencies

Run this command:
```bash
npm install groq-sdk
```

## Step 4: Test Your Setup

After adding the API key and installing, I'll create a test script to verify everything works.

## Your Free Tier Limits

✅ **14,000 requests per day**
- 1 video evaluation = 1 request
- You can analyze 14,000 videos per day!
- That's 420,000 videos per month
- More than enough for GrowTube's needs

## Available Models (Free Tier)

Based on Groq's free tier, you likely have access to:
- `llama-3.3-70b-versatile` (Best for analysis)
- `llama-3.1-8b-instant` (Fastest, still good)
- `mixtral-8x7b-32768` (Good alternative)
- `gemma2-9b-it` (Another option)

We'll use `llama-3.3-70b-versatile` as it's excellent for content evaluation.

## Next Steps

Once you:
1. ✅ Add GROQ_API_KEY to .env
2. ✅ Run `npm install`

I can then:
- Test the Groq connection
- Build the AI video curator
- Create the admin interface for bulk imports
