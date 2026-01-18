# Sprekta Lite

AI-powered calendar with quick capture.

## Project Structure

```
sprekta-lite/
├── index.html         # HTML structure
├── style.css          # All styles (extracted from monolithic file)
├── app.js             # All JavaScript logic
├── api/
│   └── parse.js      # AI parsing serverless function
├── docs/              # Documentation
│   ├── tech-stack.md # Tech stack overview
│   └── quick-reference.md # Common commands & troubleshooting
├── .env              # API keys (not in git)
├── .gitignore
├── package.json
└── vercel.json
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Your Anthropic API key is already in `.env`

3. Run locally:
   ```bash
   npx vercel dev --yes
   ```

4. Open http://localhost:3000

## Features

### ✅ Working
- **Calendar View** - Month view with events
- **Quick Capture** - "Jot it down" button with smart parsing
- **Triage Modal** - Confirm and add details to events
- **Notes View** - Full note-taking with rich text
- **Profile Panel** - Store user context
- **Toast Notifications** - Feedback for actions

### 🚧 Disabled (for now)
- **Chat Interface** - Needs `/api/chat` endpoint to avoid exposing API key

## Usage

1. Click **"Jot it down"** to quick capture
2. Type naturally: "Call mom tomorrow at 6pm"
3. Events are parsed and added to calendar
4. Click pending events to triage and add details

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Backend:** Vercel Serverless Functions
- **AI:** Anthropic Claude API (Haiku 3.5 in dev, Sonnet 3.5 in prod)
- **Database:** Supabase (PostgreSQL via Session Pooler) + localStorage fallback
- **Deployment:** Vercel + GitHub (auto-deploy on push)

## Documentation

New to development? Check out:
- **[Tech Stack Overview](docs/tech-stack.md)** - Understand how everything works
- **[Quick Reference](docs/quick-reference.md)** - Common commands and troubleshooting

## Deployment

- **Live Site:** https://sprekta-lite.vercel.app
- **Auto-deploys** when you push to GitHub `main` branch
- **Manual deploy:** `npx vercel --prod`

## Notes

- Uses modern, clean UI design
- CSS/JS split into separate files for maintainability
- Supabase for cloud persistence, localStorage as fallback
- Serverless API endpoints: `/api/parse` (AI), `/api/events` (CRUD), `/api/setup-db` (init)
