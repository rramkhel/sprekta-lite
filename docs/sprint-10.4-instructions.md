# Sprint 10.4: UI Calendar Refresh

## Context

Part of Sprint 10: Capture-First Chat Flow. This sprint adds calendar refresh when the chat creates an event, so the user sees it appear immediately.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

When the chat creates an event, refresh the calendar so the user sees it appear.

---

## File

`js/triage-ui.js`

---

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
  if (window.renderCalendar && typeof window.renderCalendar === 'function') {
    window.renderCalendar();
  }
  // Also dispatch event for any other listeners
  window.dispatchEvent(new CustomEvent('eventsChanged', {
    detail: { eventId: data.eventId, source: 'chat' }
  }));
}
```

### Step 3: Verify calendar refresh function exists

Check `app.js` or wherever the calendar is defined. Make sure there's a `window.renderCalendar()` method that fetches events from Supabase. If it's named differently (like `refresh()` or `fetchEvents()`), use that name instead.

---

## Alternative Implementation

If `TriageState.sendMessage()` doesn't return the full response, you may need to update `js/triage-state.js` instead:

```javascript
// In triage-state.js, in the sendMessage function
const data = await response.json();

// Add assistant message
const assistantMessage = {
  role: 'assistant',
  content: data.reply,
  phase: data.phase,
  created_at: new Date().toISOString()
};
this.messages.push(assistantMessage);

// If event was created, refresh calendar
if (data.eventCreated && window.renderCalendar) {
  window.renderCalendar();
}

return assistantMessage;
```

---

## Commit Message

```bash
git add js/triage-ui.js js/triage-state.js
git commit -m "feat: refresh calendar when chat creates events (Sprint 10.4)

- Detect when API returns eventCreated flag
- Call window.renderCalendar() to refresh
- Dispatch eventsChanged event for other listeners
- Events now appear immediately after chat capture

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Next Step

After completing this sprint, proceed to Sprint 10.5: Testing.
