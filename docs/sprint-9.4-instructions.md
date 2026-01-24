# Sprint 9.4: Ghost Events

## Sprint Goal

Implement ghost events on the calendar — visually distinct tentative entries for incomplete captures. Build the resolution flow that converts ghosts to real events.

---

## Current State

**What exists:**
- `events` table with `is_ghost` field (Sprint 9.2)
- Ghost events created by CaptureProcessor
- Triage panel shows ghosts in "Needs Attention"

**What we're building:**
- Ghost event visual treatment on calendar
- Resolution UI (inline date/time picker)
- Convert ghost → real event flow
- Ghost indicators in day view

---

## Ghost Event Characteristics

| Property | Real Event | Ghost Event |
|----------|------------|-------------|
| Visual | Solid background | Dotted border, transparent |
| Color | Category color | Grey/muted |
| Calendar status | Confirmed | Tentative |
| Interaction | Click to edit | Click to resolve |
| Time | Specific | Placeholder or vague |

---

## Task 1: Ghost Event Styles

**File:** `style.css`

```css
/* ============================================
   GHOST EVENTS - CALENDAR STYLING
   ============================================ */

/* Month view - event pills */
.calendar-event.ghost {
  background: transparent;
  border: 1.5px dashed var(--ghost-border, #bbb);
  color: var(--text-secondary, #666);
}

.calendar-event.ghost:hover {
  background: var(--ghost-hover, rgba(0, 0, 0, 0.03));
  border-color: var(--text-secondary, #888);
}

/* Ghost indicator icon */
.calendar-event.ghost::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning-color, #E5A000);
  margin-right: 4px;
  flex-shrink: 0;
}

/* Day view - time blocks */
.day-event.ghost {
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 4px,
    rgba(150, 150, 150, 0.1) 4px,
    rgba(150, 150, 150, 0.1) 8px
  );
  border: 1.5px dashed var(--ghost-border, #bbb);
  color: var(--text-secondary, #666);
}

.day-event.ghost .event-time {
  color: var(--text-muted, #888);
}

.day-event.ghost .event-title {
  font-style: italic;
}

/* Ghost event tooltip */
.ghost-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: var(--bg-tooltip, #333);
  color: white;
  font-size: 11px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 100;
}

.calendar-event.ghost:hover .ghost-tooltip,
.day-event.ghost:hover .ghost-tooltip {
  opacity: 1;
  visibility: visible;
}

/* Compact calendar list - ghost styling */
.calendar-list-event.ghost {
  background: transparent;
  border: 1px dashed var(--ghost-border, #bbb);
}

.calendar-list-event.ghost::before {
  content: '○';
  margin-right: 6px;
  color: var(--warning-color, #E5A000);
}
```

---

## Task 2: Update Calendar Rendering

**File:** `app.js` (or calendar rendering module)

Update event rendering to apply ghost styling:

```javascript
/**
 * Render a single event (month view pill)
 */
function renderEventPill(event) {
  const isGhost = event.is_ghost;
  
  return `
    <div 
      class="calendar-event ${isGhost ? 'ghost' : ''}"
      data-event-id="${event.id}"
      data-is-ghost="${isGhost}"
    >
      ${event.title}
      ${isGhost ? '<span class="ghost-tooltip">Click to set time</span>' : ''}
    </div>
  `;
}

/**
 * Render day view event block
 */
function renderDayEvent(event) {
  const isGhost = event.is_ghost;
  
  return `
    <div 
      class="day-event ${isGhost ? 'ghost' : ''}"
      data-event-id="${event.id}"
      data-is-ghost="${isGhost}"
      style="top: ${calculateTop(event)}px; height: ${calculateHeight(event)}px;"
    >
      <span class="event-time">${formatEventTime(event)}</span>
      <span class="event-title">${escapeHtml(event.title)}</span>
      ${isGhost ? '<span class="ghost-tooltip">Click to confirm time</span>' : ''}
    </div>
  `;
}

/**
 * Render compact list event
 */
function renderListEvent(event) {
  const isGhost = event.is_ghost;
  
  return `
    <div 
      class="calendar-list-event ${isGhost ? 'ghost' : ''}"
      data-event-id="${event.id}"
      data-is-ghost="${isGhost}"
    >
      <span class="calendar-list-event-time">
        ${isGhost ? 'TBD' : formatTime(event.start_time)}
      </span>
      ${escapeHtml(event.title)}
    </div>
  `;
}
```

---

## Task 3: Ghost Resolution UI

**File:** `js/ghost-resolver.js` (NEW)

```javascript
/**
 * Ghost Resolver
 * 
 * Handles the UI for converting ghost events to real events.
 */

import { getAuthHeaders } from './auth-helpers.js';

const GhostResolver = {
  activeGhostId: null,
  modal: null,

  /**
   * Initialize - bind event handlers
   */
  init() {
    // Listen for ghost event clicks
    document.addEventListener('click', (e) => {
      const ghostEvent = e.target.closest('[data-is-ghost="true"]');
      if (ghostEvent) {
        e.preventDefault();
        e.stopPropagation();
        this.open(ghostEvent.dataset.eventId);
      }
    });

    // Create modal container
    this.createModal();
  },

  /**
   * Create the resolution modal
   */
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'ghost-resolver-modal';
    modal.className = 'ghost-resolver-modal hidden';
    modal.innerHTML = `
      <div class="ghost-resolver-backdrop"></div>
      <div class="ghost-resolver-content">
        <div class="ghost-resolver-header">
          <h3>Confirm Event</h3>
          <button class="ghost-resolver-close" aria-label="Close">×</button>
        </div>
        <div class="ghost-resolver-body">
          <div class="ghost-resolver-title"></div>
          
          <div class="ghost-resolver-field">
            <label>Date</label>
            <input type="date" id="ghost-date" />
          </div>
          
          <div class="ghost-resolver-field">
            <label>Time</label>
            <div class="ghost-resolver-time-row">
              <input type="time" id="ghost-start-time" />
              <span>to</span>
              <input type="time" id="ghost-end-time" />
            </div>
          </div>
          
          <div class="ghost-resolver-field">
            <label>Notes (optional)</label>
            <textarea id="ghost-notes" rows="2"></textarea>
          </div>
        </div>
        <div class="ghost-resolver-actions">
          <button class="ghost-resolver-cancel">Cancel</button>
          <button class="ghost-resolver-confirm">Confirm Event</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // Bind modal events
    modal.querySelector('.ghost-resolver-backdrop').addEventListener('click', () => this.close());
    modal.querySelector('.ghost-resolver-close').addEventListener('click', () => this.close());
    modal.querySelector('.ghost-resolver-cancel').addEventListener('click', () => this.close());
    modal.querySelector('.ghost-resolver-confirm').addEventListener('click', () => this.confirm());
  },

  /**
   * Open resolver for a ghost event
   */
  async open(eventId) {
    this.activeGhostId = eventId;

    // Fetch event details
    const event = await this.fetchEvent(eventId);
    if (!event) return;

    // Populate form
    this.modal.querySelector('.ghost-resolver-title').textContent = event.title;
    this.modal.querySelector('#ghost-date').value = event.date || '';
    this.modal.querySelector('#ghost-start-time').value = event.start_time?.slice(0, 5) || '';
    this.modal.querySelector('#ghost-end-time').value = event.end_time?.slice(0, 5) || '';
    this.modal.querySelector('#ghost-notes').value = event.notes || '';

    // Show modal
    this.modal.classList.remove('hidden');
    
    // Focus date input
    this.modal.querySelector('#ghost-date').focus();
  },

  /**
   * Close resolver
   */
  close() {
    this.activeGhostId = null;
    this.modal.classList.add('hidden');
  },

  /**
   * Confirm and convert ghost to real event
   */
  async confirm() {
    if (!this.activeGhostId) return;

    const date = this.modal.querySelector('#ghost-date').value;
    const startTime = this.modal.querySelector('#ghost-start-time').value;
    const endTime = this.modal.querySelector('#ghost-end-time').value;
    const notes = this.modal.querySelector('#ghost-notes').value;

    // Validate
    if (!date) {
      alert('Please select a date');
      return;
    }

    if (!startTime) {
      alert('Please select a start time');
      return;
    }

    try {
      // Update event
      await this.updateEvent(this.activeGhostId, {
        date,
        start_time: startTime,
        end_time: endTime || this.calculateEndTime(startTime),
        notes,
        is_ghost: false,
        enrichment_status: 'complete'
      });

      // Update linked capture if exists
      await this.resolveCapture(this.activeGhostId);

      // Close modal
      this.close();

      // Refresh calendar
      window.dispatchEvent(new CustomEvent('calendar-refresh'));
      window.dispatchEvent(new CustomEvent('triage-refresh'));

      // Show success feedback
      this.showSuccess('Event confirmed!');

    } catch (error) {
      console.error('Failed to confirm event:', error);
      alert('Failed to confirm event. Please try again.');
    }
  },

  /**
   * Fetch event details
   */
  async fetchEvent(eventId) {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        headers: await getAuthHeaders()
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  /**
   * Update event
   */
  async updateEvent(eventId, updates) {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update event');
    }

    return response.json();
  },

  /**
   * Mark linked capture as resolved
   */
  async resolveCapture(eventId) {
    // Find capture linked to this event
    try {
      const response = await fetch(`/api/capture?event_id=${eventId}`, {
        headers: await getAuthHeaders()
      });
      
      if (!response.ok) return;
      
      const captures = await response.json();
      if (captures.length === 0) return;

      // Update capture status
      await fetch(`/api/capture/${captures[0].id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...await getAuthHeaders()
        },
        body: JSON.stringify({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('Could not update capture:', e);
    }
  },

  /**
   * Calculate default end time (1 hour after start)
   */
  calculateEndTime(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  /**
   * Show success toast
   */
  showSuccess(message) {
    // Use existing toast system if available
    if (window.showToast) {
      window.showToast(message, 'success');
    }
  }
};

export default GhostResolver;
```

---

## Task 4: Ghost Resolver Styles

**File:** `style.css`

```css
/* ============================================
   GHOST RESOLVER MODAL
   ============================================ */

.ghost-resolver-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ghost-resolver-modal.hidden {
  display: none;
}

.ghost-resolver-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.ghost-resolver-content {
  position: relative;
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.ghost-resolver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light, #eee);
}

.ghost-resolver-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ghost-resolver-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-muted, #888);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.ghost-resolver-body {
  padding: 20px;
}

.ghost-resolver-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
  color: var(--text-primary, #333);
}

.ghost-resolver-field {
  margin-bottom: 16px;
}

.ghost-resolver-field:last-child {
  margin-bottom: 0;
}

.ghost-resolver-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ghost-resolver-field input,
.ghost-resolver-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 14px;
}

.ghost-resolver-field input:focus,
.ghost-resolver-field textarea:focus {
  outline: none;
  border-color: var(--primary-color, #007AFF);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.ghost-resolver-time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ghost-resolver-time-row input {
  flex: 1;
}

.ghost-resolver-time-row span {
  color: var(--text-muted, #888);
  font-size: 13px;
}

.ghost-resolver-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light, #eee);
}

.ghost-resolver-cancel {
  flex: 1;
  padding: 12px;
  background: var(--bg-secondary, #f5f5f5);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  cursor: pointer;
}

.ghost-resolver-cancel:hover {
  background: var(--bg-hover, #e8e8e8);
}

.ghost-resolver-confirm {
  flex: 1;
  padding: 12px;
  background: var(--primary-color, #007AFF);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
}

.ghost-resolver-confirm:hover {
  opacity: 0.9;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .ghost-resolver-content {
    width: 95%;
    max-width: none;
    margin: 16px;
  }
}
```

---

## Task 5: Wire Up Ghost Resolver

**File:** `index.html`

```html
<script type="module">
  import GhostResolver from './js/ghost-resolver.js';
  // ... other imports

  // Initialize ghost resolver
  GhostResolver.init();
</script>
```

---

## Task 6: Alternative - Chat-Based Resolution

For more complex cases, the triage panel's resolve button opens chat. Update the ChatUI to handle resolve context:

**File:** `js/triage-ui.js` (update existing ChatUI or create handler)

```javascript
// Listen for resolve-chat events from triage panel
window.addEventListener('start-resolve-chat', async (e) => {
  const { id, type, item, prompt } = e.detail;

  // Clear current conversation
  ChatUI.clear();

  // Set context for this resolution
  ChatUI.setContext({
    mode: 'resolve',
    itemId: id,
    itemType: type,
    originalItem: item
  });

  // Send initial AI message
  ChatUI.addMessage('assistant', prompt);

  // Focus input
  ChatUI.focusInput();
});

// In ChatUI.handleSend(), check for resolve mode
async handleSend(text) {
  if (this.context?.mode === 'resolve') {
    // Include resolve context in API call
    const response = await this.sendResolveMessage(text, this.context);
    
    // If AI returns structured resolution, apply it
    if (response.resolution) {
      await this.applyResolution(response.resolution);
    }
  } else {
    // Normal chat flow
    await this.sendNormalMessage(text);
  }
}
```

---

## Checklist

- [ ] Ghost events visually distinct (dotted border, muted)
- [ ] Ghost events show in month view
- [ ] Ghost events show in day view
- [ ] Ghost events show in compact list view
- [ ] Clicking ghost opens resolver modal
- [ ] Resolver has date, time, notes fields
- [ ] Confirm converts ghost to real event
- [ ] Calendar refreshes after resolution
- [ ] Linked capture marked as resolved
- [ ] Triage panel updates after resolution

---

## Testing

1. **Create ghost:** Capture "dentist next week" → ghost appears
2. **Visual:** Ghost looks different from real events
3. **Month view:** Click ghost → resolver opens
4. **Day view:** Ghost shows with placeholder time
5. **Resolve:** Set date/time → confirm → ghost becomes solid
6. **Triage update:** Ghost removed from "Needs Attention"

---

## Commit

```bash
git add style.css app.js js/ghost-resolver.js index.html
git commit -m "feat: ghost events (Sprint 9.4)

- Visual treatment: dotted borders, muted colors
- Resolution modal with date/time picker
- Convert ghost to confirmed event
- Calendar and triage refresh after resolution"
```

---

## Next Sprint

Sprint 9.5: Decay & Admin — Automatic expiration system and admin debugging view.
