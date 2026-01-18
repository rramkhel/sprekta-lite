/**
 * Database Setup Endpoint
 *
 * Checks if the events table exists and provides setup instructions
 * Access: GET /api/setup-db
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Supabase credentials not configured',
      missingUrl: !supabaseUrl,
      missingKey: !supabaseKey
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test if table exists by querying
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (error) {
      // Table doesn't exist or RLS is blocking
      if (error.code === '42P01') {
        return res.status(200).json({
          success: false,
          tableExists: false,
          message: 'Events table does not exist',
          instructions: 'Please run the SQL from supabase/schema.sql in your Supabase SQL Editor',
          sqlEditorUrl: `https://app.supabase.com/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`,
          sql: `-- Copy and paste this in Supabase SQL Editor:

CREATE TABLE events (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  raw TEXT,
  ai_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX events_date_idx ON events(date);
CREATE INDEX events_created_at_idx ON events(created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);`
        });
      }

      // Other error (likely RLS)
      return res.status(200).json({
        success: false,
        tableExists: true,
        message: 'Table exists but access is restricted',
        error: error.message,
        hint: 'Check Row Level Security policies in Supabase'
      });
    }

    // Success! Table exists and is accessible
    return res.status(200).json({
      success: true,
      tableExists: true,
      message: 'Events table is ready!',
      rowCount: data?.length || 0
    });

  } catch (error) {
    console.error('[Setup DB] Error:', error);
    return res.status(500).json({
      error: 'Setup check failed',
      details: error.message
    });
  }
}
