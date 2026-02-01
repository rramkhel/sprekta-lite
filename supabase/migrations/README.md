# Database Migrations

## How to Run Migrations

### Method 1: Using psql (Recommended)

**Prerequisites:** You need `psql` installed and `DATABASE_URL` in your `.env`

```bash
# Run a specific migration
psql "$DATABASE_URL" -f supabase/migrations/003_add_needs_triage.sql

# Verify migration
psql "$DATABASE_URL" -c "\d events"

# Or use the full connection string
psql "postgresql://postgres.tqezvppmechaczaulput:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres" -f supabase/migrations/003_add_needs_triage.sql
```

### Method 2: Supabase SQL Editor (Manual)

1. Go to your [Supabase project dashboard](https://supabase.com/dashboard)
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy the contents of the migration file
5. Paste and click **"Run"**

## Migration Files (Run in Order)

1. `001_conversations.sql` - Conversations table
2. `002_profiles.sql` - User profiles
3. `003_add_needs_triage.sql` - Triage flag for events
4. `add_notes_column.sql` - Notes column for events
5. `012_add_markdown_fields_to_profiles.sql` - Markdown fields for profiles
6. `013_todos.sql` - Todos table
7. `013_update_todos_for_sprint12.sql` - Update todos for Sprint 12
8. `014_add_user_fields_to_events.sql` - User/session tracking for events ⬅️ **LATEST**

## Latest Migration: 014_add_user_fields_to_events.sql

Adds user/session tracking fields to events table for Sprint 13, enabling multi-user support and conversation tracking.

**What it does:**
- Adds `user_id`, `session_id`, `conversation_id`, `source` columns
- Creates indexes for efficient queries
- Updates RLS policies to match todos pattern (user/session ownership)
- Adds column documentation comments

**Idempotent:** Safe to run multiple times (uses `IF NOT EXISTS` and `CREATE OR REPLACE`)
