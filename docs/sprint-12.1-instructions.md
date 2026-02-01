# Sprint 12.1: Database — Todos Table

## Context

Part of Sprint 12: Brain Dump → Organized Calendar & Todos. This sprint creates the database table to store todos separately from calendar events.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

Create the todos table to store tasks separately from calendar events. Todos have priority, time grouping, optional scheduled time, and optional deadlines.

---

## Migration

Create file: `supabase/migrations/012_todos.sql`

```sql
-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  session_id TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Core fields
  title TEXT NOT NULL,
  notes TEXT,

  -- Time (optional - if set, also shows on calendar)
  scheduled_date DATE,
  scheduled_time TIME,

  -- Deadline (different from scheduled - this is "due by")
  deadline DATE,
  deadline_time TIME,

  -- Priority: non_negotiable, important, flexible
  priority TEXT DEFAULT 'flexible'
    CHECK (priority IN ('non_negotiable', 'important', 'flexible')),

  -- Time group: today, tomorrow, this_week, future, someday
  time_group TEXT DEFAULT 'someday'
    CHECK (time_group IN ('today', 'tomorrow', 'this_week', 'future', 'someday')),

  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Metadata
  source TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_session_id ON todos(session_id);
CREATE INDEX idx_todos_time_group ON todos(time_group);
CREATE INDEX idx_todos_completed ON todos(completed);

-- RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can create todos" ON todos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Updated_at trigger
CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Running the Migration

### Option 1: Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Paste the migration SQL
4. Click "Run"

### Option 2: Migration Script

Create `scripts/run-migration-012-todos.js`:

```javascript
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function runMigration() {
  console.log('🔄 Connecting to database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationPath = path.join(__dirname, '../supabase/migrations/012_todos.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running migration: 012_todos.sql');
    await client.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify table was created
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'todos'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Columns in todos table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✨ Done!');
  }
}

runMigration();
```

Run it:
```bash
node scripts/run-migration-012-todos.js
```

---

## Verification

After running the migration, verify in Supabase:

```sql
-- Check table structure
\d todos

-- Check sample data (should be empty)
SELECT * FROM todos LIMIT 1;

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'todos';
```

Expected columns:
- `id` (UUID)
- `user_id` (UUID, nullable)
- `session_id` (TEXT, nullable)
- `conversation_id` (UUID, nullable)
- `title` (TEXT, required)
- `notes` (TEXT, nullable)
- `scheduled_date` (DATE, nullable)
- `scheduled_time` (TIME, nullable)
- `deadline` (DATE, nullable)
- `deadline_time` (TIME, nullable)
- `priority` (TEXT, default 'flexible')
- `time_group` (TEXT, default 'someday')
- `completed` (BOOLEAN, default false)
- `completed_at` (TIMESTAMPTZ, nullable)
- `source` (TEXT, default 'chat')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## Key Concepts

### Priority

Three levels:
- `non_negotiable` - Can't miss, hard deadline
- `important` - Should do, soft deadline
- `flexible` - Do whenever

### Time Group

Five groups:
- `today` - Happening today
- `tomorrow` - Happening tomorrow
- `this_week` - Next 7 days
- `future` - Specific date beyond this week
- `someday` - No date, do whenever

### Scheduled vs Deadline

- **Scheduled** = when you plan to DO it (shows on calendar if time is set)
- **Deadline** = when it's DUE by (different from scheduled)

Example: "Finish report" scheduled for Tuesday 2pm, deadline Friday 5pm

---

## Commit Message

```bash
git add supabase/migrations/012_todos.sql scripts/run-migration-012-todos.js
git commit -m "chore(db): create todos table

- Add todos table with priority and time_group fields
- Support scheduled time and deadline separately
- RLS policies for user/session access
- Indexes on user_id, session_id, time_group, completed

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Next Step

After completing this sprint, proceed to Sprint 12.2: Brain Dump System Prompt.
