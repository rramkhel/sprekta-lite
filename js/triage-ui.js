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
