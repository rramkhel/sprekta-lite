create table if not exists profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  profile jsonb not null,
  created_at timestamptz default now()
);
alter table profile_snapshots enable row level security;
create policy "own snapshots" on profile_snapshots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
