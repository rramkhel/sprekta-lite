# Sprint 6.1: Database Schema

## Goal

Set up Supabase tables for conversations and messages with proper security.

---

## Task 1: Create Tables

Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
-- ============================================
-- SPREKTA CONVERSATION SCHEMA
-- ============================================

-- Conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),

  -- Identity: one of these will be set
  session_id text,                           -- anonymous users
  user_id uuid references auth.users,        -- logged-in users

  -- Content
  profile_text text,                         -- pasted profile (temporary until real profiles)
  status text default 'active' check (status in ('active', 'resolved', 'abandoned')),

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,

  -- Content
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  phase text check (phase in ('initial', 'clarification', 'refinement', 'resolution', 'unknown')),

  -- Metadata
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Find conversations by session (anonymous users)
create index idx_conversations_session_id on public.conversations(session_id)
  where session_id is not null;

-- Find conversations by user (logged-in users)
create index idx_conversations_user_id on public.conversations(user_id)
  where user_id is not null;

-- Find messages in a conversation (ordered)
create index idx_messages_conversation_id on public.messages(conversation_id, created_at);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function update_updated_at();
```

---

## Task 2: Row Level Security (RLS)

This is **critical** for security. Without RLS, anyone can read anyone's conversations.

```sql
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Policy: Users can read their own conversations (by user_id)
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

-- Policy: Anyone can create a conversation (anonymous or logged in)
create policy "Anyone can create conversations"
  on public.conversations for insert
  with check (true);

-- Policy: Users can update their own conversations
create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

-- Policy: Service role can do anything (for API)
-- (Service role bypasses RLS by default, so no policy needed)

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Policy: Users can read messages in their conversations
create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and c.user_id = auth.uid()
    )
  );

-- Policy: Anyone can insert messages (API validates ownership)
create policy "Anyone can create messages"
  on public.messages for insert
  with check (true);
```

---

## Task 3: API Access Setup

For anonymous users, your API needs to access the database with elevated privileges. You'll use the **service role key** (not the anon key).

**In Vercel environment variables, ensure you have:**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

> ⚠️ **Never expose the service role key to the frontend.** It bypasses RLS. Only use it in serverless functions.

---

## Task 4: Verify Setup

Run these queries to verify:

```sql
-- Check tables exist
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('conversations', 'messages');

-- Check RLS is enabled
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('conversations', 'messages');

-- Test insert (should work)
insert into conversations (session_id, profile_text)
values ('test-session-123', 'Test profile')
returning id;

-- Clean up test
delete from conversations where session_id = 'test-session-123';
```

---

## Checklist

- [ ] Tables created (conversations, messages)
- [ ] Indexes created
- [ ] RLS enabled on both tables
- [ ] Policies created
- [ ] `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars
- [ ] Test insert/delete works

---

## Commit

No code commit for this sprint — it's all Supabase configuration. But document what you did:

```bash
# In your project, create a migrations folder for reference
mkdir -p supabase/migrations
# Save the SQL as a migration file
# supabase/migrations/001_conversations.sql
```

---

## Notes

### Why Two Identity Fields?

The `conversations` table has both `session_id` and `user_id`:
- Anonymous users: `session_id` is set, `user_id` is null
- Logged-in users: `user_id` is set, `session_id` is null (or cleared)
- Migration: When user logs in, we move `session_id` conversations to `user_id`

### Why `profile_text` Instead of a Profile Table?

For now, we're keeping it simple. Users paste their profile as text, and it's stored with the conversation. In Milestone 7, we can create a proper profiles table with structured fields.

### Why `phase` Field on Messages?

The AI returns a phase indicator (`initial`, `clarification`, `refinement`, `resolution`). This lets us:
- Show UI indicators (e.g., "Planning..." vs "Refining...")
- Track conversation progress
- Trigger different UI states (e.g., show "Add to Calendar" button in resolution phase)

---

## Troubleshooting

**RLS blocking inserts:**
Make sure you're using the service role key in your API, not the anon key.

**Can't find service role key:**
Supabase Dashboard → Settings → API → Service Role Key (secret)

**Trigger errors:**
Make sure the `$$` syntax is correct. Some SQL editors need single `$` instead.

---

Ready for Sprint 6.2 (API Endpoints)?
