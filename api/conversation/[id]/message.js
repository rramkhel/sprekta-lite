import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '../../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id, Authorization');

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
    const authHeader = req.headers.authorization;

    if (!id || !content) {
      return res.status(400).json({ error: 'Conversation ID and content are required' });
    }

    let userId = null;

    // If auth token provided, verify and get user
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      const supabaseAuth = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

      if (!error && user) {
        userId = user.id;
      }
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

    // Verify ownership
    const isOwner =
      (userId && conversation.user_id === userId) ||
      (sessionId && conversation.session_id === sessionId);

    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch user's profile if they're logged in
    let profileText = conversation.profile_text; // Fallback to pasted text

    if (conversation.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', conversation.user_id)
        .single();

      if (profile) {
        // Convert structured profile to text
        const { profileToText } = await import('../../../lib/profile-utils.js');
        profileText = profileToText(profile);
      }
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
    const systemPrompt = buildSystemPrompt(profileText);

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

      // Strip code block markers if present
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      // Claude sometimes returns JSON with literal newlines in string values
      // We need to escape them for valid JSON parsing
      // This regex finds string values and escapes newlines within them
      jsonStr = jsonStr.trim();

      // Simple approach: parse as lenient JSON by fixing common issues
      // Replace literal newlines inside JSON strings with \n
      // This handles cases where Claude returns multiline strings
      jsonStr = jsonStr.replace(/": "([^"]*?)"/gs, (match, content) => {
        // Escape newlines, tabs, and other control characters in string values
        const escaped = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `": "${escaped}"`;
      });

      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      console.error('Failed to parse:', assistantMessage.substring(0, 200));
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
