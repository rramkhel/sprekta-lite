# Sprekta Plan Mode - Implementation Spec

## Overview

Plan Mode is a chat-based planning assistant with a live summary card. Users dump their thoughts about an upcoming event/situation, and the AI helps them organize into a clear plan through conversation.

**Core pattern:**
1. User dumps (overwhelm, messy thoughts)
2. AI identifies anchors/non-negotiables
3. AI asks for missing time info
4. AI proposes simple plan
5. Conversation refines
6. User accepts when ready

---

## Milestone Plan

### Milestone 1: Foundation (Sprint 1-2)
Build the split-screen UI shell and basic state management.
- Plan Mode entry point
- Split-screen layout (chat left, card right)
- Basic chat UI (messages, input)
- Static summary card component
- Triage state management

### Milestone 2: AI Integration (Sprint 3-4)
Wire up Claude API and implement the planning conversation.
- `/api/triage` endpoint
- System prompt for planning behavior
- Structured response parsing (reply + card data)
- Card updates from AI responses
- Conversation history management

### Milestone 3: Polish & Accept Flow (Sprint 5)
Complete the user journey from planning to calendar.
- "Accept" flow - create calendar events from plan
- Mobile-responsive layout
- Loading states, error handling
- Edge cases (empty input, API failures)

### Milestone 4: Iteration (Sprint 6+)
Refine based on usage.
- Prompt tuning for better planning
- UX improvements
- Integration with existing quick capture

---

## Sprint 1 Plan: UI Shell & State

**Goal:** Build the visual foundation. No AI yet - use mock data.

### Files to Create/Modify

```
/js
  triage-ui.js       ← NEW: renders chat + card
  triage-state.js    ← NEW: state management
  
/types
  schemas.js         ← MODIFY: add triage schemas

index.html           ← MODIFY: add plan mode entry + split view
style.css            ← MODIFY: add chat + card styles
```

---

### 1. Data Schemas (`/types/schemas.js`)

Add these schemas:

```javascript
// Summary card structure
const TriageCardSchema = {
  anchor: {
    title: String,      // "Toronto Trip"
    dates: String       // "Jan 19-23" or "Tomorrow" or null
  },
  locked: [             // Non-negotiables (fixed times)
    {
      text: String,     // "Flight: Sun 12:50pm"
      time: String      // ISO timestamp (optional, for sorting)
    }
  ],
  todos: [              // Flexible tasks
    {
      text: String,     // "Laundry first"
      note: String      // "blocks packing" (optional)
    }
  ],
  insight: String,      // "You have tonight + tomorrow morning. Start laundry now."
  openQuestion: String  // "What time works for office tonight?" or null
};

// Message in conversation
const TriageMessageSchema = {
  role: 'user' | 'assistant',
  content: String,
  card: TriageCardSchema,  // Only on assistant messages
  timestamp: Date
};

// Full triage session
const TriageSessionSchema = {
  id: String,
  status: 'active' | 'resolved' | 'abandoned',
  messages: [TriageMessageSchema],
  card: TriageCardSchema,  // Current card state
  createdAt: Date,
  updatedAt: Date
};
```

---

### 2. State Management (`/js/triage-state.js`)

```javascript
/**
 * Triage State Manager
 * 
 * Holds conversation + card state in memory.
 * For MVP, no persistence - refresh loses state.
 */

const TriageState = {
  session: null,  // Current session or null
  
  // Start new triage session
  start() {
    this.session = {
      id: crypto.randomUUID(),
      status: 'active',
      messages: [],
      card: {
        anchor: null,
        locked: [],
        todos: [],
        insight: null,
        openQuestion: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this.session;
  },
  
  // Add user message
  addUserMessage(content) {
    if (!this.session) return null;
    
    const message = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    this.session.messages.push(message);
    this.session.updatedAt = new Date();
    return message;
  },
  
  // Add assistant message + update card
  addAssistantMessage(content, card) {
    if (!this.session) return null;
    
    const message = {
      role: 'assistant',
      content,
      card,
      timestamp: new Date()
    };
    this.session.messages.push(message);
    this.session.card = card;
    this.session.updatedAt = new Date();
    return message;
  },
  
  // Get current card
  getCard() {
    return this.session?.card || null;
  },
  
  // Get all messages
  getMessages() {
    return this.session?.messages || [];
  },
  
  // Mark session resolved (user accepted)
  resolve() {
    if (this.session) {
      this.session.status = 'resolved';
    }
  },
  
  // Clear session (cancel/close)
  clear() {
    this.session = null;
  },
  
  // Check if active
  isActive() {
    return this.session?.status === 'active';
  }
};

export default TriageState;
```

---

### 3. UI Components (`/js/triage-ui.js`)

```javascript
/**
 * Triage UI
 * 
 * Renders the split-screen plan mode interface.
 * - Left: Chat (messages + input)
 * - Right: Summary card
 */

import TriageState from './triage-state.js';

const TriageUI = {
  container: null,
  
  // Initialize and mount
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Triage container not found');
      return;
    }
    this.render();
    this.bindEvents();
  },
  
  // Main render
  render() {
    this.container.innerHTML = `
      <div class="triage-split">
        <div class="triage-chat">
          <div class="triage-header">
            <button class="triage-back" aria-label="Close">← Back</button>
            <h2>Plan something</h2>
          </div>
          <div class="triage-messages" id="triage-messages">
            ${this.renderMessages()}
          </div>
          <div class="triage-input-area">
            <textarea 
              id="triage-input" 
              placeholder="Dump everything here - what you're planning, what needs to happen, any deadlines or constraints..."
              rows="3"
            ></textarea>
            <button id="triage-send" class="triage-send-btn">Send</button>
          </div>
        </div>
        <div class="triage-card-panel">
          ${this.renderCard()}
        </div>
      </div>
    `;
  },
  
  // Render messages
  renderMessages() {
    const messages = TriageState.getMessages();
    
    if (messages.length === 0) {
      return `
        <div class="triage-empty">
          <p>What are you trying to plan?</p>
          <p class="triage-hint">Tell me about an event, trip, deadline, or anything you need to get organized for.</p>
        </div>
      `;
    }
    
    return messages.map(msg => `
      <div class="triage-message triage-message-${msg.role}">
        <div class="triage-message-content">${this.escapeHtml(msg.content)}</div>
      </div>
    `).join('');
  },
  
  // Render summary card
  renderCard() {
    const card = TriageState.getCard();
    
    if (!card || !card.anchor) {
      return `
        <div class="triage-card triage-card-empty">
          <div class="triage-card-placeholder">
            <p>Your plan will appear here</p>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="triage-card">
        <div class="triage-card-header">
          <h3>${this.escapeHtml(card.anchor.title)}</h3>
          ${card.anchor.dates ? `<span class="triage-card-dates">${this.escapeHtml(card.anchor.dates)}</span>` : ''}
        </div>
        
        ${card.locked.length > 0 ? `
          <div class="triage-card-section">
            <h4>🔒 Locked In</h4>
            <ul class="triage-locked-list">
              ${card.locked.map(item => `
                <li>${this.escapeHtml(item.text)}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${card.todos.length > 0 ? `
          <div class="triage-card-section">
            <h4>☑️ To Do</h4>
            <ul class="triage-todo-list">
              ${card.todos.map(item => `
                <li>
                  <span class="triage-todo-text">${this.escapeHtml(item.text)}</span>
                  ${item.note ? `<span class="triage-todo-note">${this.escapeHtml(item.note)}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${card.insight ? `
          <div class="triage-card-insight">
            💡 ${this.escapeHtml(card.insight)}
          </div>
        ` : ''}
        
        ${card.openQuestion ? `
          <div class="triage-card-question">
            ❓ ${this.escapeHtml(card.openQuestion)}
          </div>
        ` : ''}
        
        <div class="triage-card-actions">
          <button id="triage-accept" class="triage-accept-btn" ${!card.anchor ? 'disabled' : ''}>
            Looks good ✓
          </button>
        </div>
      </div>
    `;
  },
  
  // Bind event handlers
  bindEvents() {
    // Back button
    this.container.querySelector('.triage-back')?.addEventListener('click', () => {
      this.close();
    });
    
    // Send button
    this.container.querySelector('#triage-send')?.addEventListener('click', () => {
      this.handleSend();
    });
    
    // Enter to send (shift+enter for newline)
    this.container.querySelector('#triage-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    
    // Accept button
    this.container.querySelector('#triage-accept')?.addEventListener('click', () => {
      this.handleAccept();
    });
  },
  
  // Handle send message
  async handleSend() {
    const input = this.container.querySelector('#triage-input');
    const content = input.value.trim();
    
    if (!content) return;
    
    // Start session if needed
    if (!TriageState.isActive()) {
      TriageState.start();
    }
    
    // Add user message
    TriageState.addUserMessage(content);
    input.value = '';
    
    // Re-render messages
    this.updateMessages();
    
    // TODO: In Sprint 2, call /api/triage here
    // For now, simulate with mock response
    await this.mockAssistantResponse(content);
  },
  
  // Mock response (replace with real API in Sprint 2)
  async mockAssistantResponse(userInput) {
    // Simulate delay
    await new Promise(r => setTimeout(r, 800));
    
    // Mock card based on simple keyword detection
    const mockCard = {
      anchor: {
        title: 'Your Plan',
        dates: null
      },
      locked: [],
      todos: [
        { text: 'Item from your input', note: null }
      ],
      insight: 'This is a mock response. Real AI coming in Sprint 2.',
      openQuestion: 'What else do you need to plan?'
    };
    
    // Detect "Toronto" or "trip" for better mock
    if (userInput.toLowerCase().includes('toronto') || userInput.toLowerCase().includes('trip')) {
      mockCard.anchor.title = 'Toronto Trip';
      mockCard.anchor.dates = 'Jan 19-23';
      mockCard.locked = [
        { text: 'Flight: Sun 12:50pm' },
        { text: 'Mom pickup: 10am' }
      ];
      mockCard.todos = [
        { text: 'Laundry first', note: 'blocks packing' },
        { text: 'Pack - laptop, headphones, clothes' },
        { text: 'Office for shower/hair' }
      ];
      mockCard.insight = 'You have tonight + tomorrow morning. Start laundry now.';
      mockCard.openQuestion = 'What time works for the office tonight?';
    }
    
    const response = "Got it! I've started putting together a plan. Let me know if anything needs adjusting.";
    
    TriageState.addAssistantMessage(response, mockCard);
    this.updateMessages();
    this.updateCard();
  },
  
  // Update just the messages area
  updateMessages() {
    const messagesEl = this.container.querySelector('#triage-messages');
    if (messagesEl) {
      messagesEl.innerHTML = this.renderMessages();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },
  
  // Update just the card
  updateCard() {
    const cardPanel = this.container.querySelector('.triage-card-panel');
    if (cardPanel) {
      cardPanel.innerHTML = this.renderCard();
      // Re-bind accept button
      cardPanel.querySelector('#triage-accept')?.addEventListener('click', () => {
        this.handleAccept();
      });
    }
  },
  
  // Handle accept
  handleAccept() {
    const card = TriageState.getCard();
    if (!card) return;
    
    // TODO: Create calendar events from card.locked
    // For now, just log and close
    console.log('Accepted plan:', card);
    
    TriageState.resolve();
    this.close();
  },
  
  // Close plan mode
  close() {
    TriageState.clear();
    this.container.classList.add('hidden');
    // TODO: Show main calendar view
    document.getElementById('main-view')?.classList.remove('hidden');
  },
  
  // Open plan mode
  open() {
    TriageState.start();
    this.container.classList.remove('hidden');
    document.getElementById('main-view')?.classList.add('hidden');
    this.render();
    this.bindEvents();
    
    // Focus input
    setTimeout(() => {
      this.container.querySelector('#triage-input')?.focus();
    }, 100);
  },
  
  // Utility: escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

export default TriageUI;
```

---

### 4. Styles (`style.css`)

Add these styles:

```css
/* ============================================
   PLAN MODE / TRIAGE
   ============================================ */

/* Container */
.triage-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary, #ffffff);
  z-index: 100;
}

.triage-container.hidden {
  display: none;
}

/* Split layout */
.triage-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  gap: 1px;
  background: var(--border-color, #e0e0e0);
}

/* Chat panel (left) */
.triage-chat {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #ffffff);
  height: 100%;
}

.triage-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.triage-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.triage-back {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.triage-back:hover {
  background: var(--bg-hover, #f5f5f5);
}

/* Messages area */
.triage-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.triage-empty {
  color: var(--text-secondary, #666);
  text-align: center;
  margin-top: 40px;
}

.triage-empty p:first-child {
  font-size: 18px;
  margin-bottom: 8px;
}

.triage-hint {
  font-size: 14px;
  opacity: 0.8;
}

/* Individual message */
.triage-message {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.triage-message-user {
  align-self: flex-end;
  background: var(--accent-color, #007AFF);
  color: white;
  border-bottom-right-radius: 4px;
}

.triage-message-assistant {
  align-self: flex-start;
  background: var(--bg-secondary, #f0f0f0);
  color: var(--text-primary, #000);
  border-bottom-left-radius: 4px;
}

/* Input area */
.triage-input-area {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.triage-input-area textarea {
  flex: 1;
  resize: none;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  padding: 12px;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.4;
}

.triage-input-area textarea:focus {
  outline: none;
  border-color: var(--accent-color, #007AFF);
}

.triage-send-btn {
  padding: 12px 20px;
  background: var(--accent-color, #007AFF);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.triage-send-btn:hover {
  opacity: 0.9;
}

/* Card panel (right) */
.triage-card-panel {
  background: var(--bg-secondary, #f8f8f8);
  padding: 24px;
  overflow-y: auto;
}

.triage-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.triage-card-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-secondary, #666);
}

.triage-card-header {
  margin-bottom: 20px;
}

.triage-card-header h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
}

.triage-card-dates {
  color: var(--text-secondary, #666);
  font-size: 14px;
}

/* Card sections */
.triage-card-section {
  margin-bottom: 20px;
}

.triage-card-section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #666);
}

.triage-locked-list,
.triage-todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.triage-locked-list li,
.triage-todo-list li {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light, #eee);
}

.triage-locked-list li:last-child,
.triage-todo-list li:last-child {
  border-bottom: none;
}

.triage-todo-note {
  display: block;
  font-size: 13px;
  color: var(--text-secondary, #666);
  margin-top: 2px;
}

/* Insight and question */
.triage-card-insight {
  background: var(--bg-highlight, #FFF9E6);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.triage-card-question {
  background: var(--bg-secondary, #f0f0f0);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-style: italic;
}

/* Accept button */
.triage-card-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light, #eee);
}

.triage-accept-btn {
  width: 100%;
  padding: 14px 20px;
  background: var(--success-color, #34C759);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.triage-accept-btn:hover {
  opacity: 0.9;
}

.triage-accept-btn:disabled {
  background: var(--bg-secondary, #ccc);
  cursor: not-allowed;
}

/* ============================================
   MOBILE RESPONSIVE
   ============================================ */

@media (max-width: 768px) {
  .triage-split {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .triage-card-panel {
    max-height: 40vh;
    border-top: 1px solid var(--border-color, #e0e0e0);
  }
}
```

---

### 5. HTML Changes (`index.html`)

Add triage container and entry button:

```html
<!-- Add after main calendar container -->
<div id="triage-container" class="triage-container hidden"></div>

<!-- Add Plan Mode button near the quick capture button -->
<button id="plan-mode-btn" class="plan-mode-btn">
  🗓️ Plan something
</button>
```

Add initialization:

```html
<script type="module">
  import TriageUI from './js/triage-ui.js';
  
  // Initialize triage UI
  TriageUI.init('triage-container');
  
  // Wire up entry button
  document.getElementById('plan-mode-btn')?.addEventListener('click', () => {
    TriageUI.open();
  });
</script>
```

---

### 6. Testing Checklist

Before marking Sprint 1 complete:

- [ ] "Plan something" button visible on main screen
- [ ] Clicking button opens split-screen view
- [ ] Chat panel shows empty state initially
- [ ] Can type message and send (Enter or button)
- [ ] User message appears in chat (right-aligned, blue)
- [ ] Mock assistant response appears (left-aligned, gray)
- [ ] Summary card updates with mock data
- [ ] "Back" button closes plan mode
- [ ] "Looks good" button logs card and closes
- [ ] Mobile: stacked layout works
- [ ] Dev panel: Mock AI toggle still works (doesn't break)

---

## Sprint 2 Preview: AI Integration

After Sprint 1, the next sprint adds real AI:

1. Create `/api/triage.js` endpoint
2. Write system prompt for planning behavior
3. Replace mock response with real API call
4. Handle streaming (optional) or full response
5. Parse structured card from AI response

The system prompt will instruct Claude to:
- Always return JSON with `reply` and `card` fields
- Find anchors/non-negotiables first
- Ask for missing time information
- Keep plans simple (not overengineered)
- Use the card schema exactly

---

## Notes for Claude Code

**Key context:**
- This is a prototype for UI/UX exploration
- Vanilla JS (no React/Vue) - keep it simple
- Supabase exists but don't use it for triage yet
- Dev panel exists - don't break it
- Mock AI first, real AI in Sprint 2

**Style consistency:**
- Match existing Sprekta UI patterns
- Use CSS variables where they exist
- Keep dark mode compatible if already implemented

**Don't overengineer:**
- No persistence needed yet
- No partial accept/reject
- No task database
- No recurring plan templates

Get the basics working, then iterate.
