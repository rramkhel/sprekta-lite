# Sprekta Lite - Tech Stack Overview

## What This App Is

Sprekta Lite is an AI-powered calendar with quick capture functionality. You can jot down notes like "Call mom tomorrow at 6pm" and the AI will parse it into a calendar event.

## The Tech Stack

### Frontend (What the user sees)

#### **Vanilla JavaScript + HTML + CSS**
- **What it is:** Pure JavaScript without any frameworks like React or Vue
- **Why it matters:** Simple and fast, no build steps needed
- **What you need to know:**
  - All your UI code is in `app.js`
  - All your styles are in `style.css`
  - All your HTML structure is in `index.html`
  - Changes are immediate - just refresh the browser

#### **LocalStorage**
- **What it is:** Browser-based storage that saves data on the user's computer
- **Why it matters:** Your calendar events and notes persist even after closing the browser
- **What you need to know:**
  - Data is stored locally (not in a database yet)
  - Only works on the same device/browser
  - Can be cleared if user clears browser data
  - We'll eventually move to Supabase for cloud storage

### Backend (Server-side)

#### **Vercel Serverless Functions**
- **What it is:** Code that runs on Vercel's servers (not in the browser)
- **Why it matters:** Keeps your API keys secret and secure
- **What you need to know:**
  - Your serverless function is in `api/parse.js`
  - It's called when you submit a quick capture
  - Automatically deployed when you push to GitHub
  - Each function runs independently (no server to manage)

### AI & APIs

#### **Anthropic Claude API**
- **What it is:** AI language model that understands natural language
- **Why it matters:** Powers the smart event parsing ("Call mom tomorrow" → calendar event)
- **What you need to know:**
  - API key is in `.env` (never commit this!)
  - Uses Claude Sonnet 4 model
  - Costs money per request (track usage in Anthropic dashboard)
  - Called from serverless function to keep key secure

#### **Supabase**
- **What it is:** Backend-as-a-Service (database + authentication + storage)
- **Why it matters:** Will store your calendar data in the cloud (currently using localStorage)
- **What you need to know:**
  - PostgreSQL database (SQL-based)
  - Built-in authentication (users, login, etc.)
  - Real-time subscriptions (data updates live)
  - Dashboard at https://supabase.com/dashboard

### Deployment & Hosting

#### **Vercel**
- **What it is:** Platform for deploying web apps
- **Why it matters:** Hosts your app and makes it accessible online
- **What you need to know:**
  - Auto-deploys when you push to GitHub
  - Free tier is generous
  - Handles SSL certificates automatically
  - Serverless functions run here

#### **GitHub**
- **What it is:** Version control and code hosting
- **Why it matters:** Tracks changes to your code and triggers deployments
- **What you need to know:**
  - Your code lives at https://github.com/rramkhel/sprekta-lite
  - Every push to `main` branch triggers a Vercel deployment
  - `.gitignore` prevents sensitive files from being uploaded

## How It All Works Together

```
User types in browser
    ↓
Vanilla JS catches input (app.js)
    ↓
Sends to /api/parse serverless function
    ↓
Function calls Claude API with your text
    ↓
Claude returns structured event data (JSON)
    ↓
Serverless function sends back to browser
    ↓
JavaScript saves to localStorage
    ↓
UI updates with new calendar event
```

## Development Workflow

### Local Development
1. **Run dev server:** `npx vercel dev --yes`
2. **Access at:** http://localhost:3000
3. **Make changes** to HTML/CSS/JS files
4. **Refresh browser** to see changes

### Deploying Changes
1. **Make changes** to your code
2. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
3. **Push to GitHub:**
   ```bash
   git push
   ```
4. **Vercel auto-deploys** (watch in Vercel dashboard)
5. **Visit live site:** https://sprekta-lite.vercel.app

## Key Files Explained

```
sprekta-lite/
├── index.html              # Main HTML structure
├── style.css               # All visual styles
├── app.js                  # All JavaScript logic
├── api/
│   └── parse.js           # Serverless function (AI parsing)
├── .env                    # Secret keys (NEVER commit!)
├── .gitignore              # Files git should ignore
├── package.json            # Project dependencies
├── vercel.json             # Vercel configuration
└── docs/
    └── tech-stack.md      # This file!
```

## Environment Variables (Secrets)

Your `.env` file contains sensitive information:

```bash
# AI API
ANTHROPIC_API_KEY=sk-ant-...           # For Claude API
VITE_ANTHROPIC_API_KEY=sk-ant-...      # Backup for frontend

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...   # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...    # Public key (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=ey...        # Private key (NEVER expose!)
```

**Important:**
- `.env` is in `.gitignore` (not uploaded to GitHub)
- Vercel has copies of these for production
- Never share these keys publicly

## Common Tasks

### Add a new feature
1. Edit `app.js` (for logic)
2. Edit `style.css` (for styling)
3. Edit `index.html` (for structure)
4. Test locally with `npx vercel dev --yes`
5. Commit and push to deploy

### Run database migrations
When schema changes are needed (new tables, columns, indexes):

**Method 1: Using psql (Command Line)**
```bash
# Run a migration file
psql "$DATABASE_URL" -f supabase/migrations/003_add_needs_triage.sql

# Verify the migration worked
psql "$DATABASE_URL" -c "\d events"
```

**Method 2: Supabase Dashboard (Web UI)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" → "New Query"
4. Copy SQL from migration file in `supabase/migrations/`
5. Paste and click "Run"

**Migration Files Location:**
- All migrations are in `supabase/migrations/`
- Use `IF NOT EXISTS` to make them idempotent
- Numbered sequentially: `001_`, `002_`, `003_`, etc.

**Example Migration:**
```sql
-- Add new column
ALTER TABLE events ADD COLUMN IF NOT EXISTS needs_triage BOOLEAN DEFAULT FALSE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_events_needs_triage ON events(needs_triage);
```

### Debug an issue
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Check Console tab for errors
3. Check Network tab for API failures
4. Use `console.log()` to debug in `app.js`

### View logs
- **Local:** Check terminal where dev server is running
- **Production:** `vercel logs` or Vercel dashboard

### Update dependencies
```bash
npm update
```

## Learning Resources

### JavaScript (ES6+)
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [JavaScript.info](https://javascript.info/)

### Vercel
- [Vercel Docs](https://vercel.com/docs)
- [Serverless Functions](https://vercel.com/docs/functions)

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client Guide](https://supabase.com/docs/reference/javascript/introduction)

### Anthropic Claude
- [Anthropic Docs](https://docs.anthropic.com/)
- [API Reference](https://docs.anthropic.com/en/api)

### Git & GitHub
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub Hello World](https://guides.github.com/activities/hello-world/)

## Next Steps

Here are some things you might want to add:

1. **Replace localStorage with Supabase** - Store data in the cloud
2. **Add user authentication** - Let multiple people use the app
3. **Build a mobile app** - Use the same backend with a mobile frontend
4. **Add recurring events** - Support weekly/monthly events
5. **Email reminders** - Send notifications before events

## Getting Help

- **Vercel Issues:** Check deployment logs in Vercel dashboard
- **Supabase Issues:** Check Supabase logs and table editor
- **API Issues:** Check Anthropic usage dashboard
- **Code Issues:** Use browser DevTools console
- **Git Issues:** Run `git status` to see what's happening

## Glossary for Beginners

- **API (Application Programming Interface):** Way for different programs to talk to each other
- **Serverless Function:** Code that runs only when needed (no server to manage)
- **Environment Variable:** Secret value stored outside your code
- **Git Commit:** Saving a snapshot of your code changes
- **Deployment:** Publishing your code to the internet
- **localhost:** Your own computer (used for development)
- **Production:** The live version users see
- **Frontend:** Code that runs in the browser (what users see)
- **Backend:** Code that runs on servers (handles data/logic)
- **JSON:** Format for structuring data (JavaScript Object Notation)
- **HTTPS:** Secure web protocol (the lock icon in your browser)
