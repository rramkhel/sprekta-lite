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
      messages: conversationHistory,
    });

    // Extract text response
    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse JSON response
    let parsed;
    try {
      let jsonStr = assistantMessage.trim();

      // Strip markdown code blocks if Claude wrapped it anyway
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
      }

      parsed = JSON.parse(jsonStr);

      // Validate required field
      if (!parsed.reply) {
        throw new Error('Missing reply field');
      }
    } catch (e) {
      console.error('JSON parse failed:', e.message);
      console.error('Raw response:', assistantMessage.substring(0, 500));

      // Fallback: treat entire response as reply
      parsed = {
        reply: assistantMessage || "I'm having trouble processing that. Could you try again?",
        events: [],
        todos: []
      };
    }

    // Create events
    const createdEvents = [];
    console.log(`[Message API] Attempting to create ${parsed.events?.length || 0} events`);

    for (const event of (parsed.events || [])) {
      console.log('[Message API] Processing event:', event);

      // Validate required fields
      if (!event.title || !event.date || !event.time) {
        console.warn('[Message API] Skipping invalid event (missing required fields):', event);
        continue;
      }

      try {
        const insertData = {
          user_id: userId || null,
          session_id: sessionId,
          conversation_id: id,
          title: event.title,
          date: event.date,
          time: event.time,
          end_time: event.end_time || null,
          notes: event.notes || null,
          source: 'chat'
        };

        console.log('[Message API] Inserting event with data:', insertData);

        const { data, error } = await supabase
          .from('events')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('[Message API] Insert error:', error);
          throw error;
        }

        console.log('[Message API] Successfully created event:', data);
        if (data) createdEvents.push(data);
      } catch (err) {
        console.error('[Message API] Failed to create event:', err.message, event);
      }
    }

    console.log(`[Message API] Total events created: ${createdEvents.length}`);

    // Create todos
    const createdTodos = [];
    console.log(`[Message API] Attempting to create ${parsed.todos?.length || 0} todos`);

    for (const todo of (parsed.todos || [])) {
      console.log('[Message API] Processing todo:', todo);

      // Validate required field
      if (!todo.title) {
        console.warn('[Message API] Skipping invalid todo (missing title):', todo);
        continue;
      }

      try {
        const insertData = {
          user_id: userId || null,
          session_id: sessionId,
          conversation_id: id,
          title: todo.title,
          scheduled_date: todo.scheduled_date || null,
          scheduled_time: todo.scheduled_time || null,
          deadline: todo.deadline || null,
          priority: todo.priority || 'flexible',
          time_group: todo.time_group || 'someday',
          notes: todo.notes || null,
          source: 'chat'
        };

        console.log('[Message API] Inserting todo with data:', insertData);

        const { data, error } = await supabase
          .from('todos')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('[Message API] Todo insert error:', error);
          throw error;
        }

        console.log('[Message API] Successfully created todo:', data);
        if (data) createdTodos.push(data);
      } catch (err) {
        console.error('[Message API] Failed to create todo:', err.message, todo);
      }
    }

    console.log(`[Message API] Total todos created: ${createdTodos.length}`);

    // Handle profile save (user confirmed)
    let profileUpdated = false;
    if (parsed.profile_save && userId) {
      console.log('[Message API] Saving profile update:', parsed.profile_save);

      try {
        // Get current profile
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        const update = parsed.profile_save;
        const merged = {
          user_id: userId,
          patterns: [...(currentProfile?.patterns || []), ...(update.patterns || [])],
          key_people: [...(currentProfile?.key_people || []), ...(update.key_people || [])],
          priorities: [...(currentProfile?.priorities || []), ...(update.priorities || [])],
          notes: update.notes_append
            ? (currentProfile?.notes || '') + '\n\n' + update.notes_append
            : currentProfile?.notes || null,
          name: currentProfile?.name || null,
          red_flags: currentProfile?.red_flags || []
        };

        // Upsert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(merged, { onConflict: 'user_id' });

        if (profileError) {
          console.error('[Message API] Profile save error:', profileError);
        } else {
          profileUpdated = true;
          console.log('[Message API] Profile updated successfully');
        }
      } catch (err) {
        console.error('[Message API] Failed to save profile:', err);
      }
    } else if (parsed.profile_save && !userId) {
      console.warn('[Message API] Cannot save profile - user not logged in');
    }

    // Save assistant message (store the reply, not raw JSON)
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        role: 'assistant',
        content: parsed.reply
      });

    if (msgError) {
      console.error('Failed to save message:', msgError);
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // Return to frontend
    return res.status(200).json({
      reply: parsed.reply,
      eventsCreated: createdEvents.length,
      todosCreated: createdTodos.length,
      eventIds: createdEvents.map(e => e.id),
      todoIds: createdTodos.map(t => t.id),
      profileUpdated: profileUpdated,
      profilePending: !!parsed.profile_suggestion
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
4. Show ✓ for items you have enough info to create
5. Ask about items missing critical info
6. Confirm priorities at the end

## ITEM TYPES

**EVENT** = time holder (blocks calendar time)
- REQUIRES date AND time to create
- Examples: meetings, appointments, dentist, dinner reservations
- If missing time → ask, don't create yet

**TODO** = task to accomplish
- Date/time optional
- Examples: call mom, finish report, pay bills
- Can create even without specific time

## PRIORITY LEVELS

🔴 **Non-negotiable**: Can't miss. Hard deadline, someone waiting, consequences.
🟡 **Important**: Should do. Soft deadline, matters but flexible.
🟢 **Flexible**: Whenever. User said "not urgent" or no pressure mentioned.

## TIME GROUPS

- **Today**: happening/due today
- **Tomorrow**: happening/due tomorrow
- **This Week**: next 7 days
- **Future**: specific date beyond this week
- **Someday**: no date, do whenever

## RESPONSE FORMAT

Organize items by time, show priority icons, mark ✓ for items you're creating:

\`\`\`
Got it! Here's your brain dump organized:

TODAY
   🔴 [Item] — [time] ✓
   🟡 [Item] ✓

THIS WEEK
   🔴 [Item] — [day] ✓
   🟡 [Item] — [day] (what time?)

SOMEDAY
   🟢 [Item] ✓

Did I get the priorities right?
\`\`\`

## RULES

1. **Always respond with full organized breakdown** — never truncate
2. **Events need time** — if missing, show item but ask, don't put in events array
3. **Todos are flexible** — create even without time
4. **✓ = creating it** — only show ✓ for items in your events/todos arrays
5. **Ask at end**: "Did I get the priorities right?"
6. **Be warm, not robotic** — conversational tone

## PRIORITY SIGNALS

🔴 signals: "can't miss", "due", deadline with consequences, someone waiting
🟡 signals: scheduled with others, soft deadline, "should"
🟢 signals: "not urgent", "at some point", "whenever", no deadline

## PROFILE LEARNING

When user asks to "remember this", "add to my profile", "save this for later", or shares recurring context:

### Step 1: Suggest (don't save yet)
- Acknowledge: "I'll remember this!"
- Show EXACTLY what you'll save, formatted clearly
- Ask: "Does this look right?" or "Save this?"
- Include \`profile_suggestion\` in your JSON (data only, not saved yet)

### Step 2: Wait for confirmation
User might say: "yep", "yes", "looks good", "save it", "perfect", "do it"
User might correct: "actually change X to Y"
User might abandon: ask about something else entirely

### Step 3a: If confirmed
- Say: "✓ Saved to your profile!"
- Include \`profile_save\` in your JSON (this triggers the actual save)

### Step 3b: If corrected
- Update your suggestion
- Show the corrected version
- Ask again: "Save this?"
- Include updated \`profile_suggestion\`

### Step 3c: If abandoned
- Drop it, answer their new question
- Don't include profile_suggestion or profile_save

### What to save
Structure the data to match these profile fields:
- **patterns**: Behavioral patterns ["Morning person", "Volunteers on Sundays"]
- **key_people**: Important people [{"name": "Sarah", "relationship": "partner"}]
- **priorities**: Life priorities ["Family time", "Exercise"]
- **notes_append**: Free-form context to ADD to existing notes (don't replace)

## OUTPUT FORMAT

Respond with valid JSON only. No markdown code blocks, just raw JSON:

{
  "reply": "Your full conversational response here with the organized brain dump, ✓ marks, questions, priority confirmation",
  "events": [
    {
      "title": "Event name",
      "date": "YYYY-MM-DD",
      "time": "HH:MM (24-hour)",
      "end_time": "HH:MM or null",
      "priority": "non_negotiable|important|flexible",
      "notes": "optional"
    }
  ],
  "todos": [
    {
      "title": "Task name",
      "scheduled_date": "YYYY-MM-DD or null",
      "scheduled_time": "HH:MM or null",
      "deadline": "YYYY-MM-DD or null",
      "priority": "non_negotiable|important|flexible",
      "time_group": "today|tomorrow|this_week|future|someday",
      "notes": "optional"
    }
  ],
  "profile_suggestion": {
    "patterns": ["array of patterns to add"],
    "key_people": [{"name": "...", "relationship": "..."}],
    "priorities": ["array of priorities"],
    "notes_append": "text to append to notes"
  },
  "profile_save": {
    "patterns": ["same structure as above"],
    "key_people": [{"name": "...", "relationship": "..."}],
    "priorities": ["array of priorities"],
    "notes_append": "text to append to notes"
  }
}

**Critical:**
- "reply" is REQUIRED and should be your FULL response (not truncated)
- Only put items in "events" array if you have BOTH date AND time
- Put tasks in "todos" array even without scheduled time
- Empty arrays are fine: "events": [], "todos": []
- Items you're asking about should NOT be in the arrays yet
- "profile_suggestion" — include when PROPOSING a save (waiting for confirmation)
- "profile_save" — include when user CONFIRMED (triggers database write)
- Never include both profile_suggestion and profile_save in same response`;

  if (profile) {
    prompt += `

---

## USER PROFILE

${profile}

Use this to recognize key people, watch for their patterns, and personalize priorities.`;
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
