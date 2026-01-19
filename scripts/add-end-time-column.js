#!/usr/bin/env node
/**
 * Migration: Add end_time column to events table
 * Run: node scripts/add-end-time-column.js
 */

import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

// Load environment variables
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env file!');
  process.exit(1);
}

if (databaseUrl.includes('[YOUR-PASSWORD]')) {
  console.error('❌ Please replace [YOUR-PASSWORD] in DATABASE_URL with your actual password!');
  process.exit(1);
}

console.log('🔧 Running migration: Add end_time column...\n');

const migration = `
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TEXT;
`;

async function runMigration() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📋 Adding end_time column to events table...');
    await client.query(migration);
    console.log('✅ Column added successfully!\n');

    // Verify column exists
    console.log('🔍 Verifying column...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'end_time';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Column verified!');
      console.log(`   - Column: ${result.rows[0].column_name}`);
      console.log(`   - Type: ${result.rows[0].data_type}\n`);
      console.log('🎉 Migration complete!\n');
    } else {
      console.log('⚠️  Column was added but verification failed\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nDetails:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
