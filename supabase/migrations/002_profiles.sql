-- ============================================
-- PROFILES TABLE
-- ============================================

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,

  -- Core identity
  name text,

  -- Structured profile data
  patterns jsonb default '[]',      -- ["Morning person", "Need buffer time"]
  red_flags jsonb default '[]',     -- ["Forgets to eat when busy", "Overcommits"]
  key_people jsonb default '[]',    -- [{name: "Sarah", relationship: "partner"}]
  priorities jsonb default '[]',    -- ["Family time", "Exercise", "Sprekta work"]

  -- Free-form context (backward compatible with pasted text)
  notes text,

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One profile per user
  constraint profiles_user_id_unique unique (user_id)
);

-- ============================================
-- UPDATE CONVERSATIONS TABLE
-- ============================================

-- Add profile_id to link conversation to profile snapshot
alter table public.conversations
  add column profile_id uuid references public.profiles;

-- Add title for conversation history display
alter table public.conversations
  add column title text;

-- ============================================
-- INDEXES
-- ============================================

create index idx_profiles_user_id on public.profiles(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

alter table public.profiles enable row level security;

-- Users can only see their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Users can create their own profile
create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Users can delete their own profile
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();
