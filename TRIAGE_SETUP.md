# Triage Panel Setup

## Database Migration Required

Before the triage panel will work properly, you need to run the database migration to add the `needs_triage` column to the events table.

### Steps:

1. Go to your [Supabase project dashboard](https://supabase.com/dashboard)
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy the contents of `supabase/migrations/003_add_needs_triage.sql`
5. Paste and click **"Run"**

### Migration SQL:

```sql
-- Add triage flag to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS needs_triage BOOLEAN DEFAULT FALSE;

-- Add index for efficient triage queries
CREATE INDEX IF NOT EXISTS idx_events_needs_triage ON events(needs_triage) WHERE needs_triage = true;

-- Add comment for documentation
COMMENT ON COLUMN events.needs_triage IS 'True if event is missing date/time info and needs user clarification';
```

## How to Use

1. **Open the triage panel**: Click the inbox icon in the top-right header
2. **View organized events**:
   - **Today** - Events happening today
   - **This Week** - Events in the next 7 days
   - **Later** - Events beyond this week (collapsible)
   - **Undetermined** - Events missing date/time info
3. **Resolve undetermined events**: Click the resolve button (◉) next to any undetermined event

## Features

- ✅ Text-first, minimal design
- ✅ Automatic event organization into buckets
- ✅ Integrates with 3-panel layout
- ✅ Switches to compact calendar when triage is open
- ✅ Panel state persists in localStorage
- ✅ Events clickable to view/edit details

## Implementation Notes

- Events with `needsTriage: true` or no date appear in "Undetermined"
- Past events are excluded from triage view
- Events sorted by time within each bucket
- "Later" section is collapsible to reduce clutter
