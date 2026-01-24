-- Add triage flag to events table
-- This allows events to be marked as needing user clarification (incomplete date/time info)

ALTER TABLE events ADD COLUMN IF NOT EXISTS needs_triage BOOLEAN DEFAULT FALSE;

-- Add index for efficient triage queries
CREATE INDEX IF NOT EXISTS idx_events_needs_triage ON events(needs_triage) WHERE needs_triage = true;

-- Add comment for documentation
COMMENT ON COLUMN events.needs_triage IS 'True if event is missing date/time info and needs user clarification';
