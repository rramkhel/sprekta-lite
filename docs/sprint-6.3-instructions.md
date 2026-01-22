 Sprint 6.3 Complete! ✅

  Successfully integrated the frontend with the Supabase API. The application now persists conversations to the database
  instead of using localStorage.

  Changes Made:

  1. Created js/session.js

  - Session ID management using sessionStorage
  - getId() - generates and retrieves session ID
  - regenerate() - creates new session for "New conversation"
  - Sessions are ephemeral (cleared when tab closes)

  2. Updated js/triage-state.js

  - Replaced localStorage with API calls
  - start() - creates/resumes conversation via API
  - loadMessages() - fetches conversation history
  - sendMessage() - posts message and gets AI response
  - newConversation() - regenerates session and starts fresh
  - Optimistic UI updates (shows user message immediately)

  3. Updated js/triage-ui.js

  - Async methods for all chat operations
  - open() - shows loading state, then starts/resumes conversation
  - render() - displays messages with markdown formatting (**bold**)
  - renderLoading() - animated typing indicator
  - renderError() - error message with "Try again" button
  - handleSend() - optimistic update + typing indicator

  4. Added Loading/Error Styles to style.css

  - .chat-loading - centered loading state
  - .typing-indicator - animated 3-dot bounce
  - .chat-error - error message display
  - .chat-retry - retry button
  - .chat-error-message - inline error messages

  How It Works:

  First Visit:
  1. User clicks "Plan Mode" → Chat panel opens
  2. Session ID generated and stored in sessionStorage
  3. API creates new conversation linked to session
  4. User chats → messages saved to Supabase

  Same Session (close/reopen panel):
  1. Chat panel opens → same session ID
  2. API returns existing conversation ID
  3. Messages load from database
  4. Conversation continues where it left off

  New Tab or Refresh:
  1. New session ID generated
  2. Previous conversations not accessible (ephemeral design)
  3. Clean slate for new planning session

  Test the Integration:

  Open http://localhost:3000 and:
  - Click "Plan Mode" button → Should see loading indicator, then empty chat
  - Send a message → Should see typing indicator, then AI reply with bold formatting
  - Close and reopen chat → Messages should persist
  - Refresh page → New session, messages cleared

  Sprint 6.3 is ready for Sprint 6.4: Account Foundation (Supabase Auth + claim conversations).


----



# Sprint 6.3: Frontend Integration

## Goal

Update the frontend to use the new API instead of localStorage. Session ID management, API calls, state sync.

---

## Files to Modify

```
js/
  triage-state.js    ← Add API methods, session ID
  triage-ui.js       ← Use new state methods, remove localStorage
  session.js         ← NEW: session ID management
```

---

## Task 1: Session Management

**File:** `js/session.js` (NEW)

```javascript
/**
 * Session ID management
 * Uses sessionStorage - clears when tab closes
 */

const SESSION_KEY = 'sprekta-session-id';

const Session = {
  getId() {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  },

  clear() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  // Generate new session (for "New conversation")
  regenerate() {
    const newId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, newId);
    return newId;
  }
};

export default Session;
```

---

## Task 2: Update State Manager

**File:** `js/triage-state.js`

Replace localStorage logic with API calls:

```javascript
import Session from './session.js';

const API_BASE = '/api/conversation';

const TriageState = {
  conversationId: null,
  messages: [],
  profile: null,
  status: 'idle', // idle, loading, active, error

  // Initialize - check for existing conversation
  async init() {
    // Don't auto-load on init - wait for user to open chat
  },

  // Start or resume conversation
  async start(profileText = null) {
    this.status = 'loading';
    this.profile = profileText;

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: Session.getId(),
          profileText: profileText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      this.conversationId = data.conversationId;

      // If existing conversation, load messages
      if (!data.isNew) {
        await this.loadMessages();
      } else {
        this.messages = [];
      }

      this.status = 'active';
      return { conversationId: this.conversationId, isNew: data.isNew };

    } catch (error) {
      console.error('Failed to start conversation:', error);
      this.status = 'error';
      throw error;
    }
  },

  // Load messages for current conversation
  async loadMessages() {
    if (!this.conversationId) return;

    try {
      const response = await fetch(`${API_BASE}/${this.conversationId}`, {
        headers: { 'X-Session-Id': Session.getId() }
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      this.messages = data.messages || [];
      this.profile = data.conversation.profile_text;

    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error;
    }
  },

  // Send message and get AI response
  async sendMessage(content) {
    if (!this.conversationId) {
      throw new Error('No active conversation');
    }

    // Optimistically add user message
    const userMessage = {
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    this.messages.push(userMessage);

    try {
      const response = await fetch(`${API_BASE}/${this.conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': Session.getId()
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: data.reply,
        phase: data.phase,
        created_at: new Date().toISOString()
      };
      this.messages.push(assistantMessage);

      return assistantMessage;

    } catch (error) {
      // Remove optimistic message on error
      this.messages.pop();
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // Clear and start new conversation
  async newConversation(profileText = null) {
    Session.regenerate();
    this.conversationId = null;
    this.messages = [];
    this.profile = profileText;
    this.status = 'idle';

    return this.start(profileText);
  },

  // Getters
  getMessages() {
    return this.messages;
  },

  getProfile() {
    return this.profile;
  },

  isActive() {
    return this.status === 'active';
  },

  isLoading() {
    return this.status === 'loading';
  }
};

export default TriageState;
```

---

## Task 3: Update UI

**File:** `js/triage-ui.js`

Update to use async state methods. This replaces the current implementation:

```javascript
import TriageState from './triage-state.js';

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

    // Initial render (empty/loading state)
    this.renderClosed();
  },

  async open() {
    // Show panel
    this.panel.classList.remove('hidden');
    this.panel.classList.add('open');
    this.appMain?.classList.add('chat-open');

    // Show loading state
    this.renderLoading();

    try {
      // Start or resume conversation
      await TriageState.start();
      this.render();
    } catch (error) {
      this.renderError('Failed to load conversation');
    }
  },

  close() {
    this.panel.classList.remove('open');
    this.appMain?.classList.remove('chat-open');
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
  // RENDERING
  // ============================================

  renderClosed() {
    // Panel exists but is hidden - no need to render content
  },

  render() {
    const messages = TriageState.getMessages();
    const hasProfile = !!TriageState.getProfile();

    this.panel.innerHTML = `
      <div class="chat-panel-header">
        <h3>Planning ${hasProfile ? '<span class="chat-profile-badge">✓</span>' : ''}</h3>
        <button id="chat-panel-close" class="chat-panel-close">×</button>
      </div>

      <div class="chat-panel-messages" id="chat-messages">
        ${this.renderMessages(messages)}
      </div>

      <div class="chat-panel-input">
        <textarea
          id="chat-input"
          placeholder="What's on your mind?"
          rows="2"
        ></textarea>
        <button id="chat-send" class="chat-send-btn">Send</button>
      </div>
    `;

    this.bindEvents();
    this.scrollToBottom();
  },

  renderLoading() {
    this.panel.innerHTML = `
      <div class="chat-panel-header">
        <h3>Planning</h3>
        <button id="chat-panel-close" class="chat-panel-close">×</button>
      </div>

      <div class="chat-loading">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
        <p>Loading conversation...</p>
      </div>
    `;

    // Bind close button even in loading state
    document.getElementById('chat-panel-close')?.addEventListener('click', () => this.close());
  },

  renderError(message) {
    this.panel.innerHTML = `
      <div class="chat-panel-header">
        <h3>Planning</h3>
        <button id="chat-panel-close" class="chat-panel-close">×</button>
      </div>

      <div class="chat-error">
        <p>${message}</p>
        <button class="chat-retry">Try again</button>
      </div>
    `;

    document.getElementById('chat-panel-close')?.addEventListener('click', () => this.close());
    this.panel.querySelector('.chat-retry')?.addEventListener('click', () => this.open());
  },

  renderMessages(messages) {
    if (!messages || messages.length === 0) {
      return `
        <div class="chat-empty">
          <p>What are you trying to figure out?</p>
          <p>Talk through a trip, deadline, overwhelming week, or anything on your mind.</p>
        </div>
      `;
    }

    return messages.map(msg => `
      <div class="chat-message chat-message-${msg.role}">
        ${this.formatContent(msg.content)}
      </div>
    `).join('');
  },

  formatContent(content) {
    if (!content) return '';
    // Basic markdown-ish formatting
    return this.escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  },

  // ============================================
  // EVENTS
  // ============================================

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

  async handleSend() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;

    input.value = '';

    // Re-render with optimistic user message
    this.render();

    // Show typing indicator
    this.showTyping();

    try {
      await TriageState.sendMessage(content);
      this.hideTyping();
      this.render();
    } catch (error) {
      this.hideTyping();
      this.showError('Failed to send message. Please try again.');
    }
  },

  showTyping() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message chat-message-assistant chat-typing';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = '<span>...</span>';
    container.appendChild(typingEl);
    this.scrollToBottom();
  },

  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  },

  showError(message) {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.insertAdjacentHTML('beforeend', `
        <div class="chat-error-message">${message}</div>
      `);
    }
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  // ============================================
  // UTILITIES
  // ============================================

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // For test scenarios (dev panel)
  sendMessage(content) {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = content;
      this.handleSend();
    }
  }
};

export default ChatUI;
```

---

## Task 4: Add Loading/Error Styles

**File:** `style.css`

Add styles for loading and error states:

```css
/* Loading State */
.chat-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #6366f1;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Error State */
.chat-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #dc2626;
}

.chat-error p {
  margin-bottom: 16px;
}

.chat-retry {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.chat-retry:hover {
  background: #4f46e5;
}

.chat-error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin: 8px 0;
}

/* Profile Badge */
.chat-profile-badge {
  font-size: 11px;
  color: #34C759;
  background: #E8F9ED;
  padding: 3px 8px;
  border-radius: 10px;
  margin-left: 8px;
}
```

---

## Checklist

- [ ] `js/session.js` created
- [ ] `triage-state.js` updated with API methods
- [ ] `triage-ui.js` updated with async flow
- [ ] Opening chat starts/resumes conversation
- [ ] Messages load from database
- [ ] Sending message calls API, saves to database
- [ ] Loading and error states work
- [ ] Closing and reopening chat preserves messages (same session)
- [ ] Refreshing page creates new session (messages gone)

---

## Commit

```bash
git add js/session.js js/triage-state.js js/triage-ui.js style.css
git commit -m "feat: frontend uses Supabase API (Sprint 6.3)

- Session ID management (sessionStorage)
- State manager uses API endpoints
- Async conversation start/resume
- Messages persist within same tab session
- Loading and error states
- Optimistic UI updates"
```

---

## Notes

### Why sessionStorage, Not localStorage?

**sessionStorage** = clears when tab closes
**localStorage** = persists forever

For anonymous users, we want conversations to be ephemeral. When you close the tab, the session is gone. This matches the mental model of a "planning session."

If users want persistence, they can log in (Sprint 6.4).

### Optimistic Updates

When the user sends a message, we:
1. Immediately add it to the local state
2. Re-render to show it
3. Send the API request
4. If it fails, remove the message and show an error

This makes the UI feel instant, even if the network is slow.

### Error Recovery

If loading fails, we show a "Try again" button. Clicking it calls `open()` again, which re-attempts the conversation start.

---

Ready for Sprint 6.4 (Account Foundation)?
