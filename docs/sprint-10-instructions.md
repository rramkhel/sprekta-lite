# Sprint 10: Capture-First Chat Flow

## Context

The chat currently uses a planning-focused prompt that organizes and analyzes everything the user says. But for quick dumps, users just want to **get it out of their head** - capture it, confirm it, move on.

This sprint rewrites the chat behavior to be capture-first: confirm immediately, offer helpful questions, let the user control the pace.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Sprint Overview

| Sub-Sprint | Goal | Files |
|------------|------|-------|
| 10.1 | Database: Link events to conversations | Supabase migration |
| 10.2 | System prompt: Capture-first behavior | `api/conversation/[id]/message.js` |
| 10.3 | Event creation: Actually save to calendar | `api/conversation/[id]/message.js` |
| 10.4 | UI: Refresh calendar when events created | `js/triage-ui.js` |
| 10.5 | Testing: Verify all scenarios | Manual testing |

---

# Sprint 10.1: Database Schema Update

## Goal

Add `conversation_id` to the events table so we can track which conversation created each event.

## Migration

Run this in Supabase SQL Editor:

```sql
-- Add conversation_id to events table
ALTER TABLE events 
ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX idx_events_conversation_id ON events(conversation_id);

-- Comment for documentation
COMMENT ON COLUMN events.conversation_id IS 'Links event to the chat conversation that created it';
```

## Verification

After running, check the events table structure in Supabase dashboard. The `conversation_id` column should appear as a nullable UUID.

---

# Sprint 10.2: Capture-First System Prompt

## Goal

Rewrite `buildSystemPrompt()` so the AI confirms captures immediately and offers questions without demanding answers.

## File

`api/conversation/[id]/message.js`

## Changes

Replace the entire `buildSystemPrompt()` function with:

```javascript
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

**Line 1: Confirmation**
Brief, warm confirmation of what was captured. Include: title, date/time, location if mentioned.
Examples:
- "Got it - added RealRoots networking tonight (6:15-9pm @ Chianti's)."
- "Added dentist appointment Wednesday at 2pm."
- "Captured Q1 report deadline for Friday."

**Lines 2-4: Contextual Questions (2-3 max)**
Based on what's MISSING or what the EVENT TYPE implies. Format as a short list with bullet points.

Choose questions based on:
- **Missing time?** → "What time works for this?"
- **Missing date?** → "When is this happening?"
- **Missing location?** → "Where is this happening?"
- **Evening event + coming from work?** → "How are you getting there?"
- **Event with others?** → "Anyone else joining?"
- **Deadline/task?** → "How much time do you need for this?"
- **Trip/travel?** → "Anything you need to prep beforehand?"
- **Event that needs prep?** → "Should I block time before for prep/travel?"

Don't ask about things they already told you.

**Line 5: Open Close**
A natural transition that invites more input without demanding it.

Good examples:
- "Or if there's more on your mind, I'm listening."
- "What else is floating around?"
- "Anything else competing for your attention?"
- "I'm here if there's more."

Bad examples (avoid):
- "Tell me something else" (robotic)
- "What else do you need to plan?" (formal)
- "Is there anything else I can help with?" (customer-service)

## HANDLING FOLLOW-UPS

**If user answers a question:**
- Acknowledge briefly ("Got it, driving.")
- Update the event if relevant
- Offer 1-2 more relevant questions OR confirm complete
- Keep it tight - 2-3 sentences max
- Use commit: "update" if modifying the previous event

**If user dumps another item instead of answering:**
- That's fine! They're controlling the pace
- Capture the new item
- Confirm it
- Offer new questions for THAT item
- Don't nag about unanswered questions

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

For multiple items, create events for items with enough info (at least title + date). Items missing critical info should be mentioned but not created yet.

## WHAT NOT TO DO

❌ Don't analyze logistics unprompted ("Your window is between leaving office and 6:15pm...")
❌ Don't organize their thoughts into categories and structures
❌ Don't ask multiple questions in a row without confirming first
❌ Don't interrogate - questions are offers
❌ Don't over-explain or be verbose
❌ Don't use formal/corporate language
❌ Don't repeat back everything they said in detail
❌ Don't say "I've added" if you're not sure about date/time - say "Captured" instead

## OUTPUT FORMAT

Respond with valid JSON only (no markdown code blocks):
{
  "reply": "Your response text here",
  "phase": "capture|clarify|complete",
  "commit": "immediate|pending|update|finalize|null",
  "captured": {
    "title": "Event title",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM (24-hour) or null",
    "endTime": "HH:MM (24-hour) or null",
    "location": "Location or null",
    "notes": "Any additional details mentioned"
  }
}

**COMMIT VALUES:**
- "immediate" → Create the event now. Use for clear, complete-enough captures.
- "pending" → Don't create yet. Use when user explicitly wants to plan/discuss before committing.
- "update" → User refined a previous capture. Update that event.
- "finalize" → Planning done, create all pending items.
- null → Just chatting, no calendar action needed.

**DEFAULT BEHAVIOR:** Use "immediate" for most captures. If user gives you a title and at least a date OR time, commit it. Better to create and refine than to hold everything in limbo.

**CAPTURED OBJECT:** Include this whenever you identify event information, even if incomplete. Set null for missing fields - don't guess or make up times.

**MULTIPLE ITEMS:** When user dumps multiple items, return captured for the FIRST item only. Mention the others in your reply and the system will handle subsequent messages.`;

  if (profile) {
    prompt += `

---

## USER PROFILE

Use this context to personalize. Reference their patterns, protect their priorities, anticipate based on what you know.

${profile}`;
  }

  return prompt;
}
```

---

# Sprint 10.3: Event Creation in Message Handler

## Goal

When the AI returns `commit: "immediate"` with captured data, actually create the event in Supabase.

## File

`api/conversation/[id]/message.js`

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

# Sprint 10.4: UI Calendar Refresh

## Goal

When the chat creates an event, refresh the calendar so the user sees it appear.

## File

`js/triage-ui.js`

## Changes

### Step 1: Find where API response is handled

Look for the `sendMessage` or `handleSend` function. There should be a section that processes the API response:

```javascript
const data = await response.json();
// or
const result = await TriageState.sendMessage(content);
```

### Step 2: Add calendar refresh after successful response

After the response is processed and messages are rendered, add:

```javascript
// Refresh calendar if an event was created
if (data.eventCreated || data.eventId) {
  // Trigger calendar refresh
  if (window.Calendar && typeof window.Calendar.loadEvents === 'function') {
    window.Calendar.loadEvents();
  }
  // Also dispatch event for any other listeners
  window.dispatchEvent(new CustomEvent('eventsChanged', { 
    detail: { eventId: data.eventId, source: 'chat' }
  }));
}
```

### Step 3: Verify Calendar.loadEvents exists

Check `js/calendar.js` or wherever the calendar is defined. Make sure there's a `loadEvents()` method that fetches events from Supabase. If it's named differently (like `refresh()` or `fetchEvents()`), use that name instead.

---

# Sprint 10.5: Testing

## Test Scenarios

After deploying all changes, test these scenarios:

### Test 1: Simple Single Capture
**Input:** 
> dentist wednesday 2pm

**Expected behavior:**
- ✅ AI confirms: "Got it - added dentist Wednesday at 2pm."
- ✅ AI offers 2-3 questions (location? anything to prep?)
- ✅ Event appears on calendar immediately
- ✅ Event has `source: 'chat'` and `conversation_id` set

### Test 2: Capture with Details
**Input:**
> realroots networking event tonight 6:15-9pm at chianti's on whyte ave, leaving from office

**Expected behavior:**
- ✅ AI confirms with all details
- ✅ AI offers relevant questions (transportation? block travel time?)
- ✅ Event created with title, date, start_time, end_time, location
- ✅ Notes include "leaving from office"

### Test 3: Rapid Fire Dumping
**Input 1:** 
> dentist wednesday 2pm

**Input 2:** (without answering questions)
> also Q1 report due friday

**Input 3:**
> and coffee with Sarah monday morning

**Expected behavior:**
- ✅ Each gets its own confirmation
- ✅ Each creates a separate event
- ✅ AI doesn't nag about unanswered questions
- ✅ Calendar shows all three events

### Test 4: Incomplete Capture
**Input:**
> need to call mom sometime this week

**Expected behavior:**
- ✅ AI says "Captured" (not "Added") since no specific date/time
- ✅ AI asks when specifically
- ✅ `commit` should be "immediate" but event might not be created (no date)
- ✅ OR event created with title only, on today's date - verify which behavior makes sense

### Test 5: Answering Questions
**Input 1:**
> meeting with Sarah tomorrow

**AI responds with questions about time/location**

**Input 2:**
> 10am at the coffee shop on 4th

**Expected behavior:**
- ✅ AI acknowledges briefly
- ✅ Original event is updated (or new event created with full info)
- ✅ Calendar reflects the update

### Test 6: Multi-Item Dump
**Input:**
> okay I've got a bunch - realroots tonight 6pm, dentist wed 2pm, Q1 doc due friday

**Expected behavior:**
- ✅ AI lists all three in confirmation
- ✅ First event (realroots) created immediately
- ✅ AI offers to flesh out any of them
- ✅ Subsequent items can be captured in follow-up messages

---

## Verification Checklist

Before marking Sprint 10 complete:

- [ ] Supabase: `events` table has `conversation_id` column
- [ ] API: New system prompt deployed
- [ ] API: Event creation code added to message handler
- [ ] UI: Calendar refreshes when event created
- [ ] Test 1 passes (simple capture)
- [ ] Test 2 passes (capture with details)
- [ ] Test 3 passes (rapid fire)
- [ ] Test 5 passes (answering questions)
- [ ] Events in database have correct `source` and `conversation_id`

---

## Commit Messages

```bash
# After 10.1
git add -A
git commit -m "chore(db): add conversation_id to events table"

# After 10.2
git add api/conversation/[id]/message.js
git commit -m "feat: capture-first system prompt

- AI confirms immediately, offers questions without demanding
- New commit field architecture (immediate/pending/update/finalize)
- User controls pace - can answer, ignore, or dump more"

# After 10.3
git add api/conversation/[id]/message.js
git commit -m "feat: create events from chat captures

- Handle commit: immediate to create events
- Link events to conversation via conversation_id
- Stub in place for pending/update/finalize (future)"

# After 10.4
git add js/triage-ui.js
git commit -m "feat: refresh calendar when chat creates events"

# Final
git push
```

---

## Future Sprints (Not Now)

**Sprint 11: Update existing events**
- Handle `commit: "update"` 
- Track eventId in conversation state
- Allow refinement of captured events

**Sprint 12: Planning mode**
- Handle `commit: "pending"` 
- Store pending items in conversation state
- Handle `commit: "finalize"` to bulk create

**Sprint 13: Multi-item captures**
- Support `captured` as array
- Create multiple events in one commit
