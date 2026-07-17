-- Links an item back to the dump/entry that produced it, so the Capture
-- feed can reconstruct "these N items came from this send" across reloads
-- without relying on client-side-only grouping. source (0006) already
-- copies the raw text fragment for provenance display; this is the
-- structural link dumps <-> items that source alone doesn't provide.
alter table items add column if not exists dump_id uuid references dumps(id) on delete set null;
create index if not exists idx_items_dump on items (dump_id);
