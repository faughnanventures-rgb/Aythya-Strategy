# Aythya Strategy — Strategic Life Planning Platform

A web application that brings strategic clarity to life's transitions. Built with Next.js, Claude AI, and a focus on security and scalability.

## 🎯 What This Does

Aythya Strategy guides users through an 8-phase strategic planning process:

1. **Current State Analysis** - Understand where you are before determining where you're going
2. **Energy Audit** - Discover what gives you energy vs. what drains you
3. **Minimum Viable Stability** - Define what "okay" looks like in the near term
4. **Strategic Pillars** - Identify 2-3 core focus areas
5. **Tactical Mapping** - Map what's in play and paths forward
6. **Goal Setting** - Set specific, meaningful goals
7. **Relationship Audit** - Understand who adds to your life
8. **Reflection & Meaning** - Make sense of the larger arc

---

## 🚀 Deploy to Vercel (No Coding Required)

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `aythya-strategy` (or whatever you prefer)
3. Keep it **Private** (recommended)
4. Click **Create repository**

### Step 2: Upload Files

1. Click **"uploading an existing file"** link
2. Drag and drop all the files from this folder
3. Click **Commit changes**

> **Note:** The files `env.example` and `gitignore.txt` are named without dots so GitHub's web interface accepts them. They work as-is for Vercel deployment.

### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Select your `aythya-strategy` repository
4. Before clicking Deploy, expand **Environment Variables**
5. Add this variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your API key from [console.anthropic.com](https://console.anthropic.com)
6. Click **Deploy**

Your site will be live in about 2 minutes! 🎉

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `env.example` | Example environment variables (copy to `.env.local` for local dev) |
| `gitignore.txt` | Git ignore rules (rename to `.gitignore` if using Git locally) |
| `package.json` | Dependencies and scripts (includes ESLint config) |
| `src/` | Application source code |
| `src/lib/ai/claude.ts` | AI prompts - **edit this to customize Claude's behavior** |

---

## ⚙️ Environment Variables

For Vercel, you only need:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Claude API key |

### Optional Variables (for advanced use)

```
RATE_LIMIT_REQUESTS_PER_HOUR=10    # Limit AI requests per hour
MAX_CONVERSATION_LENGTH=100         # Max messages to keep
```

---

## 🎨 Customizing Claude's Personality

Edit `src/lib/ai/claude.ts` to change how Claude interacts with users:

1. **BASE_SYSTEM_PROMPT** (line ~130): Overall personality and approach
2. **PHASE_PROMPTS** (line ~190): Questions and guidance for each phase

Example customizations:
- Make it more casual or formal
- Add industry-specific terminology
- Change the types of questions asked
- Adjust the level of challenge/support

After editing, commit to GitHub and Vercel will auto-redeploy.

---

## 🔒 Security Features

- ✅ CSRF protection on all API routes
- ✅ Session-based authentication
- ✅ Input validation and sanitization
- ✅ Rate limiting
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Plan ownership verification

---

## 📜 Legal Pages Included

- `/terms` - Terms of Service
- `/privacy` - Privacy Policy  
- `/cookies` - Cookie Policy

These include appropriate AI disclaimers. Update the email addresses and company name as needed.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Landing    │  │  Onboarding │  │  Planning Interface │ │
│  │  Page       │  │  Flow       │  │  (Chat + Sidebar)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  /api/chat  │  │ /api/health │  │  Middleware         │ │
│  │  (Claude)   │  │             │  │  (Auth + CSRF)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐
          │  Claude API     │  │  Storage Layer  │
          │  (Anthropic)    │  │  (localStorage) │
          └─────────────────┘  └─────────────────┘
```

---

## 💻 Local Development (Optional)

If you want to run locally:

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Add your API key to .env.local
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** Anthropic Claude API
- **Storage:** localStorage (Supabase-ready)
- **Deployment:** Vercel

---

## 📄 License

MIT License - feel free to use and modify for your own projects.

---

## 🙏 Support

If you encounter issues:
1. Check that your `ANTHROPIC_API_KEY` is set correctly in Vercel
2. Ensure your API key starts with `sk-ant-`
3. Check Vercel deployment logs for errors

For Claude customization questions, refer to [Anthropic's documentation](https://docs.anthropic.com).
