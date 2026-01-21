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
