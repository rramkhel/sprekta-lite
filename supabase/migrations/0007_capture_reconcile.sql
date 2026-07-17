-- Reconciles the Capture design doc's data needs against 0006 (Activity),
-- so both surfaces read/write one coherent schema instead of Capture
-- reinventing tables Activity already defined. See agent/knowledge/cortex.md
-- for the full reconciliation notes (this migration is the code half of it).

-- Priority axis, separate from urgency (today) and deferral. Nothing in
-- 0006 covers this — it's Capture's "flag" concept (warm ochre, "won't
-- slip", never auto-set).
alter table items add column if not exists flagged boolean not null default false;

-- Reminders are plural (Capture §8.2): an item can carry more than one
-- lead-time reminder (15m before + 1 day before + 1 week before). Offsets
-- are minutes-before-fixed_time. Existing behavior (always exactly one
-- reminder, 15 minutes before) is preserved as the default.
alter table items add column if not exists reminder_offsets jsonb not null default '[15]';
alter table reminders add column if not exists offset_minutes int not null default 15;

-- Training/audit signal for every user-initiated edit (flag, flip, retitle,
-- close, delete, answer). Distinct from activity_log, which is Sprekta's
-- own autonomous moves reviewed in Activity's "Handled" section — this
-- table is the mirror image: what the user did to correct or steer Sprekta.
create table if not exists corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid references items(id) on delete set null,
  kind text not null check (kind in ('edit_field','reclassify','retitle','flag','unflag','promote_today','rest','close','delete','answer_question')),
  before jsonb,
  after jsonb,
  surface text,  -- 'capture'|'today'|'activity'|'item_view'|'point_of_use'
  created_at timestamptz default now()
);
alter table corrections enable row level security;
create policy "own corrections" on corrections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Rewritten to loop over reminder_offsets (was: a single hardcoded -15min
-- offset). Same reconcile logic per offset: delete any unsent reminder
-- whose offset is no longer requested, then for each currently-requested
-- offset, replace any unsent row for that offset (the time may have
-- changed) or insert a fresh one if none exists and fire_at is still in
-- the future. A previously-SENT row for a given offset is left untouched
-- as history, same as before.
create or replace function sync_item_reminder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset int;
  v_fire_at timestamptz;
begin
  if tg_op = 'UPDATE' then
    delete from reminders
     where event_id = new.id
       and sent_at is null
       and offset_minutes not in (
         select (jsonb_array_elements_text(coalesce(new.reminder_offsets, '[15]'::jsonb)))::int
       );
  end if;

  if new.fixed_time is not null and new.device_id is not null then
    for v_offset in
      select (jsonb_array_elements_text(coalesce(new.reminder_offsets, '[15]'::jsonb)))::int
    loop
      v_fire_at := new.fixed_time - (v_offset || ' minutes')::interval;
      if v_fire_at > now() then
        delete from reminders where event_id = new.id and offset_minutes = v_offset and sent_at is null;
        insert into reminders (event_id, device_id, offset_minutes, fire_at, title, body)
        values (new.id, new.device_id, v_offset, v_fire_at, new.title, 'Starts at ' || to_char(new.fixed_time, 'HH12:MI AM'));
      end if;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists items_sync_reminder on items;
create trigger items_sync_reminder
  after insert or update of fixed_time, device_id, title, reminder_offsets on items
  for each row
  execute function sync_item_reminder();
