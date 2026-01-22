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
      const data = await TriageState.start();
      this.render();

      // If logged in, no profile, and new conversation, suggest profile
      const { default: AuthUI } = await import('./auth-ui.js');
      if (AuthUI.isLoggedIn() && !TriageState.getProfile() && data.isNew) {
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
  }
};

export default ChatUI;
