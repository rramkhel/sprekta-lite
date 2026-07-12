create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  rhythm jsonb default '[]', defaults jsonb default '{}',
  learned jsonb default '[]', projects jsonb default '{}',
  updated_at timestamptz default now()
);
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null, kind text, minutes int, deadline date,
  fixed_time timestamptz, energy text, priority text, project text,
  today boolean default false, why text, notes text, suggested_slot text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  raw_text text, created_at timestamptz default now()
);
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  text text, created_at timestamptz default now()
);
alter table profiles enable row level security;
alter table items enable row level security;
alter table dumps enable row level security;
alter table feedback enable row level security;
create policy "own profile"  on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own items"    on items    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own dumps"    on dumps    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own feedback" on feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
