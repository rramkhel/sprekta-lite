# Sprint 12: Brain Dump → Organized Calendar & Todos

## Context

The chat currently uses a capture-first prompt that creates events immediately. But users often dump mixed content - events, todos, deadlines, tasks - all at once. The AI needs to **organize by time and priority** to help users see what matters.

This sprint rewrites the chat behavior to handle brain dumps intelligently: parse everything, organize by time (today/tomorrow/this week/future/someday), mark priority (🔴🟡🟢), ask clarifying questions, and confirm priorities at the end.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Sprint Overview

| Sub-Sprint | Goal | Files |
|------------|------|-------|
| 12.1 | Database: Create todos table | `supabase/migrations/012_todos.sql` |
| 12.2 | System prompt: Brain dump logic | `api/conversation/[id]/message.js` |
| 12.3 | Tool definitions + execution | `api/conversation/[id]/message.js` |
| 12.4 | Todo display (minimal) | `js/todos-ui.js`, `index.html`, `style.css` |
| 12.5 | Testing scenarios | Manual testing |

---

## Key Concepts

### Two Item Types

**EVENT** = time holder (blocks time to BE somewhere)
- The time slot itself is the commitment
- REQUIRES date + time — if time is missing, ask before creating
- Examples: meetings, appointments, classes, group sessions
- Goes on calendar only
- Use: `create_event` tool

**TODO** = something to accomplish (GET SOMETHING DONE)
- The goal is completing a task
- Time is optional:
  - With scheduled time → todo list AND calendar
  - Without time → todo list only
- Can have a deadline (due by) separate from scheduled time
- Examples: calls, tasks, things to finish, bills to pay
- Use: `create_todo` tool

**Decision:** "BE there at this time" → Event. "GET THIS DONE" → Todo.

### Two Dimensions

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

---

## Response Format Example

```
Got it! Here's your brain dump organized:

TODAY
   🔴 Bible study — 7-9pm ✓
   🟡 Finish RentSync landlord login — for Lilian meeting 9am ✓

TOMORROW
   🔴 Lilian refinement meeting — 9am ✓
   🟡 RealRoots networking — 6:30-9pm ✓

THIS WEEK
   🔴 Conner's bday flowers — Jan 15, 9am-12pm ✓
   🟡 Text Conner Sonnet 116 — Jan 15 morning ✓

SOMEDAY
   🟢 Finish Sprekta budget ✓
   🟢 Reschedule dinner with Aly ✓

—

📝 Need a bit more info:
   • "Refinement tomorrow AM" — What time does refinement start?

—

Did I get the priorities right? Anything else that's actually non-negotiable?
```

---

# Sprint 12.1: Database — Todos Table

## Goal

Create the todos table to store tasks separately from calendar events.

## Migration: `supabase/migrations/012_todos.sql`

```sql
-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  session_id TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Core fields
  title TEXT NOT NULL,
  notes TEXT,

  -- Time (optional - if set, also shows on calendar)
  scheduled_date DATE,
  scheduled_time TIME,

  -- Deadline (different from scheduled - this is "due by")
  deadline DATE,
  deadline_time TIME,

  -- Priority: non_negotiable, important, flexible
  priority TEXT DEFAULT 'flexible'
    CHECK (priority IN ('non_negotiable', 'important', 'flexible')),

  -- Time group: today, tomorrow, this_week, future, someday
  time_group TEXT DEFAULT 'someday'
    CHECK (time_group IN ('today', 'tomorrow', 'this_week', 'future', 'someday')),

  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Metadata
  source TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_session_id ON todos(session_id);
CREATE INDEX idx_todos_time_group ON todos(time_group);
CREATE INDEX idx_todos_completed ON todos(completed);

-- RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can create todos" ON todos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Updated_at trigger
CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Verification

```sql
\d todos
SELECT * FROM todos LIMIT 1;
```

---

# Sprint 12.2: System Prompt — Brain Dump Logic

## Goal

Rewrite the system prompt to handle brain dumps with the organize → prioritize → ask → confirm flow.

## File: `api/conversation/[id]/message.js`

Replace `buildSystemPrompt()` with:

```javascript
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

Your response is conversational text. After deciding what to create, use tools silently, then show the organized summary.

For each item you create, call the appropriate tool (create_event or create_todo).

Respond with JSON only when tool calls are needed:
{
  "reply": "Your organized text response here",
  "tool_calls": [
    {"tool": "create_event", "params": {...}},
    {"tool": "create_todo", "params": {...}}
  ]
}`;

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
```

---

# Sprint 12.3: Tool Definitions + Execution

## Goal

Add tool definitions and handle tool execution in the message handler.

## File: `api/conversation/[id]/message.js`

### Step 1: Add tools array

```javascript
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
```

### Step 2: Add tool execution handler

```javascript
async function executeToolCalls(toolCalls, context) {
  const results = [];

  for (const call of toolCalls) {
    try {
      if (call.tool === 'create_event') {
        const { data, error } = await supabase
          .from('events')
          .insert({
            title: call.params.title,
            start_date: call.params.date,
            start_time: call.params.time,
            end_time: call.params.end_time || null,
            priority: call.params.priority,
            notes: call.params.notes || null,
            user_id: context.userId || null,
            session_id: context.sessionId || null,
            conversation_id: context.conversationId,
            source: 'chat'
          })
          .select()
          .single();

        if (error) throw error;
        results.push({ tool: 'create_event', success: true, id: data.id });

      } else if (call.tool === 'create_todo') {
        const { data, error } = await supabase
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
        results.push({ tool: 'create_todo', success: true, id: data.id });
      }
    } catch (err) {
      console.error(`Tool execution error (${call.tool}):`, err);
      results.push({ tool: call.tool, success: false, error: err.message });
    }
  }

  return results;
}
```

### Step 3: Update Claude API call

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: buildSystemPrompt(profileText),
  tools: TOOLS,
  messages: conversationMessages
});

// Handle tool use
if (response.stop_reason === 'tool_use') {
  const toolCalls = response.content
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      tool: block.name,
      params: block.input
    }));

  const results = await executeToolCalls(toolCalls, {
    userId,
    sessionId,
    conversationId
  });

  // Continue conversation with tool results if needed
  // ... or just return the text response
}

// Extract text response
const textContent = response.content
  .filter(block => block.type === 'text')
  .map(block => block.text)
  .join('\n');
```

---

# Sprint 12.4: Todo Display (Minimal)

## Goal

Simple todo list display so users can see their todos. Keep it minimal — just a list.

## Files

- `js/todos-ui.js` (new)
- `api/todos/index.js` (new)
- `index.html` (add container)
- `style.css` (add styles)

See Sprint 12.4 instructions for detailed implementation.

---

# Sprint 12.5: Testing Scenarios

## Test 1: Basic Brain Dump

**Input:**
```
dentist wednesday 2pm
call mom
finish report by friday
bible study tonight 7-9pm
```

**Expected:**
- Bible study → Event, today, created ✓
- Dentist → Event, this week, created ✓
- Finish report → Todo, this week, deadline friday, created ✓
- Call mom → Todo, someday, created ✓
- Asks: "Did I get priorities right?"

---

## Test 2: Missing Time for Event

**Input:**
```
meeting with sarah tomorrow
realroots tuesday
```

**Expected:**
- Both in "Need more info" section
- Asks: "What time is the meeting with Sarah?" and "What time is RealRoots?"

---

## Test 3: Priority Detection

**Input:**
```
visa bill due next friday - can't miss
pick up dry cleaning (not urgent)
prep for lilian meeting tomorrow 9am
```

**Expected:**
- Visa bill → 🔴 non-negotiable
- Dry cleaning → 🟢 flexible, someday
- Lilian prep → 🔴 non-negotiable (external person waiting)

---

## Test 4: Complex Dump

**Input:**
```
i have to reschedule my dinner with aly - she was busy with bridesmaids stuff

rentsync - need to finish landlord login by 9am tomorrow for lilian meeting. also need to prep for refinement tomorrow AM.

bible study tonight 7-9pm

realroots tuesday 6:30-9pm

conner's bday jan 15 - flowers arriving 9am-12pm, text him sonnet 116 morning of

need to finish sprekta budget (not urgent)
```

**Expected:**
- Organized by time: TODAY → TOMORROW → THIS WEEK → SOMEDAY
- Priorities detected: bible study 🔴, landlord login 🔴, realroots 🟡, sprekta budget 🟢
- Asks about refinement time
- Confirms priorities at end

---

## Verification Checklist

Before marking Sprint 12 complete:

- [ ] Supabase: `todos` table created with all fields
- [ ] API: New system prompt deployed
- [ ] API: Tool definitions added
- [ ] API: Tool execution handler working
- [ ] UI: Todo list displays
- [ ] Test 1 passes (basic brain dump)
- [ ] Test 2 passes (missing time)
- [ ] Test 3 passes (priority detection)
- [ ] Test 4 passes (complex dump)

---

## Commit Messages

```bash
# After 12.1
git add supabase/migrations/012_todos.sql
git commit -m "chore(db): create todos table

- Add todos table with priority and time_group fields
- Support scheduled time and deadline separately
- RLS policies for user/session access

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# After 12.2
git add api/conversation/[id]/message.js
git commit -m "feat: brain dump system prompt

- Organize by time (today/tomorrow/this week/future/someday)
- Mark priority (non-negotiable/important/flexible)
- Ask clarifying questions, confirm priorities
- Distinguish events (time holders) from todos (tasks)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# After 12.3
git add api/conversation/[id]/message.js
git commit -m "feat: add tool execution for events and todos

- create_event tool for time holders
- create_todo tool for tasks
- Tool execution handler with error handling

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# After 12.4
git add js/todos-ui.js api/todos/index.js index.html style.css
git commit -m "feat: minimal todo list display

- TodosUI for displaying grouped todos
- /api/todos endpoint for fetching
- Group by time_group, show priority icons

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Final
git push
```

---

## Rollback Plan

If issues arise:

```bash
# Revert to before Sprint 12
git revert HEAD~4

# Or drop todos table if needed
DROP TABLE IF EXISTS todos;
```

---

## Files to Delete (Old Sprint 12)

Remove these artifacts from the failed Sprint 12 (if they exist):
- `js/confirm-ui.js`
- `lib/schemas/item.js`
- `lib/schemas/analysis-plan.js`
- `lib/schemas/execution-request.js`
- `lib/prompts/analysis.js`
- `api/chat/analyze.js`
- `api/chat/execute.js`
- Any confirm-modal styles in `style.css`
