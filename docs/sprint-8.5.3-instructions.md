```
Perfect! I've successfully completed Sprint 8.5.3: Resolve Flow. Here's what was implemented:

  Changes Made:

  1. Enhanced js/triage-panel.js

  - Updated resolve button handler to call openResolveChat() instead of just logging
  - Added buildResolvePrompt() method that generates contextual AI prompts based on what's missing:
    - No date/time: "Let's figure out when to schedule..."
    - Has date, no time: "...is set for [date], but doesn't have a time yet"
    - Has time, no date: "...is set for [time], but doesn't have a date"
    - Has both: "Let's make sure ... is set up correctly"
  - Improved openResolveChat() to:
    - Find events across all buckets (not just undetermined)
    - Build contextual prompt
    - Dispatch custom event for ChatUI to handle
    - Open chat panel

  2. Enhanced js/triage-ui.js (ChatUI)

  - Added resolve context tracking with resolveContext property
  - Added event listener for 'open-resolve-chat' in init()
  - New methods:
    - openWithContext() - Opens chat with pre-loaded context
    - renderResolveMode() - Renders resolve-specific UI
    - addMessage() - Dynamically adds messages to chat
    - handleResolveResponse() - Handles user response in resolve mode
    - applyEventUpdates() - Updates event via API
    - getAuthHeaders() - Gets auth headers for API requests
    - clearMessages(), focusInput() - Helper utilities
  - Updated handleSend() to check for resolve mode and route accordingly

  3. Created /api/resolve.js

  - New serverless endpoint using Claude Haiku
  - Accepts: event_id, current_event, user_message
  - Uses AI to extract date/time from natural language
  - Returns structured JSON:
    - reply - Conversational response
    - resolved - Boolean indicating if enough info was provided
    - updates - Object with date/time in structured format
  - Handles edge cases like ambiguous input

  4. Updated /api/events.js

  - Added PATCH method support for partial updates (in addition to existing PUT)
  - Allows updating individual fields without overwriting others

  How It Works:

  User Flow:
  1. User clicks [◉] button on an undetermined event in triage panel
  2. Chat panel opens with contextual prompt: "Let's figure out when to schedule 'dentist'..."
  3. User types natural language: "Tuesday at 3pm"
  4. AI extracts structured data (date: next Tuesday, time: "15:00")
  5. Event is updated in database with needsTriage: false
  6. Triage panel refreshes automatically
  7. Success message: "✓ Updated! The event is now on your calendar."
  8. Event moves from "Undetermined" to appropriate bucket

  Features:
  - ✅ Contextual AI prompts based on what's missing
  - ✅ Natural language time parsing ("3pm" → "15:00", "Tuesday" → actual date)
  - ✅ Iterative conversation if clarification needed
  - ✅ Automatic triage refresh on resolution
  - ✅ Typing indicator while AI responds
  - ✅ Error handling with graceful fallbacks

  Committed: e0d3b20 - "feat: resolve flow for undetermined events (Sprint 8.5.3)"
  Pushed to GitHub: Successfully deployed

  ---
  🎉 Milestone 8.5 is now COMPLETE! All three sprints are done:
  - ✅ Sprint 8.5.1: Triage Panel + Data
  - ✅ Sprint 8.5.2: Triage UI
  - ✅ Sprint 8.5.3: Resolve Flow

  The triage system is fully functional with AI-powered event resolution!
```


---


# Sprint 8.5.3: Resolve Flow

## Sprint Goal

Wire up the [◉] resolve button to open a contextual chat focused on that specific item.

---

## How It Works

1. User clicks [◉] on an undetermined item
2. Chat panel opens (or focuses if already open)
3. AI is pre-loaded with context about that item
4. Conversation helps pin down the missing details
5. Once resolved, event is updated and triage refreshes

---

## Task 1: Add Resolve Handler to Triage Panel

**File:** `js/triage-panel.js` (update)

Replace the placeholder resolve handler in `bindSectionEvents()`:

```javascript
bindSectionEvents() {
  // ... collapsible toggle code stays the same ...

  // Resolve buttons
  this.content.querySelectorAll('.triage-resolve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.resolveId;
      this.openResolveChat(eventId);
    });
  });

  // ... item click code stays the same ...
},

/**
 * Open chat with context about this event
 */
async openResolveChat(eventId) {
  // Find the event in our data
  const buckets = await TriageData.fetchAll();
  const allEvents = [
    ...buckets.today,
    ...buckets.thisWeek,
    ...buckets.later,
    ...buckets.undetermined
  ];
  
  const event = allEvents.find(e => e.id === eventId);
  if (!event) {
    console.error('Event not found:', eventId);
    return;
  }

  // Build context prompt
  const prompt = this.buildResolvePrompt(event);

  // Open chat with this context
  // This dispatches an event that ChatUI picks up
  window.dispatchEvent(new CustomEvent('open-resolve-chat', {
    detail: {
      eventId: event.id,
      eventTitle: event.title,
      prompt: prompt,
      event: event
    }
  }));
},

/**
 * Build the AI prompt for resolving this event
 */
buildResolvePrompt(event) {
  const hasDate = !!event.date;
  const hasTime = !!event.start_time;
  
  if (!hasDate && !hasTime) {
    return `Let's figure out when to schedule "${event.title}".\n\nDo you have a specific day in mind? And what time works?`;
  }
  
  if (hasDate && !hasTime) {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    return `"${event.title}" is set for ${dateStr}, but doesn't have a time yet.\n\nWhat time should I put this down for?`;
  }
  
  // Has time but no date (rare)
  if (!hasDate && hasTime) {
    return `"${event.title}" is set for ${this.formatTime(event.start_time)}, but doesn't have a date.\n\nWhat day should this be?`;
  }

  // Both exist but flagged for triage (some other issue)
  return `Let's make sure "${event.title}" is set up correctly.\n\nCurrently it's ${event.date} at ${event.start_time}. Does that look right?`;
}
```

---

## Task 2: Update ChatUI to Handle Resolve Context

**File:** `js/triage-ui.js` (the existing ChatUI module)

Add a listener for resolve events:

```javascript
// Add to ChatUI.init() or wherever you set up event listeners

init() {
  // ... existing init code ...

  // Listen for resolve requests from triage
  window.addEventListener('open-resolve-chat', (e) => {
    this.openWithContext(e.detail);
  });
},

/**
 * Open chat with pre-loaded context
 */
openWithContext(context) {
  const { eventId, eventTitle, prompt, event } = context;

  // Store context for when user responds
  this.resolveContext = {
    eventId,
    event,
    mode: 'resolve'
  };

  // Open the chat panel if not already open
  this.open();

  // Clear previous conversation (or start fresh thread)
  this.clearMessages();

  // Add the AI's opening message
  this.addMessage('assistant', prompt);

  // Focus the input
  this.focusInput();
},

/**
 * Override or extend handleSend to detect resolve mode
 */
async handleSend(text) {
  if (!text.trim()) return;

  // Add user message to UI
  this.addMessage('user', text);

  // Check if we're in resolve mode
  if (this.resolveContext?.mode === 'resolve') {
    await this.handleResolveResponse(text);
  } else {
    // Normal chat flow
    await this.sendToAPI(text);
  }
},

/**
 * Handle user response in resolve mode
 */
async handleResolveResponse(text) {
  const { eventId, event } = this.resolveContext;

  this.showTyping();

  try {
    // Send to a resolve-specific endpoint (or reuse triage endpoint with context)
    const response = await fetch('/api/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await this.getAuthHeaders()
      },
      body: JSON.stringify({
        event_id: eventId,
        current_event: event,
        user_message: text
      })
    });

    const result = await response.json();
    
    this.hideTyping();

    // AI response
    this.addMessage('assistant', result.reply);

    // If resolved, update the event
    if (result.resolved && result.updates) {
      await this.applyEventUpdates(eventId, result.updates);
      
      // Clear resolve mode
      this.resolveContext = null;
      
      // Refresh triage
      window.TriagePanel?.refresh();

      // Optionally show confirmation
      this.addMessage('assistant', '✓ Updated! The event is now on your calendar.');
    }

  } catch (error) {
    this.hideTyping();
    this.addMessage('assistant', 'Sorry, something went wrong. Can you try again?');
    console.error('Resolve error:', error);
  }
},

/**
 * Apply updates to the event
 */
async applyEventUpdates(eventId, updates) {
  await fetch(`/api/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...await this.getAuthHeaders()
    },
    body: JSON.stringify({
      ...updates,
      needs_triage: false // Clear the flag
    })
  });
}
```

---

## Task 3: Create Resolve API Endpoint

**File:** `api/resolve.js` (NEW)

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event_id, current_event, user_message } = req.body;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const prompt = `You are helping schedule a calendar event.

Today is: ${today}

Current event details:
- Title: "${current_event.title}"
- Date: ${current_event.date || 'not set'}
- Time: ${current_event.start_time || 'not set'}

The user said: "${user_message}"

Your job:
1. Extract any date/time information from what they said
2. If you have enough info to update the event, do so
3. If you need clarification, ask a brief follow-up question

Respond with JSON only:
{
  "reply": "Your conversational response to the user",
  "resolved": true/false,
  "updates": {
    "date": "YYYY-MM-DD or null if not changing",
    "start_time": "HH:MM or null if not changing",
    "end_time": "HH:MM or null"
  }
}

If resolved is false, updates should be null or empty.

Examples:
- User: "Tuesday at 3" → resolved: true, date: next Tuesday, start_time: "15:00"
- User: "sometime next week" → resolved: false, ask which day
- User: "morning" → resolved: false, ask what time specifically
- User: "3pm" (when date already set) → resolved: true, start_time: "15:00"`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;

    // Parse JSON
    let result;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      result = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      // If parsing fails, treat as a conversational response
      result = {
        reply: content,
        resolved: false,
        updates: null
      };
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Resolve API error:', error);
    return res.status(500).json({
      reply: "I'm having trouble processing that. Can you try rephrasing?",
      resolved: false,
      updates: null
    });
  }
}
```

---

## Task 4: Add Helper Methods to ChatUI

Make sure these exist in your ChatUI module:

```javascript
clearMessages() {
  const container = document.getElementById('chat-messages');
  if (container) {
    container.innerHTML = '';
  }
  // Also clear internal state if tracking messages
  this.messages = [];
},

showTyping() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  const typing = document.createElement('div');
  typing.className = 'chat-message chat-message-assistant chat-typing';
  typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  typing.id = 'typing-indicator';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
},

hideTyping() {
  document.getElementById('typing-indicator')?.remove();
},

focusInput() {
  document.getElementById('chat-input')?.focus();
}
```

---

## Task 5: Typing Indicator Styles

**File:** `style.css`

```css
/* Typing indicator */
.chat-typing {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--text-muted, #999);
  border-radius: 50%;
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}
```

---

## Task 6: Test the Full Flow

1. Create an event via quick capture: "dentist next week"
2. Open triage panel
3. See it in "Undetermined" with "when exactly?"
4. Click [◉]
5. Chat opens with: "Let's figure out when to schedule 'dentist'..."
6. Type: "Tuesday at 3pm"
7. AI extracts date/time, updates event
8. Triage refreshes — item moves to "This Week"

---

## Checklist

- [ ] Clicking [◉] opens chat with context
- [ ] AI prompt includes current event details
- [ ] User can provide date/time naturally
- [ ] AI extracts and confirms updates
- [ ] Event is updated in database
- [ ] `needs_triage` flag cleared
- [ ] Triage panel refreshes
- [ ] Chat shows confirmation message
- [ ] Typing indicator while AI responds
- [ ] Error handling for API failures

---

## Edge Cases to Test

| Scenario | Expected |
|----------|----------|
| User says "tomorrow at 3" | AI resolves with correct date |
| User says "next week sometime" | AI asks for specific day |
| User says "cancel this" | AI could ask "delete this event?" (optional) |
| User says "actually 4pm not 3pm" | AI updates the time |
| API fails | Graceful error message |

---

## Commit

```bash
git add js/triage-panel.js js/triage-ui.js api/resolve.js style.css
git commit -m "feat: resolve flow (Sprint 8.5.3)

- Click [◉] opens contextual chat
- AI extracts date/time from natural language
- Event auto-updates when resolved
- Triage refreshes after resolution
- Typing indicator + error handling"
```

---

## Milestone 8.5 Complete! 🎉

You now have:

| Feature | Status |
|---------|--------|
| Triage panel (right side) | ✅ |
| Today / This Week / Later / Undetermined | ✅ |
| Text-first minimal design | ✅ |
| Click to resolve undetermined items | ✅ |
| Contextual AI chat | ✅ |
| Auto-update events | ✅ |

**Next:** When ready, Milestone 9 adds AI classification, ghost events on calendar, decay system, and admin view.
