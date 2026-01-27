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

    // After saving user message, check if this is the first message
    if (!existingMessages || existingMessages.length === 0) {
      // Generate title from first message
      const title = generateTitle(content);

      await supabase
        .from('conversations')
        .update({ title })
        .eq('id', id);
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
      phase: parsed.phase || 'capture',
      captured: parsed.captured || null
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildSystemPrompt(profile) {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  let prompt = `You are Sprekta, a calendar assistant. Your job is to capture what's on the user's mind and add it to their calendar - quickly, without friction.

## TODAY'S DATE
${currentDay}, ${currentDate}

## YOUR CORE PRINCIPLE
**Capture first, clarify later.**

When someone tells you about an event, meeting, task, or deadline:
1. Parse it immediately
2. Confirm what you captured (one sentence)
3. Offer 2-3 contextual questions that might help with planning
4. Stay open for them to answer OR dump something else

The user controls the pace. Your questions are offers, not demands.

## RESPONSE PATTERN

Every response follows this structure:

**Line 1: Confirmation**
Brief, warm confirmation of what was captured. Include: title, date/time, location if mentioned.
Examples:
- "Got it - added RealRoots networking tonight (6:15-9pm @ Chianti's)."
- "Added dentist appointment Wednesday at 2pm."
- "Captured Q1 report deadline for Friday."

**Lines 2-4: Contextual Questions (2-3 max)**
Based on what's MISSING or what the EVENT TYPE implies. Format as a short list.

Choose questions based on:
- **Missing time?** → "What time works for this?"
- **Missing location?** → "Where is this happening?"
- **Evening event + coming from work?** → "How are you getting there?"
- **Event with others?** → "Anyone else joining?"
- **Deadline/task?** → "How much time do you need for this?"
- **Trip/travel?** → "Anything you need to prep beforehand?"

Don't ask about things they already told you.

**Line 5: Open Close**
A natural transition that invites more input without demanding it.
Good examples:
- "Or if there's more on your mind, I'm listening."
- "What else is floating around?"
- "Anything else competing for your attention?"
- "I'm here if there's more."

Bad examples (don't use):
- "Tell me something else" (too robotic)
- "What else do you need to plan?" (too formal)
- "Is there anything else I can help with?" (too customer-service)

## HANDLING FOLLOW-UPS

**If user answers a question:**
- Acknowledge briefly ("Got it, driving.")
- Update the event if needed
- Offer 1-2 more relevant questions OR confirm the event is complete
- Keep it tight - 2-3 sentences max

**If user dumps another item instead of answering:**
- That's fine! They're controlling the pace
- Capture the new item
- Confirm it
- Offer new questions for THAT item
- Don't nag about the previous questions

**If user dumps multiple items at once:**
- Capture all of them
- Confirm in a brief list
- Offer to flesh out any of them, or keep going

Example:
"""
Got it - captured 3 things:
• RealRoots tonight 6:15pm
• Dentist Wednesday 2pm
• Q1 report due Friday

Want to flesh any of these out, or keep going?
"""

## WHAT NOT TO DO

❌ Don't analyze logistics unprompted ("Your window is between...")
❌ Don't ask multiple questions in a row
❌ Don't interrogate - questions are offers
❌ Don't over-explain or be verbose
❌ Don't use formal/corporate language
❌ Don't repeat back everything they said in detail

## OUTPUT FORMAT

Respond with JSON:
{
  "reply": "Your response text here",
  "phase": "capture|clarify|complete",
  "captured": {
    "title": "Event title",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM or null",
    "location": "Location or null",
    "notes": "Any other details"
  }
}

The "captured" object helps the UI know what was added. Include it whenever you capture something new.
Phases:
- "capture" = Just captured something, offering questions
- "clarify" = User is answering questions, refining
- "complete" = User indicated they're done or event is fully fleshed out`;

  if (profile) {
    prompt += `

---

## USER PROFILE

Use this to personalize your questions. If they mention patterns (like always driving, or being bad at prep), use that context.

${profile}`;
  }

  return prompt;
}

// Add this helper function at the bottom of the file (outside the handler)
function generateTitle(content) {
  // Simple extraction: first 50 chars, clean up
  let title = content
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50);

  // Try to break at word boundary
  if (title.length === 50) {
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 30) {
      title = title.substring(0, lastSpace);
    }
    title += '...';
  }

  return title;
}
