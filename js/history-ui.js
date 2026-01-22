import AuthUI from './auth-ui.js';
import TriageState from './triage-state.js';

const API_BASE = '/api/conversations';

const HistoryUI = {
  container: null,
  conversations: [],
  isOpen: false,

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  async open() {
    if (!AuthUI.isLoggedIn()) {
      alert('Please sign in to view conversation history');
      return;
    }

    this.isOpen = true;
    this.container.classList.remove('hidden');

    await this.loadConversations();
    this.render();
  },

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  },

  async loadConversations() {
    try {
      const token = await AuthUI.getAccessToken();

      const response = await fetch(API_BASE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load conversations');

      const data = await response.json();
      this.conversations = data.conversations || [];

    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.conversations = [];
    }
  },

  async archiveConversation(id) {
    try {
      const token = await AuthUI.getAccessToken();

      const response = await fetch(`/api/conversation/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to archive conversation');

      // Reload conversations
      await this.loadConversations();
      this.render();

      return true;
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      return false;
    }
  },

  async resumeConversation(id) {
    await TriageState.resumeConversation(id);
    this.close();
  },

  render() {
    const activeConvs = this.conversations.filter(c => c.status === 'active');
    const pastConvs = this.conversations.filter(c => c.status === 'resolved');

    this.container.innerHTML = `
      <div class="history-modal">
        <div class="history-modal-content">
          <div class="history-header">
            <h2>Conversation History</h2>
            <button class="history-close">×</button>
          </div>

          <div class="history-body">
            ${activeConvs.length > 0 ? `
              <div class="history-section">
                <h3>Active</h3>
                <div class="history-list">
                  ${activeConvs.map(c => this.renderConversationItem(c, true)).join('')}
                </div>
              </div>
            ` : ''}

            ${pastConvs.length > 0 ? `
              <div class="history-section">
                <h3>Past</h3>
                <div class="history-list">
                  ${pastConvs.map(c => this.renderConversationItem(c, false)).join('')}
                </div>
              </div>
            ` : ''}

            ${this.conversations.length === 0 ? `
              <div class="history-empty">
                <p>No conversations yet</p>
                <p>Start a new planning conversation to see it here!</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  renderConversationItem(conv, isActive) {
    const title = conv.title || 'Untitled conversation';
    const preview = conv.preview ? this.truncate(conv.preview, 60) : 'No messages yet';
    const date = this.formatDate(conv.updated_at);
    const messageCount = conv.messageCount || 0;

    return `
      <div class="history-item" data-id="${conv.id}">
        <div class="history-item-main">
          <div class="history-item-title">${this.escapeHtml(title)}</div>
          <div class="history-item-preview">${this.escapeHtml(preview)}</div>
          <div class="history-item-meta">
            <span>${date}</span>
            <span>•</span>
            <span>${messageCount} message${messageCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="history-item-actions">
          <button class="history-resume-btn" data-id="${conv.id}">Resume</button>
          ${isActive ? `<button class="history-archive-btn" data-id="${conv.id}">Archive</button>` : ''}
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Close button
    this.container.querySelector('.history-close')?.addEventListener('click', () => this.close());

    // Resume buttons
    this.container.querySelectorAll('.history-resume-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await this.resumeConversation(id);
      });
    });

    // Archive buttons
    this.container.querySelectorAll('.history-archive-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Archive this conversation?')) {
          await this.archiveConversation(id);
        }
      });
    });
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString();
  },

  truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

export default HistoryUI;
