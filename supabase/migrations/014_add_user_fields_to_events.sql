-- Add user/session tracking fields to events table for Sprint 13
-- This allows events to be associated with conversations and users (logged-in or anonymous)

-- Add new columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'chat';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_conversation_id ON events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);

-- Update RLS policies to match todos pattern
-- Drop existing overly-permissive policy
DROP POLICY IF EXISTS "Enable all access for events" ON events;

-- Create new policies that respect user/session ownership
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Add comments for documentation
COMMENT ON COLUMN events.user_id IS 'References auth.users for logged-in users';
COMMENT ON COLUMN events.session_id IS 'Session ID for anonymous users';
COMMENT ON COLUMN events.conversation_id IS 'References the conversation that created this event';
COMMENT ON COLUMN events.source IS 'Source of the event: chat, manual, import, etc.';
