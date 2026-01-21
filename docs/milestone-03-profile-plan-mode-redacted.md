# Milestone 03: Profile-Aware Plan Mode

## Overview

Upgrade Plan Mode to use real AI with profile awareness. The AI reads the user's profile and provides personalized planning help - identifying blind spots, flagging risks based on patterns, and asking targeted questions.

**Core insight:** Planning isn't about parsing tasks. It's about knowing the user and helping them think through their situation.

---

## Current State (After Milestone 02)

**What exists:**
- Plan Mode UI: split-screen (chat left, card right)
- `js/triage-state.js` - session state management
- `js/triage-ui.js` - UI rendering with mock AI responses
- `/api/parse.js` - Claude API integration for quick capture
- Summary card with: anchor, locked, todos, insight, openQuestion

**What's missing:**
- Profile input step
- `/api/triage.js` endpoint (real AI for planning)
- Profile passed to Claude in system prompt
- Warnings section in card (profile-based alerts)
- Multi-turn conversation support

---

## Milestone Plan

| Sprint | Goal | Key Deliverables |
|--------|------|------------------|
| 3.1 | Profile UI + API Endpoint | Profile input, `/api/triage.js`, basic AI response |
| 3.2 | Profile-Aware Prompting | System prompt with profile, structured JSON output |
| 3.3 | Multi-turn Conversation | Conversation history, follow-up questions |
| 3.4 | Accept Flow | Create calendar events from accepted plan |

---

## Sprint 3.1: Profile UI + Triage API

**Goal:** Add profile input step and create the `/api/triage.js` endpoint that calls Claude.

### Files to Create
```
api/triage.js         ← NEW: Serverless function for planning AI
```

### Files to Modify
```
js/triage-state.js    ← Add profile to state
js/triage-ui.js       ← Add profile step, replace mock with API call
style.css             ← Add profile step styles
```

### Task 1: Update State Manager

**File:** `js/triage-state.js`

Add profile support to session state:

```javascript
start(profile = null) {
  this.session = {
    id: crypto.randomUUID(),
    status: 'active',
    profile: profile,  // ADD
    messages: [],
    card: {
      anchor: null,
      locked: [],
      todos: [],
      insight: null,
      openQuestion: null,
      warnings: []  // ADD
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return this.session;
},

// ADD these methods
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

### Task 2: Add Profile Input Step

**File:** `js/triage-ui.js`

Update `open()` to show profile step first:

```javascript
open() {
  TriageState.start();
  this.container.classList.remove('hidden');
  document.querySelector('.app-container')?.classList.add('hidden');
  this.renderProfileStep();  // Changed from render()
},

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
             Include your schedule, patterns, key people, and any tendencies 
             (like being optimistic about timing).</p>
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

renderChatStep() {
  // Rename existing render() to renderChatStep()
  // Add profile badge to header if profile exists
  const hasProfile = TriageState.hasProfile();
  
  // ... existing render code, but add to header:
  // ${hasProfile ? '<span class="triage-profile-badge">✓ Profile loaded</span>' : ''}
}
```

---

### Task 3: Create Triage API Endpoint

**File:** `api/triage.js` (NEW)

```javascript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // CORS headers
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

    // Build conversation history for Claude
    const conversationHistory = (messages || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add new user message
    conversationHistory.push({
      role: "user",
      content: newMessage
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(profile);

    // Call Claude
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationHistory,
    });

    const assistantMessage = response.content[0].text;

    // Parse the response (expecting JSON with reply + card)
    let parsed;
    try {
      parsed = JSON.parse(assistantMessage);
    } catch {
      // If not valid JSON, treat as plain reply
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
  const basePrompt = `You are a planning assistant helping someone organize their thoughts around an event, trip, deadline, or overwhelming situation.

Your job is to:
1. Identify anchors (fixed, non-negotiable times/events)
2. Surface dependencies (what blocks what)
3. Reality-check timing constraints
4. Ask targeted questions about what's unclear
5. Keep plans simple - don't over-engineer

Always respond with valid JSON in this exact format:
{
  "reply": "Your conversational response to the user",
  "card": {
    "anchor": { "title": "Event name", "dates": "Jan 19-23" },
    "locked": [{ "text": "Flight: 12:50pm" }],
    "todos": [{ "text": "Task description", "note": "Optional context" }],
    "insight": "Key insight or reality check",
    "openQuestion": "Follow-up question if needed, or null",
    "warnings": [{ "text": "⚠️ Profile-based warning" }]
  }
}

If you don't have enough info for a full card yet, return partial data with nulls.
Keep the card simple - 3-5 todos max, 1 key insight, 1 open question.
Don't over-engineer the plan.`;

  if (profile) {
    return `${basePrompt}

---

USER PROFILE:
The user has shared their profile. Use this to personalize your planning help.
Reference their patterns, flag risks based on their red flags, and ask questions that account for their specific situation.

${profile}

---

Use the profile to:
- Identify things they might forget (based on red flags)
- Reality-check their timing (if they're optimistic about routes/scheduling)
- Reference their key people when relevant
- Protect their priorities (like Sprekta time) from getting squeezed`;
  }

  return basePrompt;
}
```

---

### Task 4: Wire UI to API

**File:** `js/triage-ui.js`

Replace `mockResponse()` with real API call:

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
    
    // Show error in chat
    TriageState.addAssistantMessage(
      "Sorry, I had trouble processing that. Can you try again?",
      null
    );
    this.updateMessages();
  }
},

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
}
```

---

### Task 5: Add Profile Styles

**File:** `style.css`

Add after existing triage styles:

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

/* Profile badge in chat header */
.triage-profile-badge {
  margin-left: auto;
  font-size: 12px;
  color: #34C759;
  background: #E8F9ED;
  padding: 4px 10px;
  border-radius: 12px;
}

/* Warnings in card */
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

### Task 6: Update Card Rendering

**File:** `js/triage-ui.js`

Update `renderCard()` to include warnings:

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
      <h3>${this.escapeHtml(card.anchor.title)}</h3>
      ${card.anchor.dates ? `<span class="triage-card-dates">${this.escapeHtml(card.anchor.dates)}</span>` : ''}
    </div>
  `;
  
  // Warnings (profile-based) - ADD THIS SECTION
  if (card.warnings && card.warnings.length > 0) {
    html += `<div class="triage-warnings">`;
    card.warnings.forEach(w => {
      html += `<div class="triage-warning">${this.escapeHtml(w.text)}</div>`;
    });
    html += `</div>`;
  }
  
  // ... rest of existing card rendering (locked, todos, insight, openQuestion)
}
```

---

## Testing Checklist

### Profile Step
- [ ] "Plan something" → shows profile input (not chat immediately)
- [ ] Placeholder text visible in textarea
- [ ] "Continue" with profile → chat shows, badge visible
- [ ] "Skip for now" → chat shows, no badge
- [ ] "Back" from profile step → closes plan mode

### API Integration
- [ ] Type message → loading indicator shows
- [ ] AI response appears in chat
- [ ] Card updates with AI-generated content
- [ ] Multi-turn conversation works (AI remembers context)
- [ ] Error handling works (shows error message, doesn't crash)

### Profile-Aware Responses
- [ ] With profile: AI references user patterns in response
- [ ] With profile: Card shows warnings based on red flags
- [ ] Without profile: AI gives generic planning help
- [ ] Profile included in follow-up questions

### Existing Functionality
- [ ] Quick capture still works
- [ ] Calendar still works
- [ ] Dev panel still works
- [ ] No console errors

---

## Success Criteria

Sprint 3.1 is complete when:
1. ✅ Profile input step exists before chat
2. ✅ Profile can be skipped
3. ✅ `/api/triage` endpoint works with Claude
4. ✅ Chat uses real AI responses (not mock)
5. ✅ Profile passed to Claude in system prompt
6. ✅ Card shows warnings section
7. ✅ Multi-turn conversation maintains context
8. ✅ Error states handled gracefully

---

## Notes for Claude Code

**Existing patterns to follow:**
- `/api/parse.js` - reference for Claude API setup
- `js/triage-ui.js` - existing chat rendering patterns
- Dev panel logging - log API calls for debugging

**Key context:**
- Anthropic SDK already in package.json
- Environment variables already configured
- Supabase exists but not needed for this sprint

**Don't:**
- Don't break quick capture
- Don't persist profile to database yet (session only)
- Don't over-engineer the system prompt
- Don't add streaming (keep it simple for now)

---

## After Sprint 3.1

Next sprints:
- **3.2**: Refine system prompt, improve card structure
- **3.3**: Add conversation memory, follow-up improvements
- **3.4**: Accept flow - create calendar events from plan
