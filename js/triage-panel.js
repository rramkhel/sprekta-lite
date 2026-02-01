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

    // Listen for event changes to refresh triage
    window.addEventListener('events-updated', () => {
      if (window.SidebarTabs?.activeTab === 'inbox') {
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
    const sections = [];

    // Today
    if (today.length > 0) {
      sections.push(this.renderSection('Today', today, 'today'));
    }

    // This Week
    if (thisWeek.length > 0) {
      sections.push(this.renderSection('This Week', thisWeek, 'week'));
    }

    // Later (collapsible)
    if (later.length > 0) {
      sections.push(this.renderCollapsibleSection('Later', later, 'later'));
    }

    // Undetermined
    if (undetermined.length > 0) {
      sections.push(this.renderSection('Undetermined', undetermined, 'undetermined'));
    }

    // Empty state
    if (sections.length === 0) {
      this.content.innerHTML = `
        <div class="triage-empty">
          <p>Nothing to triage</p>
          <p class="triage-empty-sub">All clear!</p>
        </div>
      `;
      return;
    }

    this.content.innerHTML = sections.join('');
    this.bindSectionEvents();
  },

  /**
   * Render a standard section
   */
  renderSection(title, items, type) {
    return `
      <section class="triage-section" data-section="${type}">
        <h4 class="triage-section-header">${title}</h4>
        <div class="triage-list">
          ${items.map(item => this.renderItem(item, type)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Render a collapsible section
   */
  renderCollapsibleSection(title, items, type) {
    const isExpanded = localStorage.getItem(`triage_${type}_expanded`) !== 'false';

    return `
      <section class="triage-section triage-section-collapsible" data-section="${type}">
        <button class="triage-section-toggle" data-toggle="${type}">
          <span class="triage-section-header">${title} (${items.length})</span>
          <svg class="triage-chevron ${isExpanded ? 'expanded' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="triage-list triage-list-collapsible ${isExpanded ? 'expanded' : ''}">
          ${items.map(item => this.renderItem(item, type)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Render a single triage item
   */
  renderItem(item, sectionType) {
    const isUndetermined = sectionType === 'undetermined';

    // Format time/date based on section
    let meta = '';
    if (sectionType === 'today' && item.time) {
      meta = this.formatTime(item.time);
    } else if (sectionType === 'week' && item.date) {
      meta = this.formatWeekday(item.date);
    } else if (sectionType === 'later' && item.date) {
      meta = this.formatShortDate(item.date);
    }

    // Subtext for undetermined items
    let subtext = '';
    if (isUndetermined) {
      subtext = item.date ? 'what time?' : 'when exactly?';
    }

    return `
      <div class="triage-item ${isUndetermined ? 'triage-item-undetermined' : ''}" data-event-id="${item.id}">
        <div class="triage-item-content">
          ${meta ? `<div class="triage-item-meta">${meta}</div>` : ''}
          <div class="triage-item-text">${this.escapeHtml(item.title)}</div>
          ${subtext ? `<div class="triage-item-subtext">${subtext}</div>` : ''}
        </div>
        ${isUndetermined ? `
          <button class="triage-resolve-btn" data-resolve-id="${item.id}" aria-label="Resolve">
            <svg class="triage-resolve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * Bind section event handlers
   */
  bindSectionEvents() {
    // Collapsible toggles
    this.content?.querySelectorAll('.triage-section-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.toggle;
        const list = btn.nextElementSibling;
        const chevron = btn.querySelector('.triage-chevron');

        const isExpanded = list.classList.toggle('expanded');
        chevron.classList.toggle('expanded', isExpanded);
        localStorage.setItem(`triage_${section}_expanded`, isExpanded);
      });
    });

    // Resolve buttons
    this.content?.querySelectorAll('.triage-resolve-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = parseInt(btn.dataset.resolveId);
        this.openResolveChat(eventId);
      });
    });

    // Item click → could open event details
    this.content?.querySelectorAll('.triage-item').forEach(item => {
      item.addEventListener('click', () => {
        const eventId = item.dataset.eventId;
        // Could open event modal or scroll to calendar
        console.log('View event:', eventId);
      });
    });
  },

  /**
   * Open chat to resolve an undetermined event
   */
  openResolveChat(eventId) {
    // Find event across all buckets (not just undetermined)
    const allEvents = [
      ...this.buckets.today,
      ...this.buckets.thisWeek,
      ...this.buckets.later,
      ...this.buckets.undetermined
    ];

    const event = allEvents.find(e => e.id === eventId);
    if (!event) {
      console.error('Event not found:', eventId);
      return;
    }

    // Build context prompt
    const prompt = this.buildResolvePrompt(event);

    // Dispatch event that ChatUI will pick up
    window.dispatchEvent(new CustomEvent('open-resolve-chat', {
      detail: {
        eventId: event.id,
        eventTitle: event.title,
        prompt: prompt,
        event: event
      }
    }));

    // Switch to chat tab
    if (window.SidebarTabs) {
      window.SidebarTabs.switchTo('chat');
    }
  },

  /**
   * Build the AI prompt for resolving this event
   */
  buildResolvePrompt(event) {
    const hasDate = !!event.date;
    const hasTime = !!event.time;

    if (!hasDate && !hasTime) {
      return `Let's figure out when to schedule "${event.title}".\n\nDo you have a specific day in mind? And what time works?`;
    }

    if (hasDate && !hasTime) {
      const dateStr = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      return `"${event.title}" is set for ${dateStr}, but doesn't have a time yet.\n\nWhat time should I put this down for?`;
    }

    // Has time but no date (rare)
    if (!hasDate && hasTime) {
      return `"${event.title}" is set for ${this.formatTime(event.time)}, but doesn't have a date.\n\nWhat day should this be?`;
    }

    // Both exist but flagged for triage (some other issue)
    return `Let's make sure "${event.title}" is set up correctly.\n\nCurrently it's ${event.date} at ${event.time}. Does that look right?`;
  },

  /**
   * Format time (24h to 12h)
   */
  formatTime(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;
    return `${hours12}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}${period}`;
  },

  /**
   * Format weekday (e.g., "Wed")
   */
  formatWeekday(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  },

  /**
   * Format short date (e.g., "Jan 24")
   */
  formatShortDate(dateStr) {
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

// Expose for cross-module access
window.TriagePanel = TriagePanel;

export default TriagePanel;
