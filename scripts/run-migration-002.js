import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable required');
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function runMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/002_profiles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 002_profiles.sql...\n');
    await client.query(sql);

    console.log('✓ Migration completed successfully!\n');

    // Verify the table was created
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
    `);

    if (rows.length > 0) {
      console.log('✓ Verified: profiles table exists');
    }

    // Check if columns were added to conversations
    const { rows: cols } = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name IN ('profile_id', 'title')
    `);

    if (cols.length === 2) {
      console.log('✓ Verified: conversations table updated (profile_id, title columns added)');
    }

    console.log('\n🎉 Migration 002_profiles complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
