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
3. `003_add_needs_triage.sql` - Triage flag for events ⬅️ **LATEST**
4. `add_notes_column.sql` - Notes column for events

## Latest Migration: 003_add_needs_triage.sql

Adds `needs_triage` boolean column to events table for incomplete events that need user clarification.

**What it does:**
- Adds `needs_triage` column (boolean, default: false)
- Creates index for efficient triage queries
- Adds column documentation comment

**Idempotent:** Safe to run multiple times (uses `IF NOT EXISTS`)
