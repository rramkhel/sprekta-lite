# Sprint 3.1: Profile Input + Real AI Integration

## Sprint Goal

Add profile input step to Plan Mode and wire up real Claude AI (replacing mock responses).

---

## Current State

**What exists:**
- Plan Mode UI: split-screen (chat left, card right)
- `js/triage-state.js` - session state
- `js/triage-ui.js` - UI with mock responses
- `/api/parse.js` - Claude API for quick capture
- Mock responses for "trip" and "deadline" keywords

**What we're building:**
- Profile input step (before chat)
- `/api/triage.js` endpoint (real AI)
- Profile passed to Claude
- Warnings section in card

---

## Task 1: Update State Manager

**File:** `js/triage-state.js`

### 1a. Add profile to session

Find the `start()` method. Update it:

```javascript
start(profile = null) {
  this.session = {
    id: crypto.randomUUID(),
    status: 'active',
    profile: null,           // ADD THIS
    messages: [],
    card: {
      anchor: null,
      locked: [],
      todos: [],
      insight: null,
      openQuestion: null,
      warnings: []           // ADD THIS
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return this.session;
},
```

### 1b. Add profile methods

Add these methods after `isActive()`:

```javascript
setProfile(profileText) {
  if (!this.session) this.start();
  this.session.profile = profileText;
  this.session.updatedAt = new Date();
},

getProfile() {
  return this.session?.profile || null;
},

hasProfile() {
  return !!(this.session?.profile);
},
```

---

## Task 2: Add Profile Step UI

**File:** `js/triage-ui.js`

### 2a. Update open() method

Find `open()` and change it to show profile step first:

```javascript
open() {
  TriageState.start();
  this.container.classList.remove('hidden');
  document.querySelector('.app-container')?.classList.add('hidden');
  this.renderProfileStep();  // CHANGED: was render()
},
```

### 2b. Add renderProfileStep() method

Add this new method:

```javascript
renderProfileStep() {
  this.container.innerHTML = `
    <div class="triage-profile-step">
      <div class="triage-header">
        <button class="triage-back">← Back</button>
        <h2>Plan something</h2>
      </div>
      
      <div class="triage-profile-content">
        <div class="triage-profile-intro">
          <h3>First, help me understand you</h3>
          <p>Paste your profile so I can give personalized planning help. 
             Include your schedule, patterns, key people, and any tendencies.</p>
        </div>
        
        <textarea 
          id="profile-input" 
          class="triage-profile-textarea"
          placeholder="# My Profile

**Location:** Edmonton, Alberta
**Work Hours:** 8AM-1PM

## Patterns
- I avoid serious work at home
- I tend to be optimistic about timing
- I need recovery time after deadlines

## Key People
- Mom: Primary transportation
- Conner: Boyfriend, evening calls

## Red Flags
- Multiple deadlines same day = stress
- Sprekta keeps getting squeezed out"
        ></textarea>
        
        <div class="triage-profile-actions">
          <button id="skip-profile" class="triage-btn-secondary">Skip for now</button>
          <button id="save-profile" class="triage-btn-primary">Continue →</button>
        </div>
      </div>
    </div>
  `;
  
  this.bindProfileEvents();
},

bindProfileEvents() {
  this.container.querySelector('.triage-back')?.addEventListener('click', () => this.close());
  
  this.container.querySelector('#save-profile')?.addEventListener('click', () => {
    const profileText = document.getElementById('profile-input').value.trim();
    if (profileText) {
      TriageState.setProfile(profileText);
    }
    this.renderChatStep();
  });
  
  this.container.querySelector('#skip-profile')?.addEventListener('click', () => {
    this.renderChatStep();
  });
},
```

### 2c. Rename render() to renderChatStep()

Find the existing `render()` method. Rename it to `renderChatStep()`.

Update the header inside to show profile badge:

```javascript
renderChatStep() {
  const messages = TriageState.getMessages();
  const card = TriageState.getCard();
  const hasProfile = TriageState.hasProfile();  // ADD

  this.container.innerHTML = `
    <div class="triage-split">
      <div class="triage-chat">
        <div class="triage-header">
          <button class="triage-back">← Back</button>
          <h2>Plan something</h2>
          ${hasProfile ? '<span class="triage-profile-badge">✓ Profile loaded</span>' : ''}
        </div>
        <!-- rest of existing chat HTML -->
      </div>
      <!-- rest of existing card panel HTML -->
    </div>
  `;
  
  this.bindEvents();
  setTimeout(() => document.getElementById('triage-input')?.focus(), 100);
},
```

Also update the empty state message:

```javascript
renderMessages(messages) {
  if (!messages || messages.length === 0) {
    const hasProfile = TriageState.hasProfile();
    return `
      <div class="triage-empty">
        <p>What are you trying to plan?</p>
        <p class="triage-hint">
          ${hasProfile 
            ? "I've loaded your profile - I'll give you personalized help." 
            : "A trip, deadline, event, or anything you need to organize."}
        </p>
      </div>
    `;
  }
  // ... rest unchanged
}
```

---

## Task 3: Create Triage API Endpoint

**File:** `api/triage.js` (NEW FILE)

Create this file:

```javascript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, profile, newMessage } = req.body;

    if (!newMessage) {
      return res.status(400).json({ error: "Missing newMessage" });
    }

    // Build conversation history
    const conversationHistory = (messages || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    conversationHistory.push({
      role: "user",
      content: newMessage
    });

    const systemPrompt = buildSystemPrompt(profile);

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationHistory,
    });

    const assistantMessage = response.content[0].text;

    // Try to parse as JSON
    let parsed;
    try {
      // Handle case where response is wrapped in markdown code block
      let jsonStr = assistantMessage;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = {
        reply: assistantMessage,
        card: null
      };
    }

    return res.status(200).json({
      reply: parsed.reply,
      card: parsed.card
    });

  } catch (error) {
    console.error("Triage API error:", error);
    return res.status(500).json({ 
      error: "Failed to process request",
      details: error.message 
    });
  }
}

function buildSystemPrompt(profile) {
  let prompt = `You are a planning assistant helping someone organize their thoughts around an event, trip, deadline, or overwhelming situation.

Your approach:
1. Find the anchors - what's fixed/non-negotiable (flights, appointments, deadlines)
2. Identify dependencies - what blocks what
3. Reality-check timing - are they being too optimistic?
4. Ask ONE targeted question if you need more info
5. Keep plans simple - 3-5 action items max

CRITICAL: Always respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "reply": "Your conversational response here",
  "card": {
    "anchor": { "title": "Event name", "dates": "Jan 19-23 or null" },
    "locked": [{ "text": "Non-negotiable item with time" }],
    "todos": [{ "text": "Action item", "note": "Optional context or null" }],
    "insight": "One key insight or reality check",
    "openQuestion": "One follow-up question or null if nothing needed",
    "warnings": [{ "text": "⚠️ Warning based on patterns" }]
  }
}

Rules:
- Keep todos to 3-5 items max
- One insight, one open question
- Warnings only if profile suggests risks
- If you need more info, card can have minimal data
- Be conversational in reply, structured in card`;

  if (profile) {
    prompt += `

---

USER PROFILE:
${profile}

---

Use this profile to:
- Catch things they might forget (based on their red flags)
- Reality-check if they're being optimistic about timing
- Reference their people/constraints when relevant  
- Protect their priorities from getting squeezed
- Add warnings for patterns that might cause problems`;
  }

  return prompt;
}
```

---

## Task 4: Wire UI to API

**File:** `js/triage-ui.js`

### 4a. Replace mockResponse with API call

Find the `handleSend()` method. Replace the mock call with:

```javascript
async handleSend() {
  const input = document.getElementById('triage-input');
  const content = input.value.trim();
  if (!content) return;
  
  TriageState.addUserMessage(content);
  input.value = '';
  this.updateMessages();
  this.showTyping();
  
  try {
    const response = await this.callTriageAPI(content);
    this.hideTyping();
    
    TriageState.addAssistantMessage(response.reply, response.card);
    this.updateMessages();
    this.updateCard();
    
  } catch (error) {
    this.hideTyping();
    console.error('Triage API error:', error);
    TriageState.addAssistantMessage(
      "Sorry, I had trouble with that. Can you try again?",
      null
    );
    this.updateMessages();
  }
},
```

### 4b. Add callTriageAPI method

Add this new method:

```javascript
async callTriageAPI(newMessage) {
  const messages = TriageState.getMessages();
  const profile = TriageState.getProfile();
  
  const response = await fetch('/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      profile: profile,
      newMessage: newMessage
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
},
```

### 4c. Delete mockResponse method

Remove the entire `mockResponse()` method - we don't need it anymore.

---

## Task 5: Update Card Rendering for Warnings

**File:** `js/triage-ui.js`

Find `renderCard()`. Add warnings section after the header:

```javascript
renderCard(card) {
  if (!card || !card.anchor) {
    return `
      <div class="triage-card triage-card-empty">
        <p>Your plan will appear here</p>
      </div>
    `;
  }
  
  let html = `<div class="triage-card">`;
  
  // Header
  html += `
    <div class="triage-card-header">
      <h3>${this.escapeHtml(card.anchor?.title || 'Your Plan')}</h3>
      ${card.anchor?.dates ? `<span class="triage-card-dates">${this.escapeHtml(card.anchor.dates)}</span>` : ''}
    </div>
  `;
  
  // ADD: Warnings section
  if (card.warnings && card.warnings.length > 0) {
    html += `<div class="triage-warnings">`;
    card.warnings.forEach(w => {
      html += `<div class="triage-warning">${this.escapeHtml(w.text)}</div>`;
    });
    html += `</div>`;
  }
  
  // ... rest of existing code (locked, todos, insight, openQuestion, actions)
}
```

---

## Task 6: Add Profile Styles

**File:** `style.css`

Add these styles (after existing triage styles):

```css
/* ============================================
   PROFILE STEP
   ============================================ */

.triage-profile-step {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
}

.triage-profile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

.triage-profile-intro {
  margin-bottom: 20px;
}

.triage-profile-intro h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.triage-profile-intro p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.triage-profile-textarea {
  flex: 1;
  min-height: 300px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 16px;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
}

.triage-profile-textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.triage-profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.triage-btn-primary {
  padding: 12px 24px;
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.triage-btn-primary:hover {
  background: #0066DD;
}

.triage-btn-secondary {
  padding: 12px 24px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
}

.triage-btn-secondary:hover {
  background: #e5e5e5;
}

/* Profile badge */
.triage-profile-badge {
  margin-left: auto;
  font-size: 12px;
  color: #34C759;
  background: #E8F9ED;
  padding: 4px 10px;
  border-radius: 12px;
}

/* Warnings */
.triage-warnings {
  margin-bottom: 16px;
}

.triage-warning {
  background: #FFF3E0;
  border-left: 3px solid #FF9800;
  padding: 10px 12px;
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  margin-bottom: 8px;
  line-height: 1.4;
}
```

---

## Testing Checklist

### Profile Step
- [ ] "Plan something" → shows profile input (not chat)
- [ ] Placeholder text visible
- [ ] "Continue" with text → saves profile, shows chat
- [ ] "Continue" without text → shows chat (no profile)
- [ ] "Skip for now" → shows chat (no profile)
- [ ] "Back" → closes plan mode
- [ ] Chat header shows "✓ Profile loaded" when profile exists
- [ ] Chat header has no badge when no profile

### API Integration
- [ ] Type message → typing indicator shows
- [ ] Response comes back from real API
- [ ] Card updates with AI content
- [ ] Follow-up messages maintain context
- [ ] API errors show friendly message

### Profile-Aware Responses
- [ ] With profile: AI mentions user patterns
- [ ] With profile: warnings appear in card
- [ ] Without profile: generic response, no warnings
- [ ] AI asks relevant follow-up questions

### Existing Features
- [ ] Quick capture still works
- [ ] Calendar still works  
- [ ] Dev panel still works
- [ ] No console errors

---

## Success Criteria

Sprint 3.1 is complete when:
1. ✅ Profile input step shows before chat
2. ✅ Profile can be skipped
3. ✅ `/api/triage` endpoint works
4. ✅ Real AI responses (not mock)
5. ✅ Profile included in AI system prompt
6. ✅ Warnings section in card
7. ✅ Multi-turn conversation works
8. ✅ Errors handled gracefully

---

## Commit

```bash
git add .
git commit -m "feat: add profile-aware Plan Mode with real AI (Sprint 3.1)

- Profile input step before chat
- /api/triage endpoint with Claude API
- Profile passed in system prompt
- Warnings section in summary card
- Multi-turn conversation support"
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `js/triage-state.js` | Add profile to session, add profile methods |
| `js/triage-ui.js` | Add profile step, replace mock with API, update card for warnings |
| `api/triage.js` | NEW: Serverless endpoint for planning AI |
| `style.css` | Add profile step styles, warnings styles |

---

## Estimated Time

| Task | Estimate |
|------|----------|
| Task 1: Update state | 10 min |
| Task 2: Profile UI | 25 min |
| Task 3: Create API | 30 min |
| Task 4: Wire to API | 15 min |
| Task 5: Card warnings | 10 min |
| Task 6: Styles | 15 min |
| Testing | 20 min |
| **Total** | **~2 hours** |
