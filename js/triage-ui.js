import TriageState from './triage-state.js';

const ChatUI = {
  panel: null,
  appMain: null,
  resolveContext: null, // Stores context when resolving an event

  init() {
    this.panel = document.getElementById('chat-panel');
    this.appMain = document.getElementById('app-main');

    if (!this.panel) {
      console.error('Chat panel not found');
      return;
    }

    // Listen for resolve requests from triage
    window.addEventListener('open-resolve-chat', (e) => {
      this.openWithContext(e.detail);
    });

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
      const data = await TriageState.start();
      this.render();

      // If logged in, no profile, and new conversation, suggest profile
      const { default: AuthState } = await import('./auth-state.js');
      if (AuthState.isLoggedIn() && !TriageState.getProfile() && data.isNew) {
        this.showProfileSuggestion();
      }
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
        <h3>Planning</h3>
        <div class="chat-header-actions">
          ${hasProfile ? `
            <span class="profile-badge" title="Using your profile">✓ Profile</span>
          ` : `
            <button class="chat-add-profile" title="Add profile for better help">+ Profile</button>
          `}
          <button class="chat-history" title="Past conversations">☰</button>
          <button class="chat-new" title="New conversation">+ New</button>
        </div>
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

    // Add profile button
    this.panel.querySelector('.chat-add-profile')?.addEventListener('click', async () => {
      const { default: ProfileUI } = await import('./profile-ui.js');
      ProfileUI.open();
    });

    // History button
    this.panel.querySelector('.chat-history')?.addEventListener('click', async () => {
      const { default: HistoryUI } = await import('./history-ui.js');
      HistoryUI.open();
    });

    // New conversation button
    this.panel.querySelector('.chat-new')?.addEventListener('click', async () => {
      if (confirm('Start a new conversation? Current conversation will be saved.')) {
        await TriageState.newConversation();
        this.render();
      }
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

    // Add user message to UI
    this.addMessage('user', content);

    // Check if we're in resolve mode
    if (this.resolveContext?.mode === 'resolve') {
      await this.handleResolveResponse(content);
    } else {
      // Normal chat flow
      this.showTyping();

      try {
        await TriageState.sendMessage(content);
        this.hideTyping();
        this.render();
      } catch (error) {
        this.hideTyping();
        this.showError('Failed to send message. Please try again.');
      }
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

  showProfileSuggestion() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    messagesContainer.insertAdjacentHTML('beforeend', `
      <div class="chat-profile-suggestion">
        <p>💡 <strong>Tip:</strong> Set up your profile for personalized planning help.</p>
        <button class="suggestion-setup-btn">Set Up Profile</button>
        <button class="suggestion-dismiss-btn">Maybe later</button>
      </div>
    `);

    messagesContainer.querySelector('.suggestion-setup-btn')?.addEventListener('click', async () => {
      const { default: ProfileUI } = await import('./profile-ui.js');
      ProfileUI.open();
      messagesContainer.querySelector('.chat-profile-suggestion')?.remove();
    });

    messagesContainer.querySelector('.suggestion-dismiss-btn')?.addEventListener('click', () => {
      messagesContainer.querySelector('.chat-profile-suggestion')?.remove();
    });
  },

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
  },

  // ============================================
  // RESOLVE FLOW
  // ============================================

  /**
   * Open chat with pre-loaded context for resolving an event
   */
  openWithContext(context) {
    const { eventId, eventTitle, prompt, event } = context;

    // Store context for when user responds
    this.resolveContext = {
      eventId,
      event,
      mode: 'resolve'
    };

    // Ensure panel is visible
    this.panel.classList.remove('hidden');
    this.panel.classList.add('open');
    this.appMain?.classList.add('chat-open');

    // Clear previous conversation for resolve flow
    this.renderResolveMode(prompt);

    // Focus the input
    this.focusInput();
  },

  /**
   * Render resolve mode with initial prompt
   */
  renderResolveMode(prompt) {
    this.panel.innerHTML = `
      <div class="chat-panel-header">
        <h3>Resolve Event</h3>
        <button id="chat-panel-close" class="chat-panel-close">×</button>
      </div>

      <div class="chat-panel-messages" id="chat-messages">
        <div class="chat-message chat-message-assistant">
          ${this.formatContent(prompt)}
        </div>
      </div>

      <div class="chat-panel-input">
        <textarea
          id="chat-input"
          placeholder="Tell me when..."
          rows="2"
        ></textarea>
        <button id="chat-send" class="chat-send-btn">Send</button>
      </div>
    `;

    this.bindEvents();
    this.scrollToBottom();
  },

  /**
   * Add a message to the chat
   */
  addMessage(role, content) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.insertAdjacentHTML('beforeend', `
      <div class="chat-message chat-message-${role}">
        ${this.formatContent(content)}
      </div>
    `);
    this.scrollToBottom();
  },

  /**
   * Clear all messages
   */
  clearMessages() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.innerHTML = '';
    }
  },

  /**
   * Focus the input field
   */
  focusInput() {
    const input = document.getElementById('chat-input');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  },

  /**
   * Handle user response in resolve mode
   */
  async handleResolveResponse(text) {
    const { eventId, event } = this.resolveContext;

    this.showTyping();

    try {
      // Send to resolve endpoint
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

      if (!response.ok) throw new Error('Resolve API failed');

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
        if (window.TriagePanel?.isOpen) {
          window.TriagePanel.refresh();
        }

        // Show confirmation
        this.addMessage('assistant', '✓ Updated! The event is now on your calendar.');
      }

    } catch (error) {
      this.hideTyping();
      this.addMessage('assistant', 'Sorry, something went wrong. Can you try again?');
      console.error('Resolve error:', error);
    }
  },

  /**
   * Apply updates to an event
   */
  async applyEventUpdates(eventId, updates) {
    const response = await fetch('/api/events', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...await this.getAuthHeaders()
      },
      body: JSON.stringify({
        id: eventId,
        ...updates,
        needsTriage: false // Clear the flag
      })
    });

    if (!response.ok) throw new Error('Failed to update event');

    // Also refresh the calendar if it's visible
    if (typeof renderCalendar === 'function') {
      renderCalendar();
    }
  },

  /**
   * Get auth headers for API requests
   */
  async getAuthHeaders() {
    try {
      const { default: AuthState } = await import('./auth-state.js');
      const token = AuthState.getToken();
      if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
    } catch (e) {
      // Auth not available or not needed
    }
    return {};
  }
};

export default ChatUI;
