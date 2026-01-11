# 🔐 Environment Variables Reference

Complete list of environment variables for GrowTube deployment.

---

## ✅ Required Variables

These are **mandatory** for the app to work:

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` | [Neon Console](https://neon.tech) |
| `DIRECT_URL` | Direct PostgreSQL connection | Same as `DATABASE_URL` | [Neon Console](https://neon.tech) |
| `NEXTAUTH_URL` | Your app's public URL | `https://growtube.vercel.app` | Your Vercel deployment URL |
| `NEXTAUTH_SECRET` | Secret for JWT signing | `your-32-char-random-string` | Generate: `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | Admin panel password | `YourSecurePassword123!` | Choose a strong password |

---

## 📧 Email Variables (Recommended)

For user email verification and notifications:

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `RESEND_API_KEY` | Resend API key for emails | `re_123456789abcdef` | [Resend Dashboard](https://resend.com/api-keys) |
| `EMAIL_FROM` | Sender email address | `noreply@yourdomain.com` | Your verified domain in Resend |

**Without these:** Users can still register but won't receive verification emails.

---

## 🎥 YouTube API (Recommended)

For importing videos from YouTube:

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | `AIzaSyAbc123...` | [Google Cloud Console](https://console.cloud.google.com) |

**Setup YouTube API:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the key

**Without this:** You can't import videos from YouTube URLs in admin panel.

---

## 🤖 Groq AI (Optional)

For AI-powered video curation:

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `GROQ_API_KEY` | Groq AI API key | `gsk_abc123...` | [Groq Console](https://console.groq.com) |

**Setup Groq:**
1. Sign up at [Groq](https://console.groq.com)
2. Navigate to API Keys
3. Create new API key
4. Copy the key

**Free Tier:** 14,400 requests per day (enough for analyzing ~14,000 videos)

**Without this:** Manual video curation only (no AI assistance).

---

## 🔑 OAuth Providers (Optional)

Allow users to sign in with Google/GitHub:

### Google OAuth

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | [Google Cloud Console](https://console.cloud.google.com) |

**Setup Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Set authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

### GitHub OAuth

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | [GitHub Settings](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | [GitHub Settings](https://github.com/settings/developers) |

**Setup GitHub OAuth:**
1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. New OAuth App
3. Set callback URL: `https://your-domain.com/api/auth/callback/github`

**Without these:** Users can only sign up with email/password.

---

## 🎬 Video Storage (Future)

For user-uploaded videos (not implemented yet):

| Variable | Description | Example |
|----------|-------------|---------|
| `VIDEO_STORAGE_URL` | CDN/Storage URL | `https://storage.example.com` |
| `VIDEO_STORAGE_API_KEY` | Storage API key | `sk_abc123...` |

---

## 📝 Quick Setup Checklist

### Minimal Setup (Basic Functionality)
```bash
✅ DATABASE_URL          # Neon PostgreSQL
✅ DIRECT_URL            # Same as DATABASE_URL
✅ NEXTAUTH_URL          # Your Vercel URL
✅ NEXTAUTH_SECRET       # Random 32-char string
✅ ADMIN_PASSWORD        # Strong password
```

### Recommended Setup (Full Features)
```bash
✅ DATABASE_URL
✅ DIRECT_URL
✅ NEXTAUTH_URL
✅ NEXTAUTH_SECRET
✅ ADMIN_PASSWORD
✅ RESEND_API_KEY        # For emails
✅ EMAIL_FROM
✅ YOUTUBE_API_KEY       # For video imports
✅ GROQ_API_KEY          # For AI curation
```

### Complete Setup (All Features)
```bash
✅ All above +
✅ GOOGLE_CLIENT_ID      # Google sign-in
✅ GOOGLE_CLIENT_SECRET
✅ GITHUB_CLIENT_ID      # GitHub sign-in
✅ GITHUB_CLIENT_SECRET
```

---

## 🔧 How to Set in Vercel

### Via Dashboard (Recommended)

1. Open your project in Vercel
2. Go to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key:** Variable name (e.g., `DATABASE_URL`)
   - **Value:** Your actual value
   - **Environments:** Check all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** for changes to take effect

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... repeat for each variable

# Pull to local (optional)
vercel env pull .env.production
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Use strong, unique passwords
- Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- Keep `.env` in `.gitignore`
- Use different values for dev and production
- Rotate secrets regularly
- Store secrets in password manager

### ❌ DON'T:
- Commit `.env` files to Git
- Share secrets in plain text
- Use same secret across projects
- Use weak passwords
- Expose API keys in client-side code
- Log sensitive values

---

## 🧪 Testing Variables Locally

Create a `.env.local` file for local development:

```bash
# Copy example
cp .env.example .env.local

# Edit with your values
# .env.local is gitignored by default
```

Test your setup:
```bash
# Generate Prisma client
npm run db:generate

# Test database connection
npx prisma db push

# Run development server
npm run dev
```

---

## 🆘 Troubleshooting

### "Invalid environment variable"
- Check for typos in variable names
- Ensure no extra spaces around `=`
- Values with spaces need quotes: `VALUE="with space"`

### "Cannot connect to database"
- Verify `DATABASE_URL` format
- Check Neon dashboard for correct connection string
- Ensure `?sslmode=require` is at the end

### "NextAuth configuration error"
- `NEXTAUTH_URL` must match your exact domain
- Include `https://` in production
- No trailing slash

### "SMTP/Email errors"
- Verify Resend API key is valid
- Check domain is verified in Resend
- Ensure `EMAIL_FROM` uses verified domain

---

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

---

## 💡 Pro Tips

1. **Use Preview Environments:** Set different API keys for preview deployments to avoid affecting production data

2. **Secrets Rotation:** Update `NEXTAUTH_SECRET` periodically and redeploy

3. **Monitor Usage:** Check API quotas regularly:
   - YouTube API: 10,000 units/day
   - Groq: 14,400 requests/day
   - Resend: 100 emails/day (free tier)

4. **Backup Strategy:** Keep a secure backup of all environment variables in a password manager

---

Need help setting up any of these? Check the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide!
