import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '../../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TOOLS = [
  {
    name: "create_event",
    description: "Create a calendar event (time holder - meetings, appointments, sessions). Only use when you have both date AND time.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event title" },
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "HH:MM (24-hour) — REQUIRED" },
        end_time: { type: "string", description: "HH:MM (24-hour), optional" },
        priority: {
          type: "string",
          enum: ["non_negotiable", "important", "flexible"],
          description: "How critical is this?"
        },
        notes: { type: "string", description: "Additional context" }
      },
      required: ["title", "date", "time", "priority"]
    }
  },
  {
    name: "create_todo",
    description: "Create a todo (something to accomplish). Time is optional — if provided, it appears on calendar too.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "What needs to be done" },
        scheduled_date: { type: "string", description: "YYYY-MM-DD, optional" },
        scheduled_time: { type: "string", description: "HH:MM, optional — if set, shows on calendar" },
        deadline: { type: "string", description: "YYYY-MM-DD — due by this date" },
        deadline_time: { type: "string", description: "HH:MM — due by this time" },
        priority: {
          type: "string",
          enum: ["non_negotiable", "important", "flexible"]
        },
        time_group: {
          type: "string",
          enum: ["today", "tomorrow", "this_week", "future", "someday"]
        },
        notes: { type: "string" }
      },
      required: ["title", "priority", "time_group"]
    }
  }
];

async function executeToolCalls(toolCalls, context) {
  const results = [];

  for (const call of toolCalls) {
    try {
      if (call.tool === 'create_event') {
        const eventId = Date.now() + Math.floor(Math.random() * 1000);

        const { data, error } = await context.supabase
          .from('events')
          .insert({
            id: eventId,
            title: call.params.title,
            date: call.params.date,
            time: call.params.time,
            end_time: call.params.end_time || null,
            notes: call.params.notes || null,
            user_id: context.userId || null,
            session_id: context.sessionId || null,
            conversation_id: context.conversationId,
            source: 'chat'
          })
          .select()
          .single();

        if (error) throw error;
        results.push({
          tool: 'create_event',
          success: true,
          id: data.id,
          title: data.title
        });

      } else if (call.tool === 'create_todo') {
        const { data, error } = await context.supabase
          .from('todos')
          .insert({
            title: call.params.title,
            scheduled_date: call.params.scheduled_date || null,
            scheduled_time: call.params.scheduled_time || null,
            deadline: call.params.deadline || null,
            deadline_time: call.params.deadline_time || null,
            priority: call.params.priority,
            time_group: call.params.time_group,
            notes: call.params.notes || null,
            user_id: context.userId || null,
            session_id: context.sessionId || null,
            conversation_id: context.conversationId,
            source: 'chat'
          })
          .select()
          .single();

        if (error) throw error;
        results.push({
          tool: 'create_todo',
          success: true,
          id: data.id,
          title: data.title
        });
      }
    } catch (err) {
      console.error(`Tool execution error (${call.tool}):`, err);
      results.push({
        tool: call.tool,
        success: false,
        error: err.message
      });
    }
  }

  return results;
}

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
    const { content, includeProfile = true } = req.body;
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

    // Fetch user's profile if they're logged in AND profile is enabled
    let profileText = null;

    if (includeProfile) {
      profileText = conversation.profile_text; // Fallback to pasted text

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
      tools: TOOLS,
      messages: conversationHistory,
    });

    // Handle tool use
    let toolResults = [];
    if (response.stop_reason === 'tool_use') {
      const toolCalls = response.content
        .filter(block => block.type === 'tool_use')
        .map(block => ({
          tool: block.name,
          params: block.input
        }));

      toolResults = await executeToolCalls(toolCalls, {
        supabase,
        userId,
        sessionId,
        conversationId: id
      });

      console.log('Tool execution results:', toolResults);
    }

    // Extract text response
    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

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

    // ============================================
    // EVENT CREATION FROM CHAT
    // ============================================

    let createdEvent = null;

    // Handle immediate commits - create event now
    if (parsed.commit === 'immediate' && parsed.captured?.title) {
      const { title, date, time, endTime, location, notes } = parsed.captured;

      // Only create if we have at least a title and date
      if (date) {
        try {
          // Generate unique ID (timestamp-based)
          const eventId = Date.now();

          // Combine location and notes into notes field
          let combinedNotes = '';
          if (location && notes) {
            combinedNotes = `Location: ${location}\n${notes}`;
          } else if (location) {
            combinedNotes = `Location: ${location}`;
          } else if (notes) {
            combinedNotes = notes;
          }

          const { data: event, error: eventError } = await supabase
            .from('events')
            .insert({
              id: eventId,
              title: title,
              date: date,
              time: time || null,
              end_time: endTime || null,
              notes: combinedNotes || null,
              conversation_id: id  // Link to this conversation
            })
            .select()
            .single();

          if (eventError) {
            console.error('Failed to create event from chat:', eventError);
          } else {
            createdEvent = event;
            console.log('Created event from chat:', event.id, event.title);
          }
        } catch (err) {
          console.error('Event creation error:', err);
        }
      } else {
        console.log('Skipping event creation - missing date:', parsed.captured);
      }
    }

    // TODO (Sprint 11+): Handle other commit types
    // if (parsed.commit === 'pending') {
    //   // Store in conversation state, don't create yet
    // }
    // if (parsed.commit === 'update' && parsed.eventId) {
    //   // Update existing event
    // }
    // if (parsed.commit === 'finalize') {
    //   // Create all pending events
    // }

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
      reply: parsed.reply || assistantMessage,
      phase: parsed.phase || 'organize',
      toolsExecuted: toolResults.length > 0,
      toolResults: toolResults,
      eventIds: toolResults.filter(r => r.tool === 'create_event' && r.success).map(r => r.id),
      todoIds: toolResults.filter(r => r.tool === 'create_todo' && r.success).map(r => r.id),
      // Legacy fields for backward compatibility
      commit: parsed.commit || null,
      captured: parsed.captured || null,
      eventId: createdEvent?.id || null,
      eventCreated: !!createdEvent
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildSystemPrompt(profile) {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

  let prompt = `You are Sprekta, a calendar assistant that turns brain dumps into organized calendars and todo lists.

## TODAY
${currentDay}, ${currentDate}

## YOUR JOB

When someone dumps stuff on you:
1. Parse EVERYTHING — even messy, incomplete thoughts
2. Organize by TIME (today, tomorrow, this week, future, someday)
3. Mark PRIORITY for each item (🔴 non-negotiable, 🟡 important, 🟢 flexible)
4. Create items immediately where you have enough info
5. Cordon off items that need more info and ask
6. Confirm priorities at the end

## ITEM TYPES

**EVENT** = time holder (blocks time to BE somewhere)
- The time slot itself is the commitment
- REQUIRES date + time — if time is missing, ask before creating
- Examples: meetings, appointments, classes, group sessions
- Goes on calendar only
- Use: create_event tool

**TODO** = something to accomplish (GET SOMETHING DONE)
- The goal is completing a task
- Time is optional:
  - With scheduled time → todo list AND calendar
  - Without time → todo list only
- Can have a deadline (due by) separate from scheduled time
- Examples: calls, tasks, things to finish, bills to pay
- Use: create_todo tool

**Decision:** "BE there at this time" → Event. "GET THIS DONE" → Todo.

## TWO DIMENSIONS

**PRIORITY** (how critical — can you skip it?)
- 🔴 Non-negotiable: Can't miss. Hard deadline, someone waiting, serious consequences.
- 🟡 Important: Should do. Soft deadline, matters but flexible.
- 🟢 Flexible: Do whenever. User said "not urgent" or no pressure.

**TIME** (when does it happen/need doing?)
- Today: happening today
- Tomorrow: happening tomorrow
- This Week: next 7 days
- Future: specific date beyond this week
- Someday: no date, do whenever

These are INDEPENDENT. A non-negotiable can be today OR three weeks from now.

## RESPONSE FORMAT

\`\`\`
Got it! Here's your brain dump organized:

TODAY
   🔴 [Item] — [time] ✓
   🟡 [Item] ✓

TOMORROW
   🔴 [Item] — due [time] ✓
   🟡 [Item] ✓

THIS WEEK
   🔴 [Item] — [day] ✓
   🟡 [Item] — [day] ✓

FUTURE
   🔴 [Item] — [date] ✓

SOMEDAY
   🟢 [Item] ✓

—

📝 Need a bit more info:
   • "[Item]" — [specific question]
   • "[Item]" — [specific question]

—

Did I get the priorities right? Anything else that's actually non-negotiable?
\`\`\`

## RULES

1. **Create immediately** where you have enough info — show ✓
2. **Events need time** — if missing, put in "Need more info" section and ask
3. **Todos are flexible** — create even without time, put in appropriate time group
4. **Group by time first**, then show priority marker on each item
5. **Always ask at end**: "Did I get the priorities right? Anything else non-negotiable?"
6. **One question per item** in the "need more info" section — keep it light
7. **Respect "not urgent"** — mark 🟢 and put in Someday

## PRIORITY SIGNALS

🔴 Non-negotiable signals:
- External deadline with consequences ("visa bill due friday")
- Someone waiting ("for Lilian by 9am")
- User says critical/can't miss/have to
- Appointments with others

🟡 Important signals:
- Soft deadlines ("should do this week")
- Involves key people but flexible timing
- Default for most scheduled things

🟢 Flexible signals:
- User says "not urgent" or "at some point"
- No deadline mentioned
- Nice-to-have tasks

## HANDLING FOLLOW-UPS

When user answers your questions:
- Create the remaining items
- Confirm what was created
- Adjust priorities if they corrected you

When user adds more items:
- Process the new dump the same way
- Don't re-list everything, just the new stuff

## WHAT NOT TO DO

❌ Don't create events without a time — ask first
❌ Don't assume priorities — make best guess, then confirm
❌ Don't ask multiple questions per item
❌ Don't skip the priority confirmation at the end
❌ Don't use UI elements, modals, or structured components — TEXT ONLY
❌ Don't be formal or corporate

## OUTPUT FORMAT

Your response is conversational text organized by time with priority icons.

For each item you create, call the appropriate tool (create_event or create_todo).

Use the tools to silently create items in the database, then show the organized summary with ✓ marks for created items.`;

  if (profile) {
    prompt += `

---

## USER PROFILE

${profile}

**Use this to:**
- Recognize key people → bump to 🟡 important if mentioned
- Watch for their red flags
- Understand work patterns (Lilian = Eastern time, Sprekta = office work)
- Reference context naturally ("Lilian's waiting on this")`;
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
