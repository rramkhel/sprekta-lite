# Sprint 10.1: Database Schema Update

## Context

Part of Sprint 10: Capture-First Chat Flow. This sprint adds database support for linking events to conversations.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

Add `conversation_id` to the events table so we can track which conversation created each event.

---

## Migration

Run this in Supabase SQL Editor:

```sql
-- Add conversation_id to events table
ALTER TABLE events
ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX idx_events_conversation_id ON events(conversation_id);

-- Comment for documentation
COMMENT ON COLUMN events.conversation_id IS 'Links event to the chat conversation that created it';
```

---

## Verification

After running, check the events table structure in Supabase dashboard. The `conversation_id` column should appear as a nullable UUID.

---

## Commit Message

```bash
git add -A
git commit -m "chore(db): add conversation_id to events table

- Add conversation_id column to events table
- Add index for faster lookups
- Link events to conversations for tracking

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Next Step

After completing this sprint, proceed to Sprint 10.2: Capture-First System Prompt.
