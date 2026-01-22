#!/bin/bash
# Test API endpoints for Sprint 6.2

set -e

API_BASE="http://localhost:3000/api/conversation"
SESSION_ID="test-session-$(date +%s)"

echo "🧪 Testing API Endpoints"
echo "Session ID: $SESSION_ID"
echo

# Test 1: Create conversation
echo "📝 Test 1: POST /api/conversation (create)"
RESPONSE=$(curl -s -X POST "$API_BASE" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"profileText\": null}")

echo "Response: $RESPONSE"
CONVERSATION_ID=$(echo $RESPONSE | grep -o '"conversationId":"[^"]*' | cut -d'"' -f4)
echo "Conversation ID: $CONVERSATION_ID"
echo

# Test 2: Get conversation (should be empty)
echo "📖 Test 2: GET /api/conversation/:id (empty conversation)"
curl -s "$API_BASE/$CONVERSATION_ID" \
  -H "X-Session-Id: $SESSION_ID" | jq '.'
echo

# Test 3: Send a message
echo "💬 Test 3: POST /api/conversation/:id/message (send message)"
curl -s -X POST "$API_BASE/$CONVERSATION_ID/message" \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: $SESSION_ID" \
  -d '{"content": "I need to pack for a trip tomorrow"}' | jq '.'
echo

# Test 4: Get conversation (should have messages)
echo "📖 Test 4: GET /api/conversation/:id (with messages)"
curl -s "$API_BASE/$CONVERSATION_ID" \
  -H "X-Session-Id: $SESSION_ID" | jq '.messages | length' | \
  awk '{print "Messages in conversation: " $1}'
echo

echo "✅ All API tests completed!"
echo "Note: Conversation ID $CONVERSATION_ID remains in database for inspection"
