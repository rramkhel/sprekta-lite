import TriageState from './triage-state.js';

const ChatUI = {
  panel: null,
  appMain: null,
  resolveContext: null, // Stores context when resolving an event
  eventsBound: false, // Track if event listeners are already attached
  conversationLoaded: false, // Track if conversation is already loaded

  init() {
    // Use the sidebar tab content instead of panel
    this.panel = document.getElementById('tab-chat');
    this.appMain = document.getElementById('app-main');

    if (!this.panel) {
      console.error('Chat tab not found');
      return;
    }

    // Listen for resolve requests from triage
    window.addEventListener('open-resolve-chat', (e) => {
      this.openWithContext(e.detail);
    });

    // Bind events once on the fixed HTML structure
    this.bindEvents();

    // Initial render (empty/loading state)
    this.render();

    // Load conversation on init since chat tab is visible by default
    this.loadConversation();
  },

  async open() {
    // Switch to chat tab via SidebarTabs
    if (window.SidebarTabs) {
      window.SidebarTabs.switchTo('chat');
    }

    // Load conversation if not already loaded
    if (!this.conversationLoaded) {
      await this.loadConversation();
    }
  },

  async loadConversation() {
    // Prevent multiple simultaneous loads
    if (this.conversationLoaded) return;

    // Show loading state
    this.renderLoading();

    try {
      // Start or resume conversation
      await TriageState.start();
      this.render();
      this.conversationLoaded = true;
    } catch (error) {
      this.renderError('Failed to load conversation');
    }
  },

  close() {
    // Can't really "close" the sidebar, but we can switch away from chat
    // For now, do nothing - chat is always accessible via tabs
  },

  toggle() {
    // Toggle to chat tab
    if (window.SidebarTabs) {
      window.SidebarTabs.switchTo('chat');
    }
  },

  isOpen() {
    // Chat tab is considered "open" if it's the active tab
    return window.SidebarTabs?.activeTab === 'chat';
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

    // Update messages container only
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = this.renderMessages(messages);
    }

    this.scrollToBottom();
  },

  renderLoading() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="chat-loading">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>Loading conversation...</p>
        </div>
      `;
    }
  },

  renderError(message) {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="chat-error">
          <p>${message}</p>
          <button class="chat-retry">Try again</button>
        </div>
      `;
    }

    messagesContainer?.querySelector('.chat-retry')?.addEventListener('click', () => this.loadConversation());
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
    // Only bind once
    if (this.eventsBound) return;
    this.eventsBound = true;

    // Close button is handled by PanelManager (.panel-close[data-panel="chat"])

    // Send button - use event delegation from panel
    this.panel.addEventListener('click', (e) => {
      if (e.target.id === 'chat-send' || e.target.closest('#chat-send')) {
        this.handleSend();
      }

      // New chat button
      if (e.target.id === 'chat-new' || e.target.closest('#chat-new')) {
        this.handleNewChat();
      }
    });

    // Enter to send (shift+enter for newline) - use event delegation
    this.panel.addEventListener('keydown', (e) => {
      if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey) {
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

  async handleNewChat() {
    // Confirm with user if there are messages
    const messages = TriageState.getMessages();
    if (messages && messages.length > 0) {
      if (!confirm('Start a new conversation? Your current conversation will be saved.')) {
        return;
      }
    }

    // Show loading
    this.renderLoading();

    try {
      // Start new conversation
      await TriageState.newConversation();
      // Render empty state
      this.render();
      // Keep conversation loaded flag as true (we just loaded a new conversation)
      this.conversationLoaded = true;
    } catch (error) {
      this.renderError('Failed to start new conversation');
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
  },

  // Focus the input field (called from button handler)
  focus() {
    this.focusInput();
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

    // Switch to chat tab
    if (window.SidebarTabs) {
      window.SidebarTabs.switchTo('chat');
    }

    // Clear previous conversation for resolve flow
    this.renderResolveMode(prompt);

    // Focus the input
    this.focusInput();
  },

  /**
   * Render resolve mode with initial prompt
   */
  renderResolveMode(prompt) {
    // Update messages
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="chat-message chat-message-assistant">
          ${this.formatContent(prompt)}
        </div>
      `;
    }

    // Update input placeholder
    const input = document.getElementById('chat-input');
    if (input) {
      input.placeholder = 'Tell me when...';
    }

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
