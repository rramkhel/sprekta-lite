-- Reminder-eligible fields on items. device_id routes a reminder to the
-- device that created the item; timezone lets the trigger's fire_at math
-- (done upstream in app code, not here) be interpreted correctly. Legacy
-- items with no device_id are simply never reminder-eligible.
alter table items add column if not exists device_id text;
alter table items add column if not exists timezone text default 'America/Edmonton';

-- Push subscriptions, one row per device+endpoint. Never client-writable —
-- only the server-side /api/push/subscribe route (service role key, which
-- bypasses RLS) and the dispatcher touch this table. RLS is enabled with
-- zero policies for authenticated/anon, so the browser's Supabase client
-- has no access at all, by design.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
create index if not exists idx_push_subs_device on push_subscriptions (device_id);
alter table push_subscriptions enable row level security;

-- Reminders. Never client-writable — only the items-sync trigger below
-- (SECURITY DEFINER) and the dispatcher (service role) touch this table.
-- event_id cascades on item delete, covering "delete an item -> its
-- reminders vanish" without a separate DELETE trigger.
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references items(id) on delete cascade,
  device_id text,
  fire_at timestamptz not null,
  sent_at timestamptz,
  title text not null,
  body text,
  created_at timestamptz default now()
);
create index if not exists idx_reminders_due on reminders (fire_at) where sent_at is null;
create index if not exists idx_reminders_event on reminders (event_id);
alter table reminders enable row level security;

-- Keeps `reminders` in sync with an item's fixed_time/device_id/title.
-- SECURITY DEFINER so it can write to `reminders` even though the
-- triggering INSERT/UPDATE on `items` runs as the authenticated user's
-- role, which (deliberately) has no grant on `reminders` at all.
--
-- On UPDATE, always clears any *unsent* reminder for this item first, then
-- re-evaluates from the NEW row. This single path covers: time changed
-- (old unsent reminder replaced), time cleared (nothing re-created), and
-- time pushed further out after an earlier reminder already fired (the
-- sent one is left alone as history; a fresh unsent one is inserted).
-- fixed_time is assumed to already be a resolved UTC timestamptz by the
-- time it reaches this trigger — no date/time parsing happens here.
create or replace function sync_item_reminder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fire_at timestamptz;
begin
  if tg_op = 'UPDATE' then
    delete from reminders where event_id = new.id and sent_at is null;
  end if;

  if new.fixed_time is not null and new.device_id is not null then
    v_fire_at := new.fixed_time - interval '15 minutes';
    if v_fire_at > now() then
      insert into reminders (event_id, device_id, fire_at, title, body)
      values (new.id, new.device_id, v_fire_at, new.title, 'Starts at ' || to_char(new.fixed_time, 'HH12:MI AM'));
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists items_sync_reminder on items;
create trigger items_sync_reminder
  after insert or update of fixed_time, device_id, title on items
  for each row
  execute function sync_item_reminder();
