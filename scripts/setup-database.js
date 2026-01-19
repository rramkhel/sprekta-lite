#!/usr/bin/env node
/**
 * Automatic Database Setup Script
 *
 * Creates the events table in Supabase automatically using direct PostgreSQL connection
 * Run: npm run setup-db
 */

import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

// Load environment variables
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env file!');
  console.error('\n📝 Steps to fix:');
  console.error('  1. Go to: https://supabase.com/dashboard/project/tqezvppmechaczaulput/settings/database');
  console.error('  2. Look for "Connection string" under "Connection parameters"');
  console.error('  3. Copy the URI connection string');
  console.error('  4. Add to .env as: DATABASE_URL=postgresql://postgres:[password]@db....');
  console.error('\nOr get your database password and replace [YOUR-PASSWORD] in .env\n');
  process.exit(1);
}

if (databaseUrl.includes('[YOUR-PASSWORD]')) {
  console.error('❌ Please replace [YOUR-PASSWORD] in DATABASE_URL with your actual password!');
  console.error('\n📝 Get it from:');
  console.error('   https://supabase.com/dashboard/project/tqezvppmechaczaulput/settings/database\n');
  process.exit(1);
}

console.log('🔧 Setting up Supabase database...\n');

const schema = `
-- Create events table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable all access for events" ON events;

-- Create policy to allow all operations
CREATE POLICY "Enable all access for events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_events_updated_at ON events;

-- Create trigger
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

async function setupDatabase() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📋 Creating events table...');
    await client.query(schema);
    console.log('✅ Table created successfully!\n');

    // Verify table exists
    console.log('🔍 Verifying table...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'events';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table verified!\n');
      console.log('🎉 Database setup complete!\n');
      console.log('You can now:');
      console.log('  1. Start your app: npx vercel dev --yes');
      console.log('  2. Open http://localhost:3000');
      console.log('  3. Try Quick Capture: "Meeting tomorrow at 2pm"');
      console.log('  4. Check events in Supabase Table Editor!\n');
    } else {
      console.log('⚠️  Table was created but verification failed\n');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nDetails:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
