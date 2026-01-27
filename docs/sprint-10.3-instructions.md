# Sprint 10.3: Event Creation in Message Handler

## Context

Part of Sprint 10: Capture-First Chat Flow. This sprint adds actual event creation when the AI captures something with `commit: "immediate"`.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

When the AI returns `commit: "immediate"` with captured data, actually create the event in Supabase.

---

## File

`api/conversation/[id]/message.js`

---

## Changes

### Step 1: Find the response parsing section

Look for where `parsed` is set after the Claude API call. It should look something like:

```javascript
// Parse response
let parsed;
try {
  // ... JSON parsing logic
  parsed = JSON.parse(jsonStr);
} catch {
  parsed = { reply: assistantMessage, phase: 'unknown' };
}
```

### Step 2: Add event creation after parsing, before returning

Insert this block after the parsing and before the `return res.status(200).json(...)`:

```javascript
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
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: title,
          start_date: date,
          start_time: time || null,
          end_time: endTime || null,
          location: location || null,
          notes: notes || null,
          source: 'chat',
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
```

### Step 3: Update the return statement

Find the existing return and update it to include event info:

```javascript
return res.status(200).json({
  reply: parsed.reply,
  phase: parsed.phase || 'capture',
  commit: parsed.commit || null,
  captured: parsed.captured || null,
  eventId: createdEvent?.id || null,
  eventCreated: !!createdEvent
});
```

---

## Commit Message

```bash
git add api/conversation/[id]/message.js
git commit -m "feat: create events from chat captures (Sprint 10.3)

- Handle commit: immediate to create events
- Link events to conversation via conversation_id
- Set source: 'chat' for tracking
- Return eventId and eventCreated to frontend
- Stub in place for pending/update/finalize (future)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Next Step

After completing this sprint, proceed to Sprint 10.4: UI Calendar Refresh.
