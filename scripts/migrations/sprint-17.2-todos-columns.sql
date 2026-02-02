-- Sprint 17.2: Add columns for Today page context grouping
-- Run this in Supabase SQL Editor

-- Add context grouping columns
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS context_group VARCHAR(50),
ADD COLUMN IF NOT EXISTS context_label VARCHAR(255),
ADD COLUMN IF NOT EXISTS context_subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS relative_to_anchor VARCHAR(255);

-- Add display metadata
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS meta VARCHAR(100),
ADD COLUMN IF NOT EXISTS emoji VARCHAR(10);

-- Add events flagged column if not exists
ALTER TABLE events
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;

-- Note: completed column should already exist from previous sprints
-- If not, add it:
-- ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
