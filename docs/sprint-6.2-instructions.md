Sprint 6.2 Complete! ✅

  Fixed the JSON parsing issue and verified all API endpoints are working correctly.

  The Problem:
  Claude was returning JSON with literal newlines inside string values (when formatting replies with **bold** and
  bullets), which caused JSON.parse() to fail with "Bad control character in string literal" errors.

  The Fix:
  Updated api/conversation/[id]/message.js:113-120 to escape control characters (newlines, tabs, etc.) in JSON string
  values before parsing.

  Test Results:
  All 4 API endpoints passing:
  - ✅ POST /api/conversation - Creates conversation
  - ✅ GET /api/conversation/:id - Fetches conversation with messages
  - ✅ POST /api/conversation/:id/message - Sends message, gets AI reply with correct phase detection
  - ✅ Messages persist to database correctly

  Sprint 6.2 Summary:
  - Created 4 files (lib/supabase.js, 3 API endpoints)
  - Integrated Anthropic Claude API with phase-based prompts
  - Implemented session validation and message history
  - Fixed JSON parsing for multiline responses

  Ready for Sprint 6.3: Frontend Integration next (session management + state rewrite to use new API).

> yes please!


---


# Sprint 6.2: API Endpoints

## Goal

Create API endpoints for conversation management. The frontend will call these instead of using localStorage.

---

## Files to Create

```
api/
  conversation/
    index.js              ← POST: create conversation
    [id]/
      index.js            ← GET: fetch conversation with messages
      message.js          ← POST: send message (calls Claude + saves)
lib/
  supabase.js             ← Supabase client helper
```

---

## Task 1: Supabase Client Helper

**File:** `lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

// Server-side client with service role (bypasses RLS)
export function createServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

---

## Task 2: Create Conversation Endpoint

**File:** `api/conversation/index.js`

```javascript
import { createServiceClient } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, profileText } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const supabase = createServiceClient();

    // Check for existing active conversation with this session
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .single();

    if (existing) {
      // Return existing conversation
      return res.status(200).json({
        conversationId: existing.id,
        isNew: false
      });
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        profile_text: profileText || null,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create conversation' });
    }

    return res.status(201).json({
      conversationId: data.id,
      isNew: true
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Task 3: Get Conversation Endpoint

**File:** `api/conversation/[id]/index.js`

```javascript
import { createServiceClient } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const sessionId = req.headers['x-session-id'];

    if (!id) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    const supabase = createServiceClient();

    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify ownership (session_id or user_id must match)
    if (conversation.session_id !== sessionId && !conversation.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Messages fetch error:', msgError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    return res.status(200).json({
      conversation,
      messages: messages || []
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Task 4: Send Message Endpoint

**File:** `api/conversation/[id]/message.js`

This is the big one — it handles saving the user message, calling Claude, and saving the response.

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '../../../lib/supabase.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { content } = req.body;
    const sessionId = req.headers['x-session-id'];

    if (!id || !content) {
      return res.status(400).json({ error: 'Conversation ID and content are required' });
    }

    const supabase = createServiceClient();

    // Fetch conversation and verify ownership
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.session_id !== sessionId && !conversation.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch existing messages for context
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    // Save user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        role: 'user',
        content: content
      });

    if (userMsgError) {
      console.error('Failed to save user message:', userMsgError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // Build conversation history for Claude
    const conversationHistory = (existingMessages || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    conversationHistory.push({
      role: 'user',
      content: content
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(conversation.profile_text);

    // Call Claude
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationHistory,
    });

    const assistantMessage = response.content[0].text;

    // Parse response
    let parsed;
    try {
      let jsonStr = assistantMessage;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = {
        reply: assistantMessage,
        phase: 'unknown'
      };
    }

    // Save assistant message
    const { error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        role: 'assistant',
        content: parsed.reply,
        phase: parsed.phase || 'unknown'
      });

    if (assistantMsgError) {
      console.error('Failed to save assistant message:', assistantMsgError);
      // Don't fail the request - user got the response
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return res.status(200).json({
      reply: parsed.reply,
      phase: parsed.phase || 'unknown'
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildSystemPrompt(profile) {
  // Copy the full prompt from Sprint 5.1
  let prompt = `You are a planning assistant. You help people organize chaotic thoughts into clear plans.

## YOUR CORE PRINCIPLE
Every response must DEMONSTRATE UNDERSTANDING. Don't just ask questions - show you processed what they said by organizing it back to them.

## CONVERSATION PHASES

### Phase 1: Initial Dump
The user shares something messy - a trip, deadline, overwhelming situation.

Your response MUST include:
1. **Acknowledgment** - Brief, warm, shows you got it
2. **The anchor** - Identify the fixed point (flight, deadline, event date)
3. **Organized items** - Restate what they mentioned, grouped logically
4. **The window** - How much time they have
5. **One question** - About the most critical unknown

Example format:
"""
Got it - Toronto trip prep.

**The anchor:** Flight Sunday 12:50pm (mom picking you up at 10am)

**Before you leave:**
- Laundry tonight → blocks packing
- Pack
- Landlord login project (deadline unclear)

**Your window:** Tonight + tomorrow morning

One question: The landlord project - does it need to be done before you leave, or can it travel with you?
"""

### Phase 2: Clarification
User answers your question or adds new info.

Your response:
1. Incorporate the new info naturally
2. Update the picture if needed
3. Either ask the next most important question OR propose a rough sequence
4. Keep it short - don't re-list everything unless it changed

### Phase 3: Refinement
User pushes back, corrects something, or adds complications.

Your response:
1. Acknowledge the change without being defensive
2. Adjust the plan
3. Surface any new conflicts this creates
4. Stay solution-oriented

### Phase 4: Resolution
User signals satisfaction ("looks good", "that works", "perfect").

Your response:
1. Confirm the final plan clearly
2. Offer next step (add to calendar, set reminders)
3. Keep it brief - they're ready to move on

## IMPORTANT RULES

1. **Always organize** - Never respond with just a question. Show your work.
2. **One question at a time** - Don't overwhelm with multiple questions
3. **Keep it tight** - 2-5 sentences for follow-ups, longer only for initial organization
4. **Use their language** - If they say "landlord login project", you say that too
5. **Surface constraints** - Time math, dependencies, risks
6. **No over-formatting** - Use bullets only when 3+ items. Keep it readable, not clinical.

## OUTPUT FORMAT

Respond with JSON:
{
  "reply": "Your response text here (can include **bold** and line breaks)",
  "phase": "initial|clarification|refinement|resolution"
}`;

  if (profile) {
    prompt += `

---

## USER PROFILE

The user shared context about themselves. Use this to personalize:
- Reference their patterns/preferences
- Flag risks based on their known blind spots
- Protect their stated priorities

${profile}`;
  }

  return prompt;
}
```

---

## Checklist

- [ ] `lib/supabase.js` created
- [ ] `POST /api/conversation` works (creates conversation)
- [ ] `GET /api/conversation/:id` works (fetches conversation + messages)
- [ ] `POST /api/conversation/:id/message` works (sends message, gets AI reply)
- [ ] Messages are saved to database
- [ ] Session ID validation works
- [ ] Errors handled gracefully

---

## Testing

```bash
# Create conversation
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-123", "profileText": null}'

# Send message (replace CONVERSATION_ID)
curl -X POST http://localhost:3000/api/conversation/CONVERSATION_ID/message \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: test-123" \
  -d '{"content": "I need to pack for a trip tomorrow"}'

# Get conversation
curl http://localhost:3000/api/conversation/CONVERSATION_ID \
  -H "X-Session-Id: test-123"
```

---

## Commit

```bash
git add lib/supabase.js api/conversation/
git commit -m "feat: conversation API endpoints (Sprint 6.2)

- POST /api/conversation - create new conversation
- GET /api/conversation/:id - fetch conversation + messages
- POST /api/conversation/:id/message - send message + get AI reply
- All messages persisted to Supabase
- Session ID validation for anonymous users"
```

---

## Notes

### Why Service Role Key?

Anonymous users don't have Supabase auth tokens, so we can't use RLS to verify ownership at the database level. Instead, we:
1. Use service role key to bypass RLS
2. Manually validate session ID in the API
3. Only return data if session ID matches

### Error Handling Strategy

If saving the assistant message fails, we still return the response to the user. Why? Because:
- They already sent the message (user message is saved)
- Claude already generated a response (we paid for it)
- Better to show them the response than fail silently

We log the error for debugging but don't block the user.

### Why Store Messages Separately?

We could store all messages as JSON in the conversation record, but separate rows let us:
- Query individual messages efficiently
- Add message-level metadata (phase, timestamps)
- Stream messages in the future (show typing as it generates)
- Index and search message content

---

Ready for Sprint 6.3 (Frontend Integration)?
