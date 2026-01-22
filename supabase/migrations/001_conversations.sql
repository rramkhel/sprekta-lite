-- ============================================
-- SPREKTA CONVERSATION SCHEMA
-- Sprint 6.1: Database Schema
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
