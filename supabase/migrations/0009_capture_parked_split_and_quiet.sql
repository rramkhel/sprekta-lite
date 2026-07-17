-- Design review fix (P0-4): status='parked' was overloaded with two
-- unrelated meanings — "the system doesn't know the what" (a genuinely
-- vague capture) and "the user isn't ready yet" (a well-formed item they
-- deferred). Same status, same rendered line, different owners per the
-- Capture design doc §5: ambiguity is the system's problem, readiness is
-- the user's. parked_reason splits them without adding a second status
-- value everything else has to learn.
alter table items add column if not exists parked_reason text check (parked_reason in ('clarify', 'rest'));

-- Notification inversion (design doc §9.3): reminders are opt-out, not
-- opt-in — the valet sets a sensible default (a day-before nudge on a
-- deadline task, same as the existing 15-minutes-before on a timed one),
-- and the only user-facing action is to quiet it.
alter table items add column if not exists quiet boolean not null default false;

-- Rewritten to also fire a reminder off `deadline` (date-only, no
-- fixed_time) at a fixed default local time (9am), and to respect `quiet`.
-- Simplified the UPDATE reconcile step to a flat delete-and-reinsert of
-- unsent rows rather than a conditional diff — correctness over cleverness,
-- reminder rows are cheap and this is not a hot path.
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
    delete from reminders where event_id = new.id and sent_at is null;
  end if;

  if new.quiet or new.device_id is null then
    return new;
  end if;

  if new.fixed_time is not null then
    for v_offset in
      select (jsonb_array_elements_text(coalesce(new.reminder_offsets, '[15]'::jsonb)))::int
    loop
      v_fire_at := new.fixed_time - (v_offset || ' minutes')::interval;
      if v_fire_at > now() then
        insert into reminders (event_id, device_id, offset_minutes, fire_at, title, body)
        values (new.id, new.device_id, v_offset, v_fire_at, new.title, 'Starts at ' || to_char(new.fixed_time, 'HH12:MI AM'));
      end if;
    end loop;
  elsif new.deadline is not null then
    for v_offset in
      select (jsonb_array_elements_text(coalesce(new.reminder_offsets, '[1440]'::jsonb)))::int
    loop
      v_fire_at := ((new.deadline - greatest(v_offset / 1440, 0))::timestamp + time '09:00')
                   at time zone coalesce(new.timezone, 'America/Edmonton');
      if v_fire_at > now() then
        insert into reminders (event_id, device_id, offset_minutes, fire_at, title, body)
        values (new.id, new.device_id, v_offset, v_fire_at, new.title, 'Due ' || to_char(new.deadline, 'FMMonth DD'));
      end if;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists items_sync_reminder on items;
create trigger items_sync_reminder
  after insert or update of fixed_time, device_id, title, reminder_offsets, deadline, quiet on items
  for each row
  execute function sync_item_reminder();
