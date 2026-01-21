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
