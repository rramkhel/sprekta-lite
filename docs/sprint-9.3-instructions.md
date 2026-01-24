# Sprint 9.3: Triage Panel UI

## Sprint Goal

Build the right-side triage panel with text-first design. Sections for Coming Up, Needs Attention, Backlog, and While You Were Away.

---

## Current State

**What exists (from Sprint 9.1):**
- `#triage-panel` container in HTML
- Panel toggle functionality
- Basic panel styles

**What we're building:**
- Triage content sections
- Text-first visual design
- Resolve interaction (opens contextual chat)
- Session summary ("While You Were Away")

---

## Design Principles Recap

- **Text-first** — feels like reading, not software
- **Weights and shades** — muted greys, no loud colors
- **Minimal UI** — occasional icon, rare buttons
- **Organization does the work** — sections triage for you

---

## Task 1: Triage State Manager

**File:** `js/triage-manager.js` (NEW)

```javascript
/**
 * Triage Manager
 * 
 * Fetches and organizes items for the triage panel.
 */

import { getAuthHeaders } from './auth-helpers.js';

const TriageManager = {
  data: {
    comingUp: [],
    needsAttention: [],
    backlog: [],
    sessionCaptures: []
  },

  listeners: [],

  /**
   * Initialize and load data
   */
  async init() {
    await this.refresh();
    
    // Listen for capture events
    window.addEventListener('capture-processed', () => this.refresh());
    
    return this.data;
  },

  /**
   * Refresh all triage data
   */
  async refresh() {
    const [events, captures] = await Promise.all([
      this.fetchUpcomingEvents(),
      this.fetchCaptures()
    ]);

    // Coming Up: confirmed events in next 7 days
    this.data.comingUp = events.filter(e => !e.is_ghost).slice(0, 5);

    // Needs Attention: ghost events + approaching deadlines
    this.data.needsAttention = [
      ...events.filter(e => e.is_ghost),
      ...captures.filter(c => 
        c.status === 'backlog' && 
        c.has_deadline && 
        this.isDeadlineApproaching(c)
      )
    ].slice(0, 10);

    // Backlog: todos without deadlines
    this.data.backlog = captures.filter(c => 
      c.status === 'backlog' && !c.has_deadline
    );

    // Session captures from sessionStorage
    this.data.sessionCaptures = this.getSessionCaptures();

    // Notify listeners
    this.notifyListeners();

    return this.data;
  },

  /**
   * Fetch upcoming events (next 7 days)
   */
  async fetchUpcomingEvents() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    try {
      const response = await fetch(`/api/events?start=${today.toISOString()}&end=${nextWeek.toISOString()}`, {
        headers: await getAuthHeaders()
      });

      if (!response.ok) return [];
      return response.json();
    } catch (e) {
      console.error('Failed to fetch events:', e);
      return [];
    }
  },

  /**
   * Fetch active captures (backlog, ghost)
   */
  async fetchCaptures() {
    try {
      const response = await fetch('/api/capture?status=backlog,ghost', {
        headers: await getAuthHeaders()
      });

      if (!response.ok) return [];
      return response.json();
    } catch (e) {
      console.error('Failed to fetch captures:', e);
      return [];
    }
  },

  /**
   * Get session captures from sessionStorage
   */
  getSessionCaptures() {
    try {
      return JSON.parse(sessionStorage.getItem('capture_session') || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Clear session captures (dismiss "While You Were Away")
   */
  clearSessionCaptures() {
    sessionStorage.removeItem('capture_session');
    this.data.sessionCaptures = [];
    this.notifyListeners();
  },

  /**
   * Check if a deadline is approaching (within 5 days)
   */
  isDeadlineApproaching(capture) {
    if (!capture.parsed_data?.deadline) return false;
    
    const deadline = new Date(capture.parsed_data.deadline);
    const daysUntil = (deadline - new Date()) / (1000 * 60 * 60 * 24);
    
    return daysUntil <= 5 && daysUntil > 0;
  },

  /**
   * Get days until deadline
   */
  getDaysUntilDeadline(capture) {
    if (!capture.parsed_data?.deadline) return null;
    
    const deadline = new Date(capture.parsed_data.deadline);
    return Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  },

  /**
   * Subscribe to data changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.data));
  }
};

export default TriageManager;
```

---

## Task 2: Triage Panel UI Component

**File:** `js/triage-ui.js` (NEW - separate from existing ChatUI)

```javascript
/**
 * Triage Panel UI
 * 
 * Renders the right-side triage panel with text-first design.
 */

import TriageManager from './triage-manager.js';
import PanelManager from './panel-manager.js';

const TriageUI = {
  container: null,
  backlogExpanded: false,

  /**
   * Initialize the triage panel
   */
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('Triage container not found');
      return;
    }

    // Subscribe to data changes
    TriageManager.subscribe(data => this.render(data));

    // Initial render with current data
    this.render(TriageManager.data);
  },

  /**
   * Main render function
   */
  render(data) {
    const { comingUp, needsAttention, backlog, sessionCaptures } = data;

    this.container.innerHTML = `
      <div class="triage-content">
        ${this.renderComingUp(comingUp)}
        ${this.renderNeedsAttention(needsAttention)}
        ${this.renderBacklog(backlog)}
        ${this.renderSessionSummary(sessionCaptures)}
      </div>
    `;

    this.bindEvents();
  },

  /**
   * Coming Up section
   */
  renderComingUp(events) {
    if (events.length === 0) return '';

    return `
      <section class="triage-section">
        <h4 class="triage-section-header">Coming Up</h4>
        <div class="triage-list">
          ${events.map(event => `
            <div class="triage-item" data-event-id="${event.id}">
              <div class="triage-item-meta">${this.formatEventTime(event)}</div>
              <div class="triage-item-text">${this.escapeHtml(event.title)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Needs Attention section
   */
  renderNeedsAttention(items) {
    if (items.length === 0) return '';

    return `
      <section class="triage-section">
        <h4 class="triage-section-header">Needs Attention</h4>
        <div class="triage-list">
          ${items.map(item => this.renderAttentionItem(item)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Render a single attention item
   */
  renderAttentionItem(item) {
    // Ghost event
    if (item.is_ghost) {
      return `
        <div class="triage-item triage-item-attention" data-event-id="${item.id}" data-type="ghost">
          <div class="triage-item-content">
            <div class="triage-item-text">${this.escapeHtml(item.title)}</div>
            <div class="triage-item-subtext">when exactly?</div>
          </div>
          <button class="triage-resolve-btn" data-resolve-id="${item.id}" data-resolve-type="ghost" aria-label="Resolve">
            <svg class="triage-resolve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </button>
        </div>
      `;
    }

    // Todo with deadline
    const daysLeft = TriageManager.getDaysUntilDeadline(item);
    const urgencyText = daysLeft === 1 ? 'tomorrow' : `${daysLeft} days left`;

    return `
      <div class="triage-item triage-item-attention" data-capture-id="${item.id}" data-type="deadline">
        <div class="triage-item-content">
          <div class="triage-item-text">${this.escapeHtml(item.parsed_data?.title || item.raw_text)}</div>
          <div class="triage-item-subtext">${urgencyText}</div>
        </div>
        <button class="triage-resolve-btn" data-resolve-id="${item.id}" data-resolve-type="deadline" aria-label="Schedule">
          <svg class="triage-resolve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </button>
      </div>
    `;
  },

  /**
   * Backlog section (collapsible)
   */
  renderBacklog(items) {
    if (items.length === 0) return '';

    const displayItems = this.backlogExpanded ? items : [];

    return `
      <section class="triage-section">
        <button class="triage-section-toggle" data-toggle="backlog">
          <span class="triage-section-header">Backlog (${items.length})</span>
          <svg class="triage-toggle-icon ${this.backlogExpanded ? 'expanded' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="triage-list triage-list-collapsible ${this.backlogExpanded ? 'expanded' : ''}">
          ${items.map(item => `
            <div class="triage-item triage-item-backlog" data-capture-id="${item.id}">
              <div class="triage-item-text">${this.escapeHtml(item.parsed_data?.title || item.raw_text)}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Session summary ("While You Were Away")
   */
  renderSessionSummary(captures) {
    if (captures.length === 0) return '';

    return `
      <section class="triage-section triage-section-session">
        <div class="triage-section-header-row">
          <h4 class="triage-section-header">While You Were Away</h4>
          <button class="triage-dismiss-btn" data-dismiss="session" aria-label="Dismiss">×</button>
        </div>
        <div class="triage-list">
          ${captures.map(capture => this.renderSessionItem(capture)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * Render a session capture item
   */
  renderSessionItem(capture) {
    const { action, raw_text, classification } = capture;

    let statusIcon, statusText;

    switch (action) {
      case 'created_event':
      case 'created_annual':
        statusIcon = '✓';
        statusText = 'added to calendar';
        break;
      case 'created_ghost':
        statusIcon = '⚠';
        statusText = 'needs a time';
        break;
      case 'added_to_backlog':
        statusIcon = '•';
        statusText = 'added to backlog';
        break;
      default:
        statusIcon = '•';
        statusText = 'captured';
    }

    return `
      <div class="triage-session-item">
        <span class="triage-session-icon ${action === 'created_ghost' ? 'warning' : ''}">${statusIcon}</span>
        <div class="triage-session-content">
          <div class="triage-session-text">${this.escapeHtml(classification?.parsed_data?.title || raw_text)}</div>
          <div class="triage-session-status">${statusText}</div>
        </div>
      </div>
    `;
  },

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Resolve buttons
    this.container.querySelectorAll('.triage-resolve-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.resolveId;
        const type = e.currentTarget.dataset.resolveType;
        this.openResolveChat(id, type);
      });
    });

    // Backlog toggle
    this.container.querySelector('[data-toggle="backlog"]')?.addEventListener('click', () => {
      this.backlogExpanded = !this.backlogExpanded;
      this.render(TriageManager.data);
    });

    // Dismiss session summary
    this.container.querySelector('[data-dismiss="session"]')?.addEventListener('click', () => {
      TriageManager.clearSessionCaptures();
    });
  },

  /**
   * Open contextual chat for resolving an item
   */
  openResolveChat(id, type) {
    // Find the item
    let item, prompt;

    if (type === 'ghost') {
      item = TriageManager.data.needsAttention.find(i => i.id === id && i.is_ghost);
      prompt = `Let's pin down that ${item?.title || 'appointment'}.\n\nYou said "${item?.title}" — do you know what day works? And what time?`;
    } else if (type === 'deadline') {
      item = TriageManager.data.needsAttention.find(i => i.id === id);
      const days = TriageManager.getDaysUntilDeadline(item);
      prompt = `Let's schedule "${item?.parsed_data?.title || item?.raw_text}".\n\nYou have ${days} days until the deadline. When would be a good time to do this?`;
    }

    // Open chat panel with context
    PanelManager.open('chat');
    
    // Dispatch event for ChatUI to pick up
    window.dispatchEvent(new CustomEvent('start-resolve-chat', {
      detail: { id, type, item, prompt }
    }));
  },

  /**
   * Format event time for display
   */
  formatEventTime(event) {
    const date = new Date(event.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayStr;
    if (date.toDateString() === today.toDateString()) {
      dayStr = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayStr = 'Tomorrow';
    } else {
      dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    if (event.all_day) {
      return dayStr;
    }

    const time = event.start_time?.slice(0, 5) || '';
    return `${dayStr} ${this.formatTime(time)}`;
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

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

export default TriageUI;
```

---

## Task 3: Triage Panel Styles

**File:** `style.css` (add to existing)

```css
/* ============================================
   TRIAGE PANEL - TEXT-FIRST DESIGN
   ============================================ */

/* Content wrapper */
.triage-content {
  padding: 16px;
  overflow-y: auto;
  height: calc(100% - 50px); /* Subtract header */
}

/* Sections */
.triage-section {
  margin-bottom: 24px;
}

.triage-section:last-child {
  margin-bottom: 0;
}

/* Section headers - muted, medium weight */
.triage-section-header {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted, #888);
  margin: 0 0 12px 0;
}

.triage-section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.triage-section-header-row .triage-section-header {
  margin-bottom: 0;
}

/* Lists */
.triage-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Individual items */
.triage-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light, #f0f0f0);
}

.triage-item:last-child {
  border-bottom: none;
}

/* Item meta (date/time) - light, muted */
.triage-item-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted, #888);
  margin-bottom: 2px;
}

/* Item main text - regular weight */
.triage-item-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-primary, #333);
  line-height: 1.4;
}

/* Item subtext - light, muted */
.triage-item-subtext {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted, #888);
  margin-top: 2px;
}

/* Attention items - with resolve button */
.triage-item-attention {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.triage-item-content {
  flex: 1;
  min-width: 0;
}

/* Resolve button - minimal, icon only */
.triage-resolve-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.triage-resolve-btn:hover {
  opacity: 1;
}

.triage-resolve-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary, #666);
}

/* Backlog toggle */
.triage-section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-bottom: 8px;
}

.triage-section-toggle:hover .triage-section-header {
  color: var(--text-secondary, #666);
}

.triage-toggle-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted, #888);
  transition: transform 0.2s;
}

.triage-toggle-icon.expanded {
  transform: rotate(180deg);
}

/* Collapsible list */
.triage-list-collapsible {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.triage-list-collapsible.expanded {
  max-height: 500px;
}

/* Backlog items - slightly indented */
.triage-item-backlog {
  padding-left: 8px;
}

.triage-item-backlog .triage-item-text {
  color: var(--text-secondary, #666);
}

/* Session summary section */
.triage-section-session {
  background: var(--bg-subtle, #f8f8f8);
  margin: 0 -16px -16px -16px;
  padding: 16px;
  border-top: 1px solid var(--border-light, #eee);
}

/* Dismiss button */
.triage-dismiss-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-muted, #888);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.triage-dismiss-btn:hover {
  background: var(--bg-hover, #eee);
  color: var(--text-secondary, #666);
}

/* Session items */
.triage-session-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}

.triage-session-icon {
  font-size: 12px;
  width: 16px;
  text-align: center;
  color: var(--text-muted, #888);
}

.triage-session-icon.warning {
  color: var(--warning-color, #E5A000);
}

.triage-session-content {
  flex: 1;
}

.triage-session-text {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-primary, #333);
}

.triage-session-status {
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-top: 1px;
}

/* ============================================
   TRIAGE PANEL DIVIDERS
   ============================================ */

.triage-section + .triage-section::before {
  content: '';
  display: block;
  height: 1px;
  background: var(--border-light, #eee);
  margin-bottom: 24px;
}
```

---

## Task 4: Wire Up Initialization

**File:** `index.html` (update initialization)

```html
<script type="module">
  import PanelManager from './js/panel-manager.js';
  import TriageManager from './js/triage-manager.js';
  import TriageUI from './js/triage-ui.js';
  // ... other imports

  // Initialize managers
  PanelManager.init();
  await TriageManager.init();
  TriageUI.init('triage-content');

  // Auto-open triage panel if there are session captures
  if (TriageManager.data.sessionCaptures.length > 0) {
    PanelManager.open('triage');
  }
</script>
```

---

## Checklist

- [ ] TriageManager fetches and organizes data
- [ ] Coming Up shows next 5 confirmed events
- [ ] Needs Attention shows ghost events + approaching deadlines
- [ ] Backlog is collapsible, shows count
- [ ] While You Were Away shows session captures
- [ ] Resolve button opens contextual chat
- [ ] Dismiss button clears session summary
- [ ] Text-first design (weights, not colors)
- [ ] All sections render correctly with empty state

---

## Testing

1. **No data:** Panel shows nothing (empty state)
2. **Coming Up:** Add events, verify they appear
3. **Needs Attention:** Create ghost events, verify resolve button
4. **Backlog:** Add todos, verify collapse/expand
5. **Session summary:** Capture items, verify they appear and can be dismissed
6. **Resolve flow:** Click resolve → chat opens with context

---

## Commit

```bash
git add js/triage-manager.js js/triage-panel-ui.js style.css index.html
git commit -m "feat: triage panel UI (Sprint 9.3)

- Coming Up, Needs Attention, Backlog sections
- While You Were Away session summary
- Text-first design with weights over colors
- Resolve button opens contextual chat"
```

---

## Next Sprint

Sprint 9.4: Ghost Events — Calendar integration, visual treatment, resolution flow.
