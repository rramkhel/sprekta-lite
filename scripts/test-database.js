/**
 * Test database setup
 * Usage: node scripts/test-database.js
 */

import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function testDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Test 1: Insert a conversation
    console.log('🧪 Test 1: Creating test conversation...');
    const insertResult = await client.query(`
      INSERT INTO conversations (session_id, profile_text)
      VALUES ($1, $2)
      RETURNING id, session_id, created_at;
    `, ['test-session-123', 'Test profile text']);

    const conversationId = insertResult.rows[0].id;
    console.log(`✅ Conversation created:`, insertResult.rows[0]);

    // Test 2: Insert messages
    console.log('\n🧪 Test 2: Creating test messages...');
    await client.query(`
      INSERT INTO messages (conversation_id, role, content, phase)
      VALUES
        ($1, 'user', 'Test user message', 'initial'),
        ($1, 'assistant', 'Test assistant response', 'clarification');
    `, [conversationId]);
    console.log('✅ Messages created');

    // Test 3: Query messages
    console.log('\n🧪 Test 3: Querying messages...');
    const messagesResult = await client.query(`
      SELECT role, content, phase, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at;
    `, [conversationId]);

    console.log(`✅ Found ${messagesResult.rows.length} messages:`);
    messagesResult.rows.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    // Test 4: Cleanup
    console.log('\n🧪 Test 4: Cleaning up test data...');
    await client.query(`
      DELETE FROM conversations WHERE session_id = 'test-session-123';
    `);
    console.log('✅ Test data deleted (cascade deleted messages too)');

    // Test 5: Verify cascade delete
    const remainingMessages = await client.query(`
      SELECT COUNT(*) FROM messages WHERE conversation_id = $1;
    `, [conversationId]);
    console.log(`✅ Messages after delete: ${remainingMessages.rows[0].count} (should be 0)`);

    console.log('\n✨ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabase();
