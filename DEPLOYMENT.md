# 🚀 GrowTube Deployment Guide

This guide will help you deploy GrowTube to production using Vercel.

## 📋 Prerequisites

- GitHub account: https://github.com/madara0194w-oss
- Vercel account (free): https://vercel.com
- Neon PostgreSQL database (already configured)
- API Keys ready (YouTube, Groq, Resend)

---

## Step 1: Push to GitHub

### Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - GrowTube ready for deployment"

# Add your GitHub remote (replace with your repo name)
git remote add origin https://github.com/madara0194w-oss/growtube.git

# Push to GitHub
git push -u origin main
```

### Create GitHub Repository

1. Go to https://github.com/madara0194w-oss
2. Click "New repository"
3. Name it: `growtube` (or your preferred name)
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"
6. Use the commands above to push your code

---

## Step 2: Deploy to Vercel

### Connect Vercel to GitHub

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `growtube` repository
5. Vercel will auto-detect Next.js settings

### Build Configuration

Vercel should auto-detect these settings:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

If not, set them manually.

---

## Step 3: Environment Variables

In Vercel dashboard, add these environment variables:

### Required Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# NextAuth Authentication
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=generate_using_command_below

# Admin Access
ADMIN_PASSWORD=your_secure_admin_password_here
```

### Optional but Recommended

```bash
# Email (Resend - for user verification)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# YouTube API (for video imports)
YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

# Groq AI (for AI curation)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Generate NextAuth Secret

On your local machine, run:
```bash
openssl rand -base64 32
```

Copy the output and use it as `NEXTAUTH_SECRET`

---

## Step 4: Database Setup

### Run Migrations

After deploying, you need to set up your production database:

```bash
# Option 1: From your local machine (recommended)
# Make sure DATABASE_URL in .env points to production
npx prisma migrate deploy

# Option 2: Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

### Seed Initial Data (Optional)

If you want to start with some sample data:

```bash
npm run db:seed
```

---

## Step 5: Deploy!

1. Click **"Deploy"** in Vercel
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://your-app-name.vercel.app`

---

## 🔧 Post-Deployment

### Update NEXTAUTH_URL

After first deployment:
1. Copy your Vercel URL (e.g., `https://growtube.vercel.app`)
2. Go to Vercel dashboard → Settings → Environment Variables
3. Update `NEXTAUTH_URL` with your actual domain
4. Redeploy (Vercel → Deployments → Click "..." → Redeploy)

### Test Your Deployment

1. Visit your app URL
2. Test user registration
3. Test login
4. Test admin panel: `/admin` (use your ADMIN_PASSWORD)
5. Try importing YouTube videos

### Set Up Custom Domain (Optional)

1. In Vercel → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Update `EMAIL_FROM` to use your domain

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push

# Vercel automatically builds and deploys! 🎉
```

### Preview Deployments

- Every PR gets a preview URL
- Test changes before merging to main
- Share preview links with your team

---

## 🐛 Troubleshooting

### Build Fails

Check Vercel build logs for errors. Common issues:

1. **Prisma errors:** Make sure `DATABASE_URL` is set
2. **TypeScript errors:** Run `npm run build` locally first
3. **Missing env vars:** Double-check all required variables

### Database Connection Issues

```bash
# Test connection locally
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Authentication Not Working

1. Verify `NEXTAUTH_URL` matches your domain exactly
2. Make sure `NEXTAUTH_SECRET` is set
3. Check browser console for errors

---

## 📊 Monitoring

### Vercel Dashboard

- Real-time function logs
- Error tracking
- Performance metrics
- Analytics (optional)

### Database Monitoring

- Use Neon dashboard to monitor queries
- Check connection pool usage
- Monitor storage size

---

## 💰 Pricing

### Free Tier Includes:

- **Vercel:** 100GB bandwidth, unlimited deployments
- **Neon:** 0.5GB storage, 3 projects
- **Groq:** 14,400 API calls/day (AI curation)

### When to Upgrade:

- **Vercel:** When you exceed 100GB bandwidth/month
- **Neon:** When you need more than 0.5GB storage
- **YouTube API:** 10,000 quota units/day (free)

---

## 🔐 Security Checklist

Before going live:

- [ ] Strong `ADMIN_PASSWORD` set
- [ ] `NEXTAUTH_SECRET` is secure and unique
- [ ] Database credentials are secure
- [ ] API keys are not exposed in code
- [ ] `.env` is in `.gitignore`
- [ ] Email verification is enabled
- [ ] Rate limiting configured (if high traffic)

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [Neon PostgreSQL Docs](https://neon.tech/docs)

---

## 🎉 You're Ready!

Your GrowTube platform should now be live and accessible to the world!

**Next Steps:**
1. Share your app URL
2. Import YouTube content via `/admin`
3. Invite users to test
4. Monitor performance and iterate

Need help? Check the logs in Vercel dashboard or refer to the troubleshooting section above.
