-- Events Table Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

CREATE TABLE IF NOT EXISTS events (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  end_time TEXT,
  notes TEXT,
  raw TEXT,
  ai_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later with auth)
CREATE POLICY "Enable all access for events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Add a function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
