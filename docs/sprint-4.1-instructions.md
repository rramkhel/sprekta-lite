⏺ Sprint 4.1 implementation is complete! Here's what I've done:

  Completed Tasks:

  1. Updated HTML structure (index.html:18-34, 37)
    - Replaced full-screen triage-container with new chat-panel side panel
    - Wrapped calendar in app-main div for resize capability
    - Updated initialization to use ChatUI.toggle() instead of TriageUI.open()
  2. Added side panel CSS styles (style.css:1601-1800)
    - .app-main - Shrinks to 60% width when chat is open
    - .chat-panel - 40% width panel that slides in from right
    - .chat-message-* - Message bubble styles for user/assistant
    - Mobile layout - Stacked 50/50 split on mobile devices
  3. Rewrote triage-ui.js (js/triage-ui.js)
    - Converted from TriageUI to ChatUI module
    - Changed from full-screen to side panel behavior
    - Added localStorage persistence (saves on close, loads on init)
    - Removed card display (scratchpad mode only)
    - Added toggle() method for open/close
  4. Updated API prompt (api/triage.js:82-118)
    - Changed from structured planning to conversational mode
    - AI now listens, asks questions, explores options
    - No immediate structured output (just {"reply": "..."})
    - Profile-aware but subtle

  Key Features:

  ✅ Side panel opens on right (40% width)✅ Calendar stays visible and interactive (60% width)✅ Conversation persists
  in localStorage✅ AI is conversational, not immediately structured✅ Mobile: stacked layout (50/50 vertical split)✅
  Smooth animations (0.3s slide-in)✅ Profile automatically loaded when present

  The implementation follows Sprint 4.1 specifications - the chat is now a persistent side panel that works alongside the
   calendar rather than hiding it. Ready for you to test!

---

# Sprint 4.1: Side Panel Chat Layout

## Sprint Goal

Restructure Plan Mode from full-screen takeover to a side panel. Calendar stays visible and interactive while chatting.

---

## Current State

**What exists:**
- `js/triage-ui.js` - Full-screen triage with split view (chat + card)
- `js/triage-state.js` - Session state (lost on close)
- Full-screen container hides calendar completely
- Card appears immediately with first AI response

**What we're building:**
- Side panel layout (chat right, calendar left)
- Calendar stays visible and usable
- Chat persists when closed/reopened
- Remove card display (for now - comes back in 4.2)

---

## Task 1: Update HTML Structure

**File:** `index.html`

### 1a. Remove or repurpose triage-container

Find:
```html
<div id="triage-container" class="hidden"></div>
```

Replace with a side panel container:
```html
<!-- Planning Chat Side Panel -->
<div id="chat-panel" class="chat-panel hidden">
  <div class="chat-panel-header">
    <h3>Planning</h3>
    <button id="chat-panel-close" class="chat-panel-close">×</button>
  </div>
  <div class="chat-panel-messages" id="chat-messages">
    <!-- Messages render here -->
  </div>
  <div class="chat-panel-input">
    <textarea 
      id="chat-input" 
      placeholder="What's on your mind?"
      rows="2"
    ></textarea>
    <button id="chat-send" class="chat-send-btn">Send</button>
  </div>
</div>
```

### 1b. Add wrapper for calendar resize

Wrap the existing calendar view:
```html
<div id="app-main" class="app-main">
  <!-- existing calendar-view content goes here -->
</div>
```

---

## Task 2: Add Side Panel Styles

**File:** `style.css`

Add these styles (can replace old triage styles or add alongside):

```css
/* ============================================
   HYBRID LAYOUT: Calendar + Chat Panel
   ============================================ */

/* Main app area - shrinks when chat is open */
.app-main {
  transition: width 0.3s ease, margin-right 0.3s ease;
  width: 100%;
}

.app-main.chat-open {
  width: 60%;
}

/* Chat Side Panel */
.chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 40%;
  height: 100vh;
  height: 100dvh;
  background: #fff;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.chat-panel.open {
  transform: translateX(0);
}

.chat-panel.hidden {
  display: flex; /* Keep in DOM for persistence */
  transform: translateX(100%);
}

/* Panel Header */
.chat-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
}

.chat-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chat-panel-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.chat-panel-close:hover {
  color: #333;
}

/* Messages Area */
.chat-panel-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-empty {
  color: #999;
  text-align: center;
  margin-top: 40px;
}

.chat-empty p:first-child {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.chat-empty p:last-child {
  font-size: 14px;
}

/* Message Bubbles */
.chat-message {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.45;
}

.chat-message-user {
  align-self: flex-end;
  background: #007AFF;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-message-assistant {
  align-self: flex-start;
  background: #f0f0f0;
  color: #000;
  border-bottom-left-radius: 4px;
}

.chat-typing {
  opacity: 0.6;
}

/* Input Area */
.chat-panel-input {
  padding: 16px 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  background: #fff;
}

.chat-panel-input textarea {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  line-height: 1.4;
  max-height: 120px;
}

.chat-panel-input textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.chat-send-btn {
  padding: 10px 16px;
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.chat-send-btn:hover {
  background: #0066DD;
}

/* Profile badge in header (optional) */
.chat-profile-badge {
  font-size: 11px;
  color: #34C759;
  background: #E8F9ED;
  padding: 3px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

/* ============================================
   MOBILE: Stacked Layout
   ============================================ */

@media (max-width: 768px) {
  .app-main.chat-open {
    width: 100%;
    height: 50vh;
    overflow: hidden;
  }
  
  .chat-panel {
    width: 100%;
    height: 50vh;
    top: auto;
    bottom: 0;
    transform: translateY(100%);
    border-left: none;
    border-top: 1px solid #e5e5e5;
  }
  
  .chat-panel.open {
    transform: translateY(0);
  }
}
```

---

## Task 3: Rewrite Triage UI Module

**File:** `js/triage-ui.js`

Complete rewrite for side panel approach:

```javascript
/**
 * Planning Chat UI - Side Panel
 */

import TriageState from './triage-state.js';

const STORAGE_KEY = 'sprekta_chat_session';

const ChatUI = {
  panel: null,
  appMain: null,
  
  init() {
    this.panel = document.getElementById('chat-panel');
    this.appMain = document.getElementById('app-main');
    
    if (!this.panel) {
      console.error('Chat panel not found');
      return;
    }
    
    // Load persisted session
    this.loadSession();
    
    // Bind events
    this.bindEvents();
    
    // Initial render
    this.renderMessages();
  },
  
  bindEvents() {
    // Close button
    document.getElementById('chat-panel-close')?.addEventListener('click', () => {
      this.close();
    });
    
    // Send button
    document.getElementById('chat-send')?.addEventListener('click', () => {
      this.handleSend();
    });
    
    // Enter to send (shift+enter for newline)
    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
  },
  
  open() {
    // Start session if none exists
    if (!TriageState.isActive()) {
      TriageState.start();
    }
    
    // Show panel
    this.panel.classList.remove('hidden');
    this.panel.classList.add('open');
    this.appMain?.classList.add('chat-open');
    
    // Render and focus
    this.renderMessages();
    setTimeout(() => {
      document.getElementById('chat-input')?.focus();
    }, 300); // After animation
  },
  
  close() {
    this.panel.classList.remove('open');
    this.appMain?.classList.remove('chat-open');
    
    // Save session for persistence
    this.saveSession();
    
    // Don't clear state - conversation persists!
  },
  
  toggle() {
    if (this.panel.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  },
  
  isOpen() {
    return this.panel.classList.contains('open');
  },
  
  // ============================================
  // PERSISTENCE
  // ============================================
  
  saveSession() {
    if (TriageState.session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(TriageState.session));
    }
  },
  
  loadSession() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        TriageState.session = session;
      } catch (e) {
        console.error('Failed to load chat session:', e);
      }
    }
  },
  
  clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    TriageState.clear();
    this.renderMessages();
  },
  
  // ============================================
  // RENDERING
  // ============================================
  
  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    const messages = TriageState.getMessages();
    const hasProfile = !!localStorage.getItem('userProfile');
    
    if (!messages || messages.length === 0) {
      container.innerHTML = `
        <div class="chat-empty">
          <p>What are you trying to figure out?</p>
          <p>Talk through a trip, deadline, overwhelming week, or anything on your mind.</p>
          ${hasProfile ? '<span class="chat-profile-badge">✓ Profile loaded</span>' : ''}
        </div>
      `;
      return;
    }
    
    container.innerHTML = messages.map(msg => `
      <div class="chat-message chat-message-${msg.role}">
        ${this.escapeHtml(msg.content)}
      </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
  },
  
  showTyping() {
    const container = document.getElementById('chat-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message chat-message-assistant chat-typing';
    typingEl.id = 'typing-indicator';
    typingEl.textContent = '...';
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
  },
  
  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  },
  
  // ============================================
  // SENDING MESSAGES
  // ============================================
  
  async handleSend() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;
    
    // Add user message
    TriageState.addUserMessage(content);
    input.value = '';
    this.renderMessages();
    this.showTyping();
    
    try {
      const response = await this.callAPI(content);
      this.hideTyping();
      
      // Add assistant message (no card for now - scratchpad mode)
      TriageState.addAssistantMessage(response.reply, null);
      this.renderMessages();
      
      // Save after each exchange
      this.saveSession();
      
    } catch (error) {
      this.hideTyping();
      console.error('Chat API error:', error);
      TriageState.addAssistantMessage(
        "Sorry, I had trouble with that. Can you try again?",
        null
      );
      this.renderMessages();
    }
  },
  
  async callAPI(newMessage) {
    const messages = TriageState.getMessages();
    const profile = localStorage.getItem('userProfile');
    
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
  
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

export default ChatUI;
```

---

## Task 4: Update Initialization

**File:** `index.html`

Find the existing triage initialization and replace:

```html
<script type="module">
  import ChatUI from './js/triage-ui.js';
  import ProfileUI from './js/profile-ui.js';

  // Initialize
  ChatUI.init();
  ProfileUI.init('profile-container');

  // Wire up buttons
  document.getElementById('plan-mode-btn')?.addEventListener('click', () => {
    ChatUI.toggle();
  });

  document.getElementById('profile-btn')?.addEventListener('click', () => {
    ProfileUI.open();
  });
</script>
```

---

## Task 5: Update API System Prompt

**File:** `api/triage.js`

Update the system prompt to be more conversational (no immediate card):

```javascript
function buildSystemPrompt(profile) {
  let prompt = `You are a planning assistant helping someone think through their schedule, commitments, and overwhelm.

Your approach:
1. LISTEN first - understand what they're dealing with
2. ASK clarifying questions - don't assume you know everything
3. EXPLORE options - help them think, don't just give answers
4. ONLY structure when ready - wait until they want to make concrete plans

This is a CONVERSATION, not a form to fill out. Be natural, be curious, be helpful.

For now, respond with just text. Keep it conversational. Ask ONE question at a time.
Don't list out plans or create structure until they explicitly ask for it or say they're ready.

Respond with JSON:
{
  "reply": "Your conversational response here"
}

Keep responses concise - 2-3 sentences usually. Don't overwhelm with information.`;

  if (profile) {
    prompt += `

---

USER PROFILE:
${profile}

---

Use this to understand their context, but don't immediately reference every detail. 
Let it inform your questions naturally.`;
  }

  return prompt;
}
```

---

## Task 6: Wrap Calendar in app-main

**File:** `index.html`

Find the calendar view and wrap it:

```html
<div id="app-main" class="app-main">
  <div id="calendar-view" class="view active">
    <!-- existing calendar content -->
  </div>
</div>
```

Make sure the chat panel is OUTSIDE this wrapper (sibling, not child).

---

## Testing Checklist

### Layout
- [ ] "Plan something" opens chat panel on right
- [ ] Calendar shrinks to ~60% width
- [ ] Calendar still visible and scrollable
- [ ] Can click events on calendar while chat is open
- [ ] Can drag events while chat is open
- [ ] Can navigate months while chat is open
- [ ] "×" closes panel, calendar returns to full width

### Chat Behavior
- [ ] Empty state shows "What are you trying to figure out?"
- [ ] Can type and send messages
- [ ] AI responds conversationally (not with structured plan)
- [ ] Multiple back-and-forth messages work
- [ ] Typing indicator shows during API call

### Persistence
- [ ] Close panel, reopen → conversation still there
- [ ] Refresh page → conversation still there
- [ ] Close browser, reopen → conversation still there

### Mobile
- [ ] Panel slides up from bottom (50% height)
- [ ] Calendar visible in top half
- [ ] Can scroll both areas

### Existing Features
- [ ] Jot it down (Quick Capture) still works
- [ ] Profile page still works
- [ ] Calendar events still work
- [ ] No console errors

---

## Success Criteria

Sprint 4.1 is complete when:
1. ✅ Chat is a side panel, not full-screen
2. ✅ Calendar visible and interactive while chatting
3. ✅ Conversation persists (localStorage)
4. ✅ AI is conversational (no immediate structure)
5. ✅ Mobile layout works
6. ✅ Quick Capture unchanged

---

## What's NOT in This Sprint

- Card/structure (that's 4.2)
- "Ready to plan" detection (that's 4.2)
- Clear conversation button (nice to have, later)
- Multiple threads (out of scope)

---

## Commit

```bash
git add .
git commit -m "feat: side panel chat layout (Sprint 4.1)

- Chat opens as side panel, calendar stays visible
- Conversation persists in localStorage
- AI is conversational, no immediate structure
- Mobile: stacked layout"
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `index.html` | Add chat-panel HTML, wrap calendar in app-main, update init |
| `style.css` | Side panel styles, app-main resize, mobile layout |
| `js/triage-ui.js` | Complete rewrite for side panel approach |
| `api/triage.js` | Update system prompt for conversational mode |

---

## Estimated Time

| Task | Estimate |
|------|----------|
| Task 1: HTML structure | 15 min |
| Task 2: CSS styles | 25 min |
| Task 3: Rewrite triage-ui | 35 min |
| Task 4: Update init | 5 min |
| Task 5: Update API prompt | 10 min |
| Task 6: Wrap calendar | 5 min |
| Testing | 25 min |
| **Total** | **~2 hours** |
