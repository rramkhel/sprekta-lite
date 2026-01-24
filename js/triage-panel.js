/**
 * Triage Panel UI
 *
 * Renders triage buckets (Today, This Week, Later, Undetermined)
 * Integrates with existing PanelManager system
 */

import TriageData from './triage-data.js';

const TriagePanel = {
  content: null,
  buckets: null,
  laterExpanded: false,

  /**
   * Initialize the triage panel
   */
  init() {
    this.content = document.getElementById('triage-content');
    if (!this.content) {
      console.warn('Triage content container not found');
      return;
    }

    // Listen for panel open events
    window.addEventListener('panel-opened', (e) => {
      if (e.detail?.panel === 'triage') {
        this.refresh();
      }
    });

    // Listen for event changes to refresh triage
    window.addEventListener('events-updated', () => {
      if (window.PanelManager?.isOpen('triage')) {
        this.refresh();
      }
    });
  },

  /**
   * Refresh triage data and render
   */
  async refresh() {
    if (!this.content) return;

    // Show loading state
    this.content.innerHTML = '<div class="triage-loading">Loading...</div>';

    try {
      this.buckets = await TriageData.fetchAll();
      this.render();
    } catch (error) {
      console.error('Failed to load triage data:', error);
      this.content.innerHTML = '<div class="triage-error">Failed to load triage data</div>';
    }
  },

  /**
   * Render all triage sections
   */
  render() {
    if (!this.buckets || !this.content) return;

    const { today, thisWeek, later, undetermined } = this.buckets;

    this.content.innerHTML = `
      ${this.renderToday(today)}
      ${this.renderThisWeek(thisWeek)}
      ${this.renderLater(later)}
      ${this.renderUndetermined(undetermined)}
    `;

    this.bindEvents();
  },

  /**
   * Render Today section
   */
  renderToday(events) {
    if (events.length === 0) return '';

    return `
      <section class="triage-section">
        <h4 class="triage-section-header">Today</h4>
        <div class="triage-list">
          ${events.map(event => `
            <div class="triage-item" data-event-id="${event.id}" onclick="openEventDetail(${event.id})">
              <div class="triage-item-time">${this.formatTime(event.time)}</div>
              <div class="triage-item-title">${this.escapeHtml(event.title)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Render This Week section
   */
  renderThisWeek(events) {
    if (events.length === 0) return '';

    return `
      <section class="triage-section">
        <h4 class="triage-section-header">This Week</h4>
        <div class="triage-list">
          ${events.map(event => `
            <div class="triage-item" data-event-id="${event.id}" onclick="openEventDetail(${event.id})">
              <div class="triage-item-meta">${this.formatDayOfWeek(event.date)}</div>
              <div class="triage-item-title">${this.escapeHtml(event.title)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Render Later section (collapsible)
   */
  renderLater(events) {
    if (events.length === 0) return '';

    return `
      <section class="triage-section">
        <button class="triage-section-toggle" data-toggle="later">
          <span class="triage-section-header">Later (${events.length})</span>
          <svg class="triage-toggle-icon ${this.laterExpanded ? 'expanded' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="triage-list triage-list-collapsible ${this.laterExpanded ? 'expanded' : ''}">
          ${events.map(event => `
            <div class="triage-item" data-event-id="${event.id}" onclick="openEventDetail(${event.id})">
              <div class="triage-item-meta">${this.formatDate(event.date)}</div>
              <div class="triage-item-title">${this.escapeHtml(event.title)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Render Undetermined section
   */
  renderUndetermined(events) {
    if (events.length === 0) return '';

    return `
      <section class="triage-section triage-section-undetermined">
        <h4 class="triage-section-header">Undetermined</h4>
        <div class="triage-list">
          ${events.map(event => `
            <div class="triage-item triage-item-attention" data-event-id="${event.id}">
              <div class="triage-item-content">
                <div class="triage-item-title">${this.escapeHtml(event.title)}</div>
                <div class="triage-item-subtext">when exactly?</div>
              </div>
              <button class="triage-resolve-btn" data-resolve-id="${event.id}" aria-label="Resolve">
                <svg class="triage-resolve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Later section toggle
    this.content?.querySelector('[data-toggle="later"]')?.addEventListener('click', () => {
      this.laterExpanded = !this.laterExpanded;
      this.render();
    });

    // Resolve buttons
    this.content?.querySelectorAll('.triage-resolve-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = e.currentTarget.dataset.resolveId;
        this.openResolveChat(eventId);
      });
    });
  },

  /**
   * Open chat to resolve an undetermined event
   */
  openResolveChat(eventId) {
    const event = this.buckets.undetermined.find(e => e.id === eventId);
    if (!event) return;

    // Open chat panel
    if (window.PanelManager) {
      window.PanelManager.open('chat');
    }

    // TODO: Pre-populate chat with context about this event
    // This will be implemented when we build the full resolve flow
    console.log('Resolve event:', event);
  },

  /**
   * Format time (24h to 12h)
   */
  formatTime(time) {
    if (!time) return 'All day';

    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;

    return `${hours12}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}${period}`;
  },

  /**
   * Format day of week (e.g., "Wed")
   */
  formatDayOfWeek(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short' });
  },

  /**
   * Format date (e.g., "Jan 24")
   */
  formatDate(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

export default TriagePanel;
