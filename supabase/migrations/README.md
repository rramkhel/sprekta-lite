# Database Migrations

## How to Run Migrations

Execute these SQL files in order in your Supabase SQL Editor:

1. `001_conversations.sql` - Conversations table
2. `002_profiles.sql` - User profiles
3. `003_add_needs_triage.sql` - Triage flag for events ⬅️ **NEW**
4. `add_notes_column.sql` - Notes column for events

## Latest Migration: 003_add_needs_triage.sql

Adds `needs_triage` boolean column to events table for incomplete events that need user clarification.

**To apply:**
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `003_add_needs_triage.sql`
5. Paste and click "Run"

The migration is idempotent (safe to run multiple times).
