-- A single-item capture renders as a bare feed row, not a card+summary
-- (design review, single-todo spec) — but that's a *rendering* decision,
-- not a status one. A dump that parsed to 3 items and later has 2
-- archived must still render in the multi-item form: its "You said"
-- footer and "undo this dump" still mean something against the original
-- 3-line capture. item_count freezes the parsed count at capture time so
-- the form choice survives later archiving instead of flip-flopping with
-- however many items currently survive.
alter table dumps add column if not exists item_count int;
