import Session from './session.js';
import AuthState from './auth-state.js';

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

  // Get headers for API calls
  async getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-Id': Session.getId()
    };

    // Add auth token if logged in
    const token = await AuthState.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  // Start or resume conversation
  async start(profileText = null, options = {}) {
    this.status = 'loading';
    this.profile = profileText;

    const { forceNew = false } = options;

    try {
      const headers = await this.getHeaders();

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId: Session.getId(),
          profileText: profileText,
          forceNew: forceNew
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
      const headers = await this.getHeaders();
      delete headers['Content-Type']; // GET request doesn't need this

      const response = await fetch(`${API_BASE}/${this.conversationId}`, {
        headers
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
      const headers = await this.getHeaders();

      // Check if profile should be used (dev panel toggle)
      let includeProfile = true;
      try {
        const devPanel = await import('../dev-panel.js');
        if (devPanel.default?.shouldUseProfile) {
          includeProfile = devPanel.default.shouldUseProfile();
        }
      } catch (e) {
        // Dev panel not available, default to true
      }

      const response = await fetch(`${API_BASE}/${this.conversationId}/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content,
          includeProfile
        })
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

      // Sprint 14.1: Refresh calendar if events were created
      if (data.eventsCreated && data.eventsCreated > 0) {
        console.log(`[Chat] ${data.eventsCreated} events created, refreshing calendar`);

        // Trigger calendar refresh
        if (window.renderCalendar && typeof window.renderCalendar === 'function') {
          window.renderCalendar();
        }

        // Dispatch event for any other listeners
        window.dispatchEvent(new CustomEvent('eventsChanged', {
          detail: {
            count: data.eventsCreated,
            ids: data.eventIds,
            source: 'chat'
          }
        }));
      }

      // Sprint 14.2: Dispatch event if todos were created
      if (data.todosCreated && data.todosCreated > 0) {
        console.log(`[Chat] ${data.todosCreated} todos created`);

        window.dispatchEvent(new CustomEvent('todosChanged', {
          detail: {
            count: data.todosCreated,
            ids: data.todoIds,
            source: 'chat'
          }
        }));
      }

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
    // Clear local state
    this.conversationId = null;
    this.messages = [];
    this.profile = profileText;
    this.status = 'idle';

    // Force new conversation (archives old one server-side)
    return this.start(profileText, { forceNew: true });
  },

  // Resume an existing conversation
  async resumeConversation(conversationId) {
    this.status = 'loading';
    this.conversationId = conversationId;

    try {
      await this.loadMessages();
      this.status = 'active';
      return { conversationId: this.conversationId };
    } catch (error) {
      console.error('Failed to resume conversation:', error);
      this.status = 'error';
      throw error;
    }
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
  },

  // Claim conversations after login
  async claimConversations() {
    const token = await AuthState.getAccessToken();
    if (!token) return;

    try {
      await fetch(`${API_BASE}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Id': Session.getId()
        }
      });
    } catch (error) {
      console.error('Failed to claim conversations:', error);
    }
  }
};

export default TriageState;
