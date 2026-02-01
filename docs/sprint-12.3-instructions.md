# Sprint 12.3: Tool Definitions + Execution

## Context

Part of Sprint 12: Brain Dump → Organized Calendar & Todos. This sprint adds tool definitions for creating events and todos, and handles tool execution.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

Add Anthropic tool calling to:
1. Define `create_event` and `create_todo` tools
2. Handle tool execution to create items in database
3. Return tool results to Claude for conversation continuity

---

## File

`api/conversation/[id]/message.js`

---

## Changes

### Step 1: Add Tools Array

Add this constant near the top of the file (after imports):

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

### Step 2: Add Tool Execution Handler

Add this function before the main handler:

```javascript
async function executeToolCalls(toolCalls, context) {
  const results = [];

  for (const call of toolCalls) {
    try {
      if (call.tool === 'create_event') {
        const { data, error } = await context.supabase
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
```

### Step 3: Update Claude API Call

Find the Claude API call (should look like `anthropic.messages.create(...)`) and update it to include tools:

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: buildSystemPrompt(profileText),
  tools: TOOLS,  // Add this line
  messages: conversationMessages
});
```

### Step 4: Handle Tool Use in Response

After the API call, add tool handling logic:

```javascript
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
const textContent = response.content
  .filter(block => block.type === 'text')
  .map(block => block.text)
  .join('\n');
```

### Step 5: Update Response Object

Update the final response to include tool execution info:

```javascript
return res.status(200).json({
  reply: textContent,
  toolsExecuted: toolResults.length > 0,
  toolResults: toolResults,
  eventIds: toolResults.filter(r => r.tool === 'create_event' && r.success).map(r => r.id),
  todoIds: toolResults.filter(r => r.tool === 'create_todo' && r.success).map(r => r.id)
});
```

---

## Testing

After deploying, test tool execution:

### Test 1: Simple Event Creation
**Input:**
```
dentist wednesday 2pm
```

**Expected:**
- Claude calls `create_event` tool
- Event created in database
- Response includes `eventIds: [...]`

**Verify in Supabase:**
```sql
SELECT * FROM events WHERE source = 'chat' ORDER BY created_at DESC LIMIT 1;
```

### Test 2: Simple Todo Creation
**Input:**
```
call mom
```

**Expected:**
- Claude calls `create_todo` tool
- Todo created with `time_group: 'someday'`
- Response includes `todoIds: [...]`

**Verify in Supabase:**
```sql
SELECT * FROM todos WHERE source = 'chat' ORDER BY created_at DESC LIMIT 1;
```

### Test 3: Mixed Creation
**Input:**
```
meeting tomorrow 3pm
finish report by friday
```

**Expected:**
- Claude calls both `create_event` and `create_todo`
- Response includes both `eventIds` and `todoIds`

**Verify in Supabase:**
```sql
SELECT 'event' as type, title, created_at FROM events WHERE source = 'chat'
UNION ALL
SELECT 'todo' as type, title, created_at FROM todos WHERE source = 'chat'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Debugging

If tools aren't being called:

1. **Check console logs** - Look for "Tool execution results:" in Vercel logs
2. **Verify tool definitions** - Make sure they're passed to Claude API
3. **Check response structure** - Log `response.content` to see if tool_use blocks are present
4. **Validate schema** - Ensure input_schema matches what Claude is trying to call

Common issues:
- Missing required fields in schema
- Enum values not matching
- Tool description too vague
- System prompt conflicting with tool usage

---

## Commit Message

```bash
git add api/conversation/[id]/message.js
git commit -m "feat: add tool execution for events and todos

- create_event tool for time holders (meetings, appointments)
- create_todo tool for tasks (with optional scheduled time)
- Tool execution handler with error handling
- Return tool results in API response

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Next Step

After completing this sprint, proceed to Sprint 12.4: Todo Display (Minimal).
