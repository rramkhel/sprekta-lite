# Sprekta Lite

AI-powered calendar with quick capture.

## Project Structure

```
sprekta-lite/
├── index.html         # Single-file app (calendar-11 based)
├── api/
│   └── parse.js      # AI parsing serverless function
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

## Notes

- Uses calendar-11 design (clean, modern UI)
- All CSS/JS is inline in index.html for simplicity
- LocalStorage for data persistence
- `/api/parse` endpoint for AI-powered parsing (optional - has built-in parser too)
