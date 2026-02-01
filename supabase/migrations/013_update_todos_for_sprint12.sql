-- Update todos table for Sprint 12

-- Add missing columns
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS deadline_time TIME,
  ADD COLUMN IF NOT EXISTS time_group TEXT DEFAULT 'someday'
    CHECK (time_group IN ('today', 'tomorrow', 'this_week', 'future', 'someday')),
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'chat';

-- Drop old columns (if they exist)
ALTER TABLE todos
  DROP COLUMN IF EXISTS decay_enabled,
  DROP COLUMN IF EXISTS decay_after_days;

-- Update priority column constraint if needed
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_priority_check;
ALTER TABLE todos ADD CONSTRAINT todos_priority_check
  CHECK (priority IN ('non_negotiable', 'important', 'flexible'));

-- Add index on time_group if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_todos_time_group'
  ) THEN
    CREATE INDEX idx_todos_time_group ON todos(time_group);
  END IF;
END$$;

-- Comments
COMMENT ON COLUMN todos.time_group IS 'When to do it: today, tomorrow, this_week, future, someday';
COMMENT ON COLUMN todos.deadline_time IS 'Time component of deadline (HH:MM)';
COMMENT ON COLUMN todos.source IS 'Where this todo came from (chat, manual, etc)';
