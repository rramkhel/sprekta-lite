# Sprint 8.5.2: Triage UI

## Sprint Goal

Render the four triage sections with text-first, minimal styling. Weights and shades over colors.

---

## Task 1: Update Panel Render Method

**File:** `js/triage-panel.js` (update)

Replace the placeholder `render()` method:

```javascript
render(buckets) {
  const sections = [];

  // Today
  if (buckets.today.length > 0) {
    sections.push(this.renderSection('Today', buckets.today, 'today'));
  }

  // This Week
  if (buckets.thisWeek.length > 0) {
    sections.push(this.renderSection('This Week', buckets.thisWeek, 'week'));
  }

  // Later (collapsible)
  if (buckets.later.length > 0) {
    sections.push(this.renderCollapsibleSection('Later', buckets.later, 'later'));
  }

  // Undetermined
  if (buckets.undetermined.length > 0) {
    sections.push(this.renderSection('Undetermined', buckets.undetermined, 'undetermined'));
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

renderItem(item, sectionType) {
  const isUndetermined = sectionType === 'undetermined';
  
  // Format time/date based on section
  let meta = '';
  if (sectionType === 'today' && item.start_time) {
    meta = this.formatTime(item.start_time);
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
      <button class="triage-resolve-btn" data-resolve-id="${item.id}" aria-label="Resolve">
        <svg class="triage-resolve-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      </button>
    </div>
  `;
},

// Helpers
formatTime(time24) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 || 12;
  return `${hours12}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}${period}`;
},

formatWeekday(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
},

formatShortDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
},

escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
},

bindSectionEvents() {
  // Collapsible toggles
  this.content.querySelectorAll('.triage-section-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.toggle;
      const list = btn.nextElementSibling;
      const chevron = btn.querySelector('.triage-chevron');
      
      const isExpanded = list.classList.toggle('expanded');
      chevron.classList.toggle('expanded', isExpanded);
      localStorage.setItem(`triage_${section}_expanded`, isExpanded);
    });
  });

  // Resolve buttons (placeholder - Sprint 8.5.3)
  this.content.querySelectorAll('.triage-resolve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.resolveId;
      console.log('Resolve:', eventId); // Will wire up in 8.5.3
    });
  });

  // Item click → could open event details
  this.content.querySelectorAll('.triage-item').forEach(item => {
    item.addEventListener('click', () => {
      const eventId = item.dataset.eventId;
      // Could open event modal or scroll to calendar
      console.log('View event:', eventId);
    });
  });
}
```

---

## Task 2: Triage Styles — Text-First Design

**File:** `style.css` (add to existing)

```css
/* ============================================
   TRIAGE UI - TEXT-FIRST DESIGN
   ============================================ */

/* Sections */
.triage-section {
  margin-bottom: 24px;
}

.triage-section:last-child {
  margin-bottom: 0;
}

/* Divider between sections */
.triage-section + .triage-section {
  padding-top: 20px;
  border-top: 1px solid var(--border-light, #eee);
}

/* Section header - small, muted, uppercase */
.triage-section-header {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted, #888);
  margin: 0 0 12px 0;
}

/* Collapsible toggle */
.triage-section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 8px;
  cursor: pointer;
  text-align: left;
}

.triage-section-toggle:hover .triage-section-header {
  color: var(--text-secondary, #666);
}

.triage-chevron {
  width: 16px;
  height: 16px;
  color: var(--text-muted, #888);
  transition: transform 0.2s ease;
}

.triage-chevron.expanded {
  transform: rotate(180deg);
}

/* Collapsible list */
.triage-list-collapsible {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.triage-list-collapsible.expanded {
  max-height: 500px;
}

/* Items */
.triage-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.triage-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light, #f0f0f0);
  cursor: pointer;
  transition: background 0.15s;
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.triage-item:last-child {
  border-bottom: none;
}

.triage-item:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.02));
}

.triage-item-content {
  flex: 1;
  min-width: 0;
}

/* Meta (time/date) - light, muted */
.triage-item-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted, #888);
  margin-bottom: 2px;
}

/* Main text - regular weight */
.triage-item-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-primary, #333);
  line-height: 1.4;
}

/* Subtext - light, muted, smaller */
.triage-item-subtext {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted, #999);
  margin-top: 2px;
  font-style: italic;
}

/* Undetermined items - slightly different */
.triage-item-undetermined {
  background: var(--bg-subtle, rgba(0, 0, 0, 0.01));
}

.triage-item-undetermined .triage-item-text {
  color: var(--text-secondary, #555);
}

/* Resolve button */
.triage-resolve-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.15s;
  flex-shrink: 0;
  margin-left: 8px;
}

.triage-item:hover .triage-resolve-btn,
.triage-resolve-btn:hover {
  opacity: 1;
}

.triage-resolve-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary, #666);
}

/* Empty state */
.triage-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted, #888);
}

.triage-empty p {
  margin: 0;
}

.triage-empty-sub {
  font-size: 13px;
  margin-top: 4px !important;
  color: var(--text-muted, #aaa);
}

/* Loading state */
.triage-loading {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted, #888);
  font-size: 13px;
}
```

---

## Task 3: Refresh on Calendar Changes

When events are added/edited/deleted, refresh triage:

**File:** `app.js` (or wherever events are mutated)

```javascript
// After creating an event
async function createEvent(eventData) {
  const result = await fetch('/api/events', { ... });
  
  // Refresh triage if open
  if (window.TriagePanel?.isOpen) {
    window.TriagePanel.refresh();
  }
  
  return result;
}

// After updating an event
async function updateEvent(eventId, updates) {
  const result = await fetch(`/api/events/${eventId}`, { ... });
  
  if (window.TriagePanel?.isOpen) {
    window.TriagePanel.refresh();
  }
  
  return result;
}

// After deleting an event
async function deleteEvent(eventId) {
  const result = await fetch(`/api/events/${eventId}`, { ... });
  
  if (window.TriagePanel?.isOpen) {
    window.TriagePanel.refresh();
  }
  
  return result;
}
```

Expose TriagePanel globally:

**File:** `js/triage-panel.js` (add at end)

```javascript
// Expose for cross-module access
window.TriagePanel = TriagePanel;

export default TriagePanel;
```

---

## Checklist

- [ ] Today section shows events with time
- [ ] This Week shows events with weekday
- [ ] Later is collapsible, shows count
- [ ] Undetermined shows items with "when exactly?" subtext
- [ ] Section headers are small, muted, uppercase
- [ ] Item text is regular weight, clear
- [ ] Resolve icon muted until hover
- [ ] Empty state when no events
- [ ] Collapse state persists
- [ ] Triage refreshes when calendar changes

---

## Visual Check

The panel should feel like reading a list, not using an app:

```
TRIAGE                    ✕

Today
─────────────────────────
3pm
Dentist               [◉]

5pm  
Call Sarah            [◉]

─────────────────────────

This Week
─────────────────────────
Thu
Project deadline      [◉]

Sat
Dinner w/ parents     [◉]

─────────────────────────

Later (3)              ▼

─────────────────────────

Undetermined
─────────────────────────
dentist next week
when exactly?         [◉]

call mom
when exactly?         [◉]
```

---

## Commit

```bash
git add js/triage-panel.js style.css app.js
git commit -m "feat: triage UI with text-first design (Sprint 8.5.2)

- Four sections: Today, This Week, Later, Undetermined
- Collapsible Later section
- Minimal typography-focused styling
- Auto-refresh on calendar changes"
```

---

## Next Sprint

Sprint 8.5.3: Resolve Flow — Click [◉] to open chat about that item.
