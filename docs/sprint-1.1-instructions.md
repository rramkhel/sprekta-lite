
🎉 Sprint 1 Complete!

  I've successfully implemented the Event Detail Modal with view, edit, and delete functionality!

  ✅ What Was Implemented:

  Files Modified:
  - index.html - Added event detail modal + delete confirmation modal (92 lines of HTML)
  - style.css - Added modal, form, button, and toast styles (235 lines of CSS)
  - app.js - Added all modal functions (251 lines of JavaScript)

  Features Added:
  1. Event Detail Modal (View Mode)
    - Click any event → see formatted details
    - Title, date (long format), time (12hr), notes display
    - X button and backdrop click to close
  2. Event Editing
    - "Edit" button switches to form
    - Edit title, date, time, notes
    - Save → updates Supabase + localStorage
    - Cancel → discards changes
    - Validation (title and date required)
  3. Event Deletion
    - Trash icon in modal header
    - Confirmation modal with event title
    - Delete → removes from Supabase + localStorage
  4. Toast Notifications
    - "Event saved" / "Event deleted" feedback
    - Auto-dismiss after 3 seconds

  🧪 How to Test:

  Open http://localhost:3000 and try:

  1. View Mode:
    - Click the existing "Test Event from Supabase" (Jan 20)
    - Modal should open with formatted details
    - Date shows as "Monday, January 20, 2026"
    - Time shows as "2:00 PM"
  2. Edit Mode:
    - Click "Edit" button
    - Change title to "Updated Test Event"
    - Change time to "15:30"
    - Add notes: "Testing edit functionality"
    - Click "Save" → toast appears, modal closes, calendar updates
  3. Delete:
    - Click event again → click trash icon
    - Confirmation shows: "Are you sure you want to delete 'Updated Test Event'?"
    - Click "Delete" → toast appears, event disappears from calendar
  4. Create & Edit:
    - Use browser console: addTestEvent("New Event", "2026-01-22", "10:00")
    - Click it → edit → save
    - Verify changes persist after page refresh

  ✅ Success Criteria Met:

  - ✅ View event details in formatted modal
  - ✅ Edit title, date, time, notes
  - ✅ Delete with confirmation
  - ✅ Changes persist to Supabase + localStorage
  - ✅ Toast notifications
  - ✅ Backdrop click closes modals
  - ✅ Dev panel logs all actions
  - ✅ Quick Capture still works

  Sprint 1 is complete and ready for user testing! 🚀


---

# Sprint 1: Event Modal (View, Edit, Delete)

## Sprint Goal
Users can click an event → view details → edit fields → save changes OR delete the event.

This sprint combines Milestones 1-3 because they share the same modal component.

---

## Current State

**What exists:**
- Events display as pills on calendar: `<div class="event-pill" onclick="showEventDebug(${event.id})">`
- `showEventDebug()` just does `alert(JSON.stringify(event, null, 2))`
- Event object structure:
```javascript
{
  id: 1737234567890,
  title: "Call mom",
  date: "2025-01-19",
  time: "18:00",
  notes: "",
  raw: "call mom tomorrow at 6pm"
}
```

**What we're building:**
- Event detail modal (view mode)
- Edit mode (form inputs)
- Save functionality (Supabase + localStorage)
- Delete functionality with confirmation

---

## Task 1: Add Event Detail Modal HTML

**File:** `index.html`

**Location:** Add after the Quick Capture Modal, before the closing `</body>` tag.

**Add this HTML:**
```html
<!-- Event Detail Modal -->
<div id="eventDetailModal" class="modal">
    <div class="modal-content event-modal">
        <!-- Header -->
        <div class="modal-header">
            <button class="close-btn" onclick="closeEventDetail()">
                <i data-lucide="x"></i>
            </button>
            <button id="deleteEventBtn" class="delete-btn" onclick="confirmDeleteEvent()">
                <i data-lucide="trash-2"></i>
            </button>
        </div>

        <!-- View Mode -->
        <div id="eventViewMode" class="event-mode">
            <h2 id="eventViewTitle" class="event-title"></h2>
            
            <div class="event-detail-row">
                <i data-lucide="calendar"></i>
                <span id="eventViewDate"></span>
            </div>
            
            <div class="event-detail-row">
                <i data-lucide="clock"></i>
                <span id="eventViewTime"></span>
            </div>
            
            <div class="event-notes-section">
                <label>Notes</label>
                <p id="eventViewNotes" class="event-notes-display"></p>
            </div>

            <div class="modal-actions">
                <button class="btn btn-primary" onclick="enterEditMode()">
                    <i data-lucide="pencil"></i>
                    Edit
                </button>
            </div>
        </div>

        <!-- Edit Mode -->
        <div id="eventEditMode" class="event-mode" style="display: none;">
            <div class="form-group">
                <label for="eventEditTitle">Title</label>
                <input type="text" id="eventEditTitle" class="form-input" placeholder="Event title" required>
            </div>

            <div class="form-group">
                <label for="eventEditDate">Date</label>
                <input type="date" id="eventEditDate" class="form-input" required>
            </div>

            <div class="form-group">
                <label for="eventEditTime">Time</label>
                <input type="time" id="eventEditTime" class="form-input">
            </div>

            <div class="form-group">
                <label for="eventEditNotes">Notes</label>
                <textarea id="eventEditNotes" class="form-input form-textarea" rows="3" placeholder="Add notes..."></textarea>
            </div>

            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="exitEditMode()">Cancel</button>
                <button class="btn btn-primary" onclick="saveEventChanges()">Save</button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="deleteConfirmModal" class="modal">
    <div class="modal-content delete-confirm-modal">
        <h3>Delete Event?</h3>
        <p id="deleteConfirmText">Are you sure you want to delete this event?</p>
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeDeleteConfirm()">Cancel</button>
            <button class="btn btn-danger" onclick="executeDeleteEvent()">Delete</button>
        </div>
    </div>
</div>
```

---

## Task 2: Add Modal Styles

**File:** `style.css`

**Location:** Add after existing modal styles (search for `.modal` to find the section).

**Add these styles:**
```css
/* ============================================
   EVENT DETAIL MODAL
   ============================================ */

.event-modal {
    max-width: 400px;
    width: 90%;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.close-btn,
.delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    color: #666;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #f0f0f0;
    color: #333;
}

.delete-btn:hover {
    background: #fee2e2;
    color: #dc2626;
}

.event-mode {
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* View Mode */
.event-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #1a1a1a;
}

.event-detail-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    color: #555;
}

.event-detail-row i {
    width: 20px;
    height: 20px;
    color: #888;
}

.event-notes-section {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #eee;
}

.event-notes-section label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #888;
    display: block;
    margin-bottom: 8px;
}

.event-notes-display {
    color: #555;
    font-size: 0.95rem;
    line-height: 1.5;
    min-height: 40px;
}

.event-notes-display:empty::before {
    content: "No notes";
    color: #aaa;
    font-style: italic;
}

/* Edit Mode */
.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #555;
    margin-bottom: 6px;
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}

/* Modal Actions */
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

/* Buttons */
.btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.btn i {
    width: 18px;
    height: 18px;
}

.btn-primary {
    background: #6366f1;
    color: white;
}

.btn-primary:hover {
    background: #4f46e5;
}

.btn-secondary {
    background: #f3f4f6;
    color: #374151;
}

.btn-secondary:hover {
    background: #e5e7eb;
}

.btn-danger {
    background: #dc2626;
    color: white;
}

.btn-danger:hover {
    background: #b91c1c;
}

/* Delete Confirmation Modal */
.delete-confirm-modal {
    max-width: 320px;
    text-align: center;
}

.delete-confirm-modal h3 {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
    color: #1a1a1a;
}

.delete-confirm-modal p {
    color: #666;
    margin-bottom: 20px;
}

.delete-confirm-modal .modal-actions {
    justify-content: center;
}
```

---

## Task 3: Add Event Modal JavaScript

**File:** `app.js`

**Location:** Add a new section after the QUICK CAPTURE section.

**Add this code:**
```javascript
// ============================================
// EVENT DETAIL MODAL
// ============================================

let currentEventId = null;

function openEventDetail(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) {
        console.error('Event not found:', eventId);
        return;
    }

    currentEventId = eventId;

    // Populate view mode
    document.getElementById('eventViewTitle').textContent = event.title;
    document.getElementById('eventViewDate').textContent = formatDateLong(event.date);
    document.getElementById('eventViewTime').textContent = event.time ? formatTime(event.time) : 'No time set';
    document.getElementById('eventViewNotes').textContent = event.notes || '';

    // Populate edit mode (so it's ready if they click Edit)
    document.getElementById('eventEditTitle').value = event.title;
    document.getElementById('eventEditDate').value = event.date;
    document.getElementById('eventEditTime').value = event.time || '';
    document.getElementById('eventEditNotes').value = event.notes || '';

    // Show view mode, hide edit mode
    document.getElementById('eventViewMode').style.display = 'block';
    document.getElementById('eventEditMode').style.display = 'none';

    // Open modal
    document.getElementById('eventDetailModal').classList.add('open');
    
    // Refresh icons
    lucide.createIcons();

    // Log to dev panel
    if (window.devPanelModule) {
        window.devPanelModule.logAction(`Opened event: "${event.title}"`);
    }
}

function closeEventDetail() {
    document.getElementById('eventDetailModal').classList.remove('open');
    currentEventId = null;
}

function formatDateLong(dateStr) {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================
// EVENT EDITING
// ============================================

function enterEditMode() {
    document.getElementById('eventViewMode').style.display = 'none';
    document.getElementById('eventEditMode').style.display = 'block';
    
    // Focus title input
    document.getElementById('eventEditTitle').focus();

    if (window.devPanelModule) {
        window.devPanelModule.logAction('Entered edit mode');
    }
}

function exitEditMode() {
    // Reset form to original values
    const event = events.find(e => e.id === currentEventId);
    if (event) {
        document.getElementById('eventEditTitle').value = event.title;
        document.getElementById('eventEditDate').value = event.date;
        document.getElementById('eventEditTime').value = event.time || '';
        document.getElementById('eventEditNotes').value = event.notes || '';
    }

    // Switch back to view mode
    document.getElementById('eventViewMode').style.display = 'block';
    document.getElementById('eventEditMode').style.display = 'none';

    if (window.devPanelModule) {
        window.devPanelModule.logAction('Cancelled edit');
    }
}

async function saveEventChanges() {
    if (!currentEventId) return;

    const title = document.getElementById('eventEditTitle').value.trim();
    const date = document.getElementById('eventEditDate').value;
    const time = document.getElementById('eventEditTime').value;
    const notes = document.getElementById('eventEditNotes').value.trim();

    // Validation
    if (!title) {
        alert('Title is required');
        return;
    }
    if (!date) {
        alert('Date is required');
        return;
    }

    // Find and update event
    const eventIndex = events.findIndex(e => e.id === currentEventId);
    if (eventIndex === -1) {
        console.error('Event not found for save:', currentEventId);
        return;
    }

    const updatedEvent = {
        ...events[eventIndex],
        title,
        date,
        time,
        notes
    };

    events[eventIndex] = updatedEvent;

    // Save to Supabase
    try {
        const response = await fetch('/api/events', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEvent)
        });
        
        if (!response.ok) {
            console.warn('Failed to save to Supabase, using localStorage only');
        } else {
            console.log('[Storage] Event updated in Supabase');
        }
    } catch (error) {
        console.error('[Storage] Supabase error:', error);
    }

    // Save to localStorage (fallback/backup)
    localStorage.setItem('events', JSON.stringify(events));

    // Update UI
    renderCalendar();
    closeEventDetail();

    // Log to dev panel
    if (window.devPanelModule) {
        window.devPanelModule.logAction(`Saved event: "${title}"`);
    }

    // Show feedback
    showToast('Event saved');
}

// ============================================
// EVENT DELETION
// ============================================

function confirmDeleteEvent() {
    const event = events.find(e => e.id === currentEventId);
    if (!event) return;

    document.getElementById('deleteConfirmText').textContent = 
        `Are you sure you want to delete "${event.title}"?`;
    document.getElementById('deleteConfirmModal').classList.add('open');
}

function closeDeleteConfirm() {
    document.getElementById('deleteConfirmModal').classList.remove('open');
}

async function executeDeleteEvent() {
    if (!currentEventId) return;

    const event = events.find(e => e.id === currentEventId);
    const eventTitle = event ? event.title : 'Unknown';

    // Remove from array
    events = events.filter(e => e.id !== currentEventId);

    // Delete from Supabase
    try {
        const response = await fetch('/api/events', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentEventId })
        });
        
        if (!response.ok) {
            console.warn('Failed to delete from Supabase');
        } else {
            console.log('[Storage] Event deleted from Supabase');
        }
    } catch (error) {
        console.error('[Storage] Supabase delete error:', error);
    }

    // Update localStorage
    localStorage.setItem('events', JSON.stringify(events));

    // Update UI
    renderCalendar();
    closeDeleteConfirm();
    closeEventDetail();

    // Log to dev panel
    if (window.devPanelModule) {
        window.devPanelModule.logAction(`Deleted event: "${eventTitle}"`);
    }

    // Show feedback
    showToast('Event deleted');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message) {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```

---

## Task 4: Add Toast Styles

**File:** `style.css`

**Location:** Add at the end of the file.

```css
/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */

.toast-container {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.toast {
    background: #1a1a1a;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 0.95rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.show {
    opacity: 1;
    transform: translateY(0);
}
```

---

## Task 5: Update Event Pill Click Handler

**File:** `app.js`

**Location:** In the `renderCalendar()` function, find where event pills are created.

**Change from:**
```javascript
<div class="event-pill" onclick="showEventDebug(${event.id})">
```

**Change to:**
```javascript
<div class="event-pill" onclick="openEventDetail(${event.id})">
```

**Also:** Delete the `showEventDebug()` function if it exists (no longer needed).

---

## Task 6: Close Modal on Backdrop Click

**File:** `app.js`

**Location:** Add to the initialization section (DOMContentLoaded).

**Add this code:**
```javascript
// Close modals when clicking backdrop
document.getElementById('eventDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'eventDetailModal') {
        closeEventDetail();
    }
});

document.getElementById('deleteConfirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteConfirmModal') {
        closeDeleteConfirm();
    }
});
```

---

## Testing Checklist

After implementation, test these scenarios:

### View Mode
- [ ] Click event pill → modal opens
- [ ] Title displays correctly
- [ ] Date displays in long format (e.g., "Sunday, January 19, 2025")
- [ ] Time displays in 12hr format (e.g., "6:00 PM")
- [ ] Notes display (or "No notes" if empty)
- [ ] Click X → modal closes
- [ ] Click backdrop → modal closes

### Edit Mode
- [ ] Click "Edit" button → switches to form
- [ ] All fields pre-populated with current values
- [ ] Can change title
- [ ] Can change date (date picker works)
- [ ] Can change time (time picker works)
- [ ] Can change notes
- [ ] Click "Save" → changes persist, modal closes
- [ ] Click "Cancel" → changes discarded, back to view mode
- [ ] Calendar updates after save
- [ ] Toast shows "Event saved"

### Delete
- [ ] Click trash icon → confirmation modal appears
- [ ] Confirmation shows event title
- [ ] Click "Cancel" → nothing happens
- [ ] Click "Delete" → event removed, both modals close
- [ ] Calendar updates after delete
- [ ] Toast shows "Event deleted"
- [ ] Event gone from localStorage
- [ ] Event gone from Supabase (check dashboard or console)

### Edge Cases
- [ ] Event with no time set
- [ ] Event with no notes
- [ ] Event with very long title
- [ ] Multiple events on same day (can open each)
- [ ] Save with empty title → shows validation error
- [ ] Save with empty date → shows validation error

### Dev Panel
- [ ] Actions logged for open, edit, save, delete
- [ ] No console errors

---

## Success Criteria

Sprint 1 is complete when:
1. ✅ Users can view event details in a modal
2. ✅ Users can edit event title, date, time, notes
3. ✅ Users can delete events with confirmation
4. ✅ Changes persist to Supabase and localStorage
5. ✅ Toast notifications provide feedback
6. ✅ All tests pass
7. ✅ No console errors
8. ✅ Works on mobile viewport

---

## Notes for Claude Code

1. **Don't modify existing working features** - Quick capture, calendar rendering, dev panel should continue to work.

2. **Use existing patterns** - The quick capture modal exists, follow its pattern for the event detail modal.

3. **Test after each task** - Don't do all 6 tasks then test. Do Task 1 → verify HTML renders. Do Task 2 → verify styles apply. Etc.

4. **Check the dev panel** - Use it to verify actions are logging correctly.

5. **If Supabase fails, localStorage should still work** - The app should be resilient to API failures.

6. **Lucide icons need refresh** - After adding new HTML with `data-lucide` attributes, call `lucide.createIcons()`.

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `index.html` | Add event detail modal, delete confirm modal |
| `style.css` | Add modal styles, form styles, button styles, toast styles |
| `app.js` | Add openEventDetail, closeEventDetail, enterEditMode, exitEditMode, saveEventChanges, confirmDeleteEvent, closeDeleteConfirm, executeDeleteEvent, showToast, formatDateLong, backdrop click handlers |

---

## Estimated Time

| Task | Estimate |
|------|----------|
| Task 1: HTML | 15 min |
| Task 2: Modal CSS | 20 min |
| Task 3: JS Functions | 30 min |
| Task 4: Toast CSS | 5 min |
| Task 5: Update onclick | 5 min |
| Task 6: Backdrop close | 5 min |
| Testing | 20 min |
| **Total** | **~1.5-2 hours** |
