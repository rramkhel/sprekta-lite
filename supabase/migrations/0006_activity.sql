-- Item lifecycle. 'open' is the only state derived lists show.
alter table items add column if not exists status text not null default 'open'
  check (status in ('open','done','parked','archived'));
alter table items add column if not exists completed_at timestamptz;
alter table items add column if not exists deferrals int not null default 0;
-- raw capture text this item came from (copy of the dump fragment, not a FK,
-- so the citation survives dump deletion)
alter table items add column if not exists source text;

create index if not exists idx_items_user_status on items (user_id, status);

-- Questions Sprekta needs the user to answer. RLS: own rows.
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid references items(id) on delete cascade,
  kind text not null check (kind in ('fact','profile_person','profile_project')),
  tier int not null default 1 check (tier in (1,2,3)),
  text text not null,
  why text,
  status text not null default 'open' check (status in ('open','answered','dismissed')),
  answer text,
  created_at timestamptz default now(),
  answered_at timestamptz
);
alter table questions enable row level security;
create policy "own questions" on questions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sprekta's visible work. Every mutation Sprekta makes writes a row.
-- Note: status='parked' below means "resting, not gone" (the user deferred
-- it) — NOT the Capture design doc's use of the word "parked" (a vague
-- capture missing a *what*, which never gets its own status; it's just an
-- open item with an unanswered tier-3 question attached). Same English
-- word, two different concepts across the two source docs — this comment
-- exists so nobody re-derives the confusion later.
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid references items(id) on delete set null,
  type text not null check (type in ('placed','moved','converted','parked','done_marked','revived','archived')),
  text text not null,          -- "Groceries → Wed 6:00"
  why text,                    -- "your Tuesday evening filled up, so I slid it a day"
  undoable boolean default false,
  undone boolean default false,
  created_at timestamptz default now()
);
alter table activity_log enable row level security;
create policy "own activity" on activity_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
