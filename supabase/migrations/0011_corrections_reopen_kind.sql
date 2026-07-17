-- Check-off from Capture (design-doc §7.1 amendment): completing an item
-- writes a corrections row so completion timing stays part of the §10.2
-- observed-channel data, same as every other correction. 'close' already
-- existed in the kind vocabulary (unused until now) and covers "complete";
-- 'reopen' is new — un-completing is its own distinct, auditable action,
-- same pattern as flag/unflag.
alter table corrections drop constraint if exists corrections_kind_check;
alter table corrections add constraint corrections_kind_check
  check (kind in ('edit_field','reclassify','retitle','flag','unflag','promote_today','rest','close','delete','answer_question','reopen'));
