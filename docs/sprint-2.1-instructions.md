⏺ Perfect! I've completed all the implementation steps for Plan Mode Sprint 1. Let me update the task list:

⏺ Plan Mode Sprint 1 Complete!

  I've successfully implemented the Plan Mode UI Shell. Here's what was added:

  Files Created:

  - js/triage-state.js - Session state management with methods for adding messages, updating cards, and tracking session status
  - js/triage-ui.js - Split-screen UI with chat rendering, mock AI responses, and card display

  Files Updated:

  - index.html - Added triage container, "Plan something" button, and initialization script
  - style.css - Added ~300 lines of styles for split-screen layout, chat messages, summary card, and mobile responsive design

  Features:

  ✅ Split-screen interface (chat left, summary card right)
  ✅ Chat with user/assistant message bubbles
  ✅ Typing indicator animation
  ✅ Mock AI responses based on keywords:
  - "trip"/"travel" → Toronto Trip example
  - "deadline"/"project" → Project Deadline example
  - Generic fallback for other inputs
  ✅ Summary card with anchor, locked items, todos, insight, and open questions
  ✅ "Looks good" accept button (shows alert, will integrate with calendar in Sprint 3)
  ✅ Mobile responsive (stacked layout on small screens)

  Test it:

  Your dev server should already be running at http://localhost:3000. Click the "Plan something" button (next to
  Quick Capture) to open Plan Mode!

  Try typing: "I need to plan a trip to Toronto" to see the mock AI response in action.


---

# Sprint 1: Plan Mode UI Shell

## Context

You're building a new feature for Sprekta, a calendar app. This sprint creates the UI foundation for "Plan Mode" - a chat-based planning interface.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, HTML, CSS, Vercel serverless functions

## Goal

Build a split-screen interface where:
- Left panel = chat (user types, sees responses)
- Right panel = summary card (shows the plan)

NO real AI yet. Use mock responses. The goal is to nail the UI.

---

## Step 1: Explore the Codebase

Before writing code, understand what exists:

```bash
# Look at current structure
ls -la
cat index.html | head -100
cat style.css | head -100
ls js/
```

Find:
- Where the main app container is
- How existing components are structured
- What CSS variables exist
- How other JS modules are imported

---

## Step 2: Add Triage Schemas

**File:** `types/schemas.js` (should already exist)

Add these schemas at the end of the file:

```javascript
// ============================================
// TRIAGE / PLAN MODE SCHEMAS
// ============================================

export const TriageCardSchema = {
  anchor: {
    title: '', // "Toronto Trip"
    dates: ''  // "Jan 19-23" or null
  },
  locked: [], // [{ text: "Flight: Sun 12:50pm" }]
  todos: [],  // [{ text: "Laundry first", note: "blocks packing" }]
  insight: '',     // "Start laundry now."
  openQuestion: '' // "What time for office?" or null
};

export const TriageMessageSchema = {
  role: '', // 'user' | 'assistant'
  content: '',
  card: null, // TriageCardSchema, only on assistant messages
  timestamp: null
};

export const TriageSessionSchema = {
  id: '',
  status: 'active', // 'active' | 'resolved' | 'abandoned'
  messages: [],
  card: null,
  createdAt: null,
  updatedAt: null
};
```

---

## Step 3: Create State Manager

**File:** `js/triage-state.js` (NEW FILE)

```javascript
/**
 * Triage State Manager
 * Holds conversation + card state in memory.
 */

const TriageState = {
  session: null,
  
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
  
  addAssistantMessage(content, card) {
    if (!this.session) return null;
    const message = {
      role: 'assistant',
      content,
      card,
      timestamp: new Date()
    };
    this.session.messages.push(message);
    if (card) this.session.card = card;
    this.session.updatedAt = new Date();
    return message;
  },
  
  getCard() {
    return this.session?.card || null;
  },
  
  getMessages() {
    return this.session?.messages || [];
  },
  
  resolve() {
    if (this.session) this.session.status = 'resolved';
  },
  
  clear() {
    this.session = null;
  },
  
  isActive() {
    return this.session?.status === 'active';
  }
};

export default TriageState;
```

---

## Step 4: Create Triage UI Module

**File:** `js/triage-ui.js` (NEW FILE)

This is the main UI component. It handles:
- Rendering the split layout
- Chat messages
- Summary card
- User input
- Mock AI responses

```javascript
/**
 * Triage UI - Plan Mode Interface
 */

import TriageState from './triage-state.js';

const TriageUI = {
  container: null,
  
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Triage container not found:', containerId);
      return;
    }
  },
  
  open() {
    TriageState.start();
    this.container.classList.remove('hidden');
    document.querySelector('.app-container')?.classList.add('hidden');
    this.render();
    setTimeout(() => {
      document.getElementById('triage-input')?.focus();
    }, 100);
  },
  
  close() {
    TriageState.clear();
    this.container.classList.add('hidden');
    document.querySelector('.app-container')?.classList.remove('hidden');
  },
  
  render() {
    const messages = TriageState.getMessages();
    const card = TriageState.getCard();
    
    this.container.innerHTML = `
      <div class="triage-split">
        <div class="triage-chat">
          <div class="triage-header">
            <button class="triage-back">← Back</button>
            <h2>Plan something</h2>
          </div>
          <div class="triage-messages" id="triage-messages">
            ${this.renderMessages(messages)}
          </div>
          <div class="triage-input-area">
            <textarea 
              id="triage-input" 
              placeholder="Dump everything here - what you're planning, what needs to happen, deadlines, constraints..."
              rows="3"
            ></textarea>
            <button id="triage-send" class="triage-send-btn">Send</button>
          </div>
        </div>
        <div class="triage-card-panel">
          ${this.renderCard(card)}
        </div>
      </div>
    `;
    
    this.bindEvents();
  },
  
  renderMessages(messages) {
    if (!messages || messages.length === 0) {
      return `
        <div class="triage-empty">
          <p>What are you trying to plan?</p>
          <p class="triage-hint">A trip, deadline, event, or anything you need to organize.</p>
        </div>
      `;
    }
    
    return messages.map(msg => `
      <div class="triage-message triage-message-${msg.role}">
        <div class="triage-message-content">${this.escapeHtml(msg.content)}</div>
      </div>
    `).join('');
  },
  
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
    
    // Locked items
    if (card.locked && card.locked.length > 0) {
      html += `
        <div class="triage-card-section">
          <h4>🔒 LOCKED IN</h4>
          <ul class="triage-list">
            ${card.locked.map(item => `<li>${this.escapeHtml(item.text)}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Todos
    if (card.todos && card.todos.length > 0) {
      html += `
        <div class="triage-card-section">
          <h4>☑️ TO DO</h4>
          <ul class="triage-list">
            ${card.todos.map(item => `
              <li>
                ${this.escapeHtml(item.text)}
                ${item.note ? `<span class="triage-note">${this.escapeHtml(item.note)}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
    
    // Insight
    if (card.insight) {
      html += `<div class="triage-insight">💡 ${this.escapeHtml(card.insight)}</div>`;
    }
    
    // Open question
    if (card.openQuestion) {
      html += `<div class="triage-question">❓ ${this.escapeHtml(card.openQuestion)}</div>`;
    }
    
    // Accept button
    html += `
      <div class="triage-actions">
        <button id="triage-accept" class="triage-accept-btn">Looks good ✓</button>
      </div>
    `;
    
    html += `</div>`;
    return html;
  },
  
  bindEvents() {
    // Back button
    this.container.querySelector('.triage-back')?.addEventListener('click', () => this.close());
    
    // Send button
    this.container.querySelector('#triage-send')?.addEventListener('click', () => this.handleSend());
    
    // Enter to send
    this.container.querySelector('#triage-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    
    // Accept button
    this.container.querySelector('#triage-accept')?.addEventListener('click', () => this.handleAccept());
  },
  
  async handleSend() {
    const input = document.getElementById('triage-input');
    const content = input.value.trim();
    if (!content) return;
    
    // Add user message
    TriageState.addUserMessage(content);
    input.value = '';
    this.updateMessages();
    
    // Show typing indicator
    this.showTyping();
    
    // Mock AI response (replace with real API in Sprint 2)
    await this.mockResponse(content);
  },
  
  showTyping() {
    const messagesEl = document.getElementById('triage-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'triage-message triage-message-assistant triage-typing';
    typingEl.innerHTML = '<div class="triage-message-content">...</div>';
    typingEl.id = 'typing-indicator';
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  },
  
  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  },
  
  async mockResponse(userInput) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    this.hideTyping();
    
    const lower = userInput.toLowerCase();
    let reply, card;
    
    // Detect trip/travel keywords for realistic mock
    if (lower.includes('trip') || lower.includes('travel') || lower.includes('toronto') || lower.includes('flight')) {
      reply = "Got it! Sounds like you're prepping for a trip. I've identified the key anchors and put together a quick plan. What time works for that shower/office visit tonight?";
      card = {
        anchor: { title: 'Toronto Trip', dates: 'Jan 19-23' },
        locked: [
          { text: 'Mom pickup: 10:00 AM' },
          { text: 'Flight: 12:50 PM' }
        ],
        todos: [
          { text: 'Start laundry', note: 'do this first - blocks packing' },
          { text: 'Plan outfits (4-5 days)' },
          { text: 'Pack: laptop, headphones, Dr. Sealy' },
          { text: 'Office for shower/hair' },
          { text: 'Check landlord login project' }
        ],
        insight: 'You have tonight + tomorrow morning before 10am. Laundry first.',
        openQuestion: 'What time works for the office tonight?'
      };
    }
    // Detect deadline/project keywords
    else if (lower.includes('deadline') || lower.includes('due') || lower.includes('project') || lower.includes('submit')) {
      reply = "Deadline mode - let's figure out what needs to happen and when. What's the actual due date/time?";
      card = {
        anchor: { title: 'Project Deadline', dates: null },
        locked: [],
        todos: [{ text: 'Clarify deadline date/time' }],
        insight: 'Need to know the hard deadline to work backwards.',
        openQuestion: 'When exactly is this due?'
      };
    }
    // Generic response
    else {
      reply = "I'm here to help you plan. Tell me more - what's the main event or deadline, and what needs to happen before/during/after?";
      card = {
        anchor: { title: 'Your Plan', dates: null },
        locked: [],
        todos: [],
        insight: 'Tell me more so I can help organize this.',
        openQuestion: 'What are the key dates or deadlines?'
      };
    }
    
    TriageState.addAssistantMessage(reply, card);
    this.updateMessages();
    this.updateCard();
  },
  
  updateMessages() {
    const messagesEl = document.getElementById('triage-messages');
    if (messagesEl) {
      messagesEl.innerHTML = this.renderMessages(TriageState.getMessages());
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },
  
  updateCard() {
    const cardPanel = this.container.querySelector('.triage-card-panel');
    if (cardPanel) {
      cardPanel.innerHTML = this.renderCard(TriageState.getCard());
      // Rebind accept button
      cardPanel.querySelector('#triage-accept')?.addEventListener('click', () => this.handleAccept());
    }
  },
  
  handleAccept() {
    const card = TriageState.getCard();
    console.log('Plan accepted:', card);
    // TODO Sprint 3: Create calendar events from card.locked
    alert('Plan accepted! (Calendar integration coming in Sprint 3)');
    TriageState.resolve();
    this.close();
  },
  
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

export default TriageUI;
```

---

## Step 5: Add CSS Styles

**File:** `style.css`

Add these styles at the END of the file:

```css
/* ============================================
   TRIAGE / PLAN MODE
   ============================================ */

#triage-container {
  position: fixed;
  inset: 0;
  background: #fff;
  z-index: 1000;
}

#triage-container.hidden {
  display: none;
}

.triage-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  height: 100dvh;
}

/* Left panel - Chat */
.triage-chat {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e5e5;
}

.triage-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.triage-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.triage-back {
  background: none;
  border: none;
  font-size: 15px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  color: #333;
}

.triage-back:hover {
  background: #f0f0f0;
}

.triage-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.triage-empty {
  text-align: center;
  color: #666;
  margin-top: 60px;
}

.triage-empty p:first-child {
  font-size: 17px;
  margin-bottom: 8px;
  color: #333;
}

.triage-hint {
  font-size: 14px;
}

.triage-message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 16px;
  line-height: 1.45;
  font-size: 15px;
}

.triage-message-user {
  align-self: flex-end;
  background: #007AFF;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.triage-message-assistant {
  align-self: flex-start;
  background: #f0f0f0;
  color: #000;
  border-bottom-left-radius: 4px;
}

.triage-typing {
  opacity: 0.6;
}

.triage-input-area {
  padding: 16px 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.triage-input-area textarea {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  line-height: 1.4;
}

.triage-input-area textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.triage-send-btn {
  padding: 10px 18px;
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.triage-send-btn:hover {
  background: #0066DD;
}

/* Right panel - Card */
.triage-card-panel {
  background: #f8f8f8;
  padding: 24px;
  overflow-y: auto;
}

.triage-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.triage-card-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: #999;
  font-size: 15px;
}

.triage-card-header {
  margin-bottom: 20px;
}

.triage-card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.triage-card-dates {
  font-size: 14px;
  color: #666;
}

.triage-card-section {
  margin-bottom: 18px;
}

.triage-card-section h4 {
  margin: 0 0 8px 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

.triage-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.triage-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.triage-list li:last-child {
  border-bottom: none;
}

.triage-note {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.triage-insight {
  background: #FFFBE6;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.4;
}

.triage-question {
  background: #f0f0f0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  font-style: italic;
}

.triage-actions {
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.triage-accept-btn {
  width: 100%;
  padding: 12px;
  background: #34C759;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.triage-accept-btn:hover {
  background: #2DB84D;
}

/* Mobile */
@media (max-width: 768px) {
  .triage-split {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .triage-chat {
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
  }
  
  .triage-card-panel {
    max-height: 45vh;
  }
}
```

---

## Step 6: Update HTML

**File:** `index.html`

### 6a. Add the triage container

Add this line right after the opening `<body>` tag (or after the main app container):

```html
<div id="triage-container" class="hidden"></div>
```

### 6b. Add the "Plan something" button

Find where the "Jot it down" button is. Add a second button next to it:

```html
<button id="plan-mode-btn" class="plan-mode-btn">🗓️ Plan something</button>
```

If there's no obvious place, add it in the header or near the quick capture input.

### 6c. Add the initialization script

Find where other JS modules are imported/initialized. Add:

```html
<script type="module">
  import TriageUI from './js/triage-ui.js';
  
  // Initialize
  TriageUI.init('triage-container');
  
  // Wire up button
  document.getElementById('plan-mode-btn')?.addEventListener('click', () => {
    TriageUI.open();
  });
</script>
```

If the app already uses a different module pattern, adapt accordingly.

### 6d. Style the entry button

Add to `style.css`:

```css
.plan-mode-btn {
  padding: 10px 16px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;
}

.plan-mode-btn:hover {
  background: #e5e5e5;
}
```

---

## Step 7: Test Locally

```bash
# Start dev server (if using vercel dev or similar)
vercel dev
# or
npx serve .
# or whatever the project uses
```

### Test checklist:

1. [ ] Page loads without console errors
2. [ ] "Plan something" button is visible
3. [ ] Clicking button shows split-screen (hides calendar)
4. [ ] Chat shows empty state ("What are you trying to plan?")
5. [ ] Card shows empty state ("Your plan will appear here")
6. [ ] Type message, press Enter → message appears (blue, right side)
7. [ ] Typing indicator shows briefly
8. [ ] Mock response appears (gray, left side)
9. [ ] Card updates with plan data
10. [ ] Type "Toronto trip" → gets travel-specific mock response
11. [ ] "Back" button closes and returns to calendar
12. [ ] "Looks good" button shows alert and closes
13. [ ] Mobile: resize browser → stacked layout works

---

## Step 8: Commit

```bash
git add .
git commit -m "feat: add Plan Mode UI shell (Sprint 1)

- Split-screen layout (chat + summary card)
- Triage state management
- Mock AI responses for testing
- Mobile responsive"
```

---

## What NOT To Do

- **Don't** add real API calls yet (that's Sprint 2)
- **Don't** add persistence/localStorage (not needed yet)
- **Don't** modify existing quick capture functionality
- **Don't** add complex animations or transitions
- **Don't** create calendar events from the accept button (Sprint 3)
- **Don't** break the existing dev panel

---

## Troubleshooting

**Module import errors:**
- Check that file paths match exactly
- Make sure script tag has `type="module"`

**Styles not applying:**
- Check that CSS was added to the correct file
- Check for typos in class names
- Inspect element to see if styles are being overridden

**Button doesn't open plan mode:**
- Check console for errors
- Verify `TriageUI.init()` was called
- Verify button has correct ID

**Split screen not showing:**
- Check that `#triage-container` exists in HTML
- Check that `.hidden` class is being removed
- Check for CSS conflicts with existing styles

---

## Done?

When all tests pass, Sprint 1 is complete. 

Next sprint: Replace mock responses with real `/api/triage` endpoint using Claude API.