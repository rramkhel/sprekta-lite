# Sprint 8.5.1: Triage Panel + Data

## Sprint Goal

Add a right-side triage panel that fetches events organized by time bucket.

---

## Task 1: Database Update

**Run in Supabase SQL editor:**

```sql
-- Add triage flag to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS needs_triage BOOLEAN DEFAULT FALSE;

-- Index for triage queries
CREATE INDEX IF NOT EXISTS idx_events_needs_triage ON events(needs_triage) WHERE needs_triage = true;
```

---

## Task 2: Update Quick Capture to Flag Incomplete Events

**File:** `api/parse.js` (update existing)

Find where events are created after AI parsing. Add logic:

```javascript
// After AI returns parsed data
const parsedDate = result.date; // from AI
const parsedTime = result.time; // from AI

// Determine if this needs triage
const needsTriage = !parsedDate || parsedDate === 'unknown' || parsedDate === null;

// Create event with flag
const eventData = {
  title: result.title,
  date: parsedDate || null,
  start_time: parsedTime || null,
  // ... other fields
  needs_triage: needsTriage
};
```

---

## Task 3: Triage Data Fetcher

**File:** `js/triage-data.js` (NEW)

```javascript
/**
 * Triage Data
 * 
 * Fetches events organized into triage buckets.
 */

import { getAuthHeaders } from './auth-helpers.js';

const TriageData = {
  /**
   * Fetch all triage buckets
   */
  async fetchAll() {
    const events = await this.fetchEvents();
    return this.organize(events);
  },

  /**
   * Fetch user's events
   */
  async fetchEvents() {
    try {
      const response = await fetch('/api/events', {
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
   * Organize events into buckets
   */
  organize(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const buckets = {
      today: [],
      thisWeek: [],
      later: [],
      undetermined: []
    };

    for (const event of events) {
      // Undetermined: no date or flagged
      if (!event.date || event.needs_triage) {
        buckets.undetermined.push(event);
        continue;
      }

      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      // Today
      if (eventDate.getTime() === today.getTime()) {
        buckets.today.push(event);
      }
      // This week (not today)
      else if (eventDate > today && eventDate <= endOfWeek) {
        buckets.thisWeek.push(event);
      }
      // Later
      else if (eventDate > endOfWeek) {
        buckets.later.push(event);
      }
      // Past events: skip for now (or could add a "past" bucket)
    }

    // Sort each bucket by date/time
    buckets.today.sort((a, b) => this.compareTime(a.start_time, b.start_time));
    buckets.thisWeek.sort((a, b) => this.compareDate(a.date, b.date));
    buckets.later.sort((a, b) => this.compareDate(a.date, b.date));

    return buckets;
  },

  /**
   * Compare times for sorting
   */
  compareTime(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  },

  /**
   * Compare dates for sorting
   */
  compareDate(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return new Date(a) - new Date(b);
  }
};

export default TriageData;
```

---

## Task 4: Add Panel Container to HTML

**File:** `index.html`

Add after the calendar container (or wherever the main content ends):

```html
<!-- Triage Panel -->
<div id="triage-panel" class="triage-panel hidden">
  <div class="triage-header">
    <span class="triage-title">Triage</span>
    <button id="triage-close" class="triage-close" aria-label="Close">×</button>
  </div>
  <div id="triage-content" class="triage-content">
    <!-- Sections render here -->
  </div>
</div>
```

Add toggle button to header:

```html
<!-- In your header-right area, near auth -->
<button id="toggle-triage" class="header-btn" aria-label="Toggle triage">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
</button>
```

---

## Task 5: Basic Panel Styles

**File:** `style.css`

```css
/* ============================================
   TRIAGE PANEL - BASIC LAYOUT
   ============================================ */

.triage-panel {
  position: fixed;
  top: 60px; /* Below header */
  right: 0;
  bottom: 0;
  width: 280px;
  background: var(--bg-secondary, #fafafa);
  border-left: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transform: translateX(0);
  transition: transform 0.25s ease;
}

.triage-panel.hidden {
  transform: translateX(100%);
}

.triage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-primary, #fff);
}

.triage-title {
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #666);
}

.triage-close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-muted, #999);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
}

.triage-close:hover {
  background: var(--bg-hover, #eee);
  color: var(--text-primary, #333);
}

.triage-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Shrink main content when triage is open */
body.triage-open .app-main,
body.triage-open .calendar-container {
  margin-right: 280px;
  transition: margin-right 0.25s ease;
}

/* Header toggle button */
.header-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary, #666);
}

.header-btn:hover {
  background: var(--bg-hover, #f0f0f0);
  color: var(--text-primary, #333);
}

.header-btn.active {
  background: var(--bg-active, #e8e8e8);
  color: var(--text-primary, #333);
}

/* Mobile: full width overlay */
@media (max-width: 768px) {
  .triage-panel {
    width: 100%;
    top: 0;
    z-index: 200;
  }

  body.triage-open .app-main,
  body.triage-open .calendar-container {
    margin-right: 0;
  }
}
```

---

## Task 6: Panel Toggle Logic

**File:** `js/triage-panel.js` (NEW)

```javascript
/**
 * Triage Panel
 * 
 * Handles open/close and coordinates with data fetcher.
 */

import TriageData from './triage-data.js';

const TriagePanel = {
  isOpen: false,
  panel: null,
  content: null,

  init() {
    this.panel = document.getElementById('triage-panel');
    this.content = document.getElementById('triage-content');

    // Toggle button
    document.getElementById('toggle-triage')?.addEventListener('click', () => {
      this.toggle();
    });

    // Close button
    document.getElementById('triage-close')?.addEventListener('click', () => {
      this.close();
    });

    // Restore state
    if (localStorage.getItem('triage_open') === 'true') {
      this.open();
    }
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  async open() {
    this.isOpen = true;
    this.panel?.classList.remove('hidden');
    document.body.classList.add('triage-open');
    document.getElementById('toggle-triage')?.classList.add('active');
    localStorage.setItem('triage_open', 'true');

    // Fetch and render data
    await this.refresh();
  },

  close() {
    this.isOpen = false;
    this.panel?.classList.add('hidden');
    document.body.classList.remove('triage-open');
    document.getElementById('toggle-triage')?.classList.remove('active');
    localStorage.setItem('triage_open', 'false');
  },

  async refresh() {
    if (!this.content) return;

    this.content.innerHTML = '<div class="triage-loading">Loading...</div>';

    const buckets = await TriageData.fetchAll();
    this.render(buckets);
  },

  render(buckets) {
    // Placeholder - Sprint 8.5.2 will implement full rendering
    this.content.innerHTML = `
      <div class="triage-section">
        <div class="triage-section-header">Today (${buckets.today.length})</div>
      </div>
      <div class="triage-section">
        <div class="triage-section-header">This Week (${buckets.thisWeek.length})</div>
      </div>
      <div class="triage-section">
        <div class="triage-section-header">Later (${buckets.later.length})</div>
      </div>
      <div class="triage-section">
        <div class="triage-section-header">Undetermined (${buckets.undetermined.length})</div>
      </div>
    `;
  }
};

export default TriagePanel;
```

---

## Task 7: Initialize Panel

**File:** `index.html` (update script section)

```html
<script type="module">
  import TriagePanel from './js/triage-panel.js';
  // ... other imports

  TriagePanel.init();
</script>
```

---

## Checklist

- [ ] `needs_triage` column added to events table
- [ ] Quick capture flags incomplete events
- [ ] TriageData fetches and organizes events
- [ ] Panel container in HTML
- [ ] Toggle button in header
- [ ] Panel slides in/out
- [ ] Body shifts when panel open (desktop)
- [ ] State persists in localStorage
- [ ] Mobile: full-width overlay

---

## Commit

```bash
git add .
git commit -m "feat: triage panel foundation (Sprint 8.5.1)

- Add needs_triage column to events
- Triage data fetcher with bucket organization
- Right-side panel with toggle
- Panel state persistence"
```

---

## Next Sprint

Sprint 8.5.2: Triage UI — Render the sections with text-first styling.
