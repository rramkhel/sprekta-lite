/**
 * Run migration 012: Add markdown fields to profiles
 * Usage: node scripts/run-migration-012.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function runMigration() {
  console.log('🔄 Connecting to database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/012_add_markdown_fields_to_profiles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running migration: 012_add_markdown_fields_to_profiles.sql');
    await client.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name IN ('about_me', 'projects')
      ORDER BY column_name;
    `);

    console.log('\n📋 Columns added to profiles table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✨ Done!');
  }
}

runMigration();
