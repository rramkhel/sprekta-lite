# Supabase Database Setup

## Quick Start

Your Supabase credentials are already configured in `.env`. Now you just need to create the `events` table.

### Option 1: Automatic Setup (Recommended)

1. Make sure your dev server is running: `npx vercel dev --yes`
2. Visit: http://localhost:3000/api/setup-db
3. If successful, you'll see: `{"success": true, "message": "Events table is ready!"}`

### Option 2: Manual Setup (If automatic fails)

1. Go to your Supabase project: https://app.supabase.com/project/tqezvppmechaczaulput
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

The SQL will create:
- `events` table with all required fields
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-update trigger for `updated_at`

## Verify Setup

After running the SQL, test it:

```javascript
// Open browser console and run:
addTestEvent("Test Event", "2026-01-21", "14:00")
```

Check the Supabase dashboard:
1. Go to **Table Editor**
2. Select `events` table
3. You should see your test event!

## How It Works

### Loading Events
- On page load, `loadEvents()` fetches from `/api/events` (GET)
- Fallback to localStorage if Supabase is unavailable

### Saving Events
- When you create an event, `saveEvents()` calls `/api/events` (POST)
- Events are saved to both Supabase and localStorage
- Only new events are inserted (no duplicates)

### Deleting Events
- "Clear All" button deletes from both Supabase and localStorage

## Troubleshooting

### "Table does not exist" error

Run the SQL manually (Option 2 above).

### "Failed to load from Supabase" in console

Check:
1. Supabase credentials in `.env` are correct
2. The `events` table exists in Supabase
3. RLS policies allow access

### Events only in localStorage

The app falls back to localStorage if Supabase fails. Check:
- Console for error messages
- Network tab for failed `/api/events` requests

## API Endpoints

- `GET /api/events` - Load all events
- `POST /api/events` - Create new event
- `PUT /api/events` - Update event
- `DELETE /api/events` - Delete event
- `GET /api/setup-db` - Initialize database (one-time)

## Database Schema

```sql
events (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  raw TEXT,
  ai_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Next Steps

Once the table is set up:
1. Refresh your app
2. Try Quick Capture: "Meeting tomorrow at 2pm"
3. Check Supabase Table Editor to see the event!

Your events are now persisted to Supabase and accessible from anywhere! 🎉
