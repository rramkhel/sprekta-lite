/**
 * Run migration 013: Update todos table for Sprint 12
 * Usage: node scripts/run-migration-013-update.js
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
    const migrationPath = path.join(__dirname, '../supabase/migrations/013_update_todos_for_sprint12.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running migration: 013_update_todos_for_sprint12.sql');
    await client.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify columns
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'todos'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Updated todos table columns:');
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
