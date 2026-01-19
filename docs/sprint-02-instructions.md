
Sprint 2 Complete! ✓

  I've successfully implemented all Sprint 2 features:

  Part A: Manual Event Creation

  1. UI Updates - Added circular "+" button next to Quick Capture button (index.html:68-77, style.css:176-242)
  2. New Event Modal - Created openNewEventModal() function that opens in edit mode with today's date and next hour
  (app.js:420-459)
  3. Create/Update Logic - Updated saveEventChanges() to handle both POST (create) and PUT (update) operations (app.js:511-588)
  4. Delete Button Management - Updated close/exit functions to show/hide delete button appropriately (app.js:397-399, 534-536)

  Part B: Drag-and-Drop Reschedule

  1. Draggable Events - Made event pills draggable with drag attributes (app.js:71-80)
  2. Drop Zones - Made day cells accept drops with dragover/drop handlers (app.js:64-69)
  3. Visual Feedback - Added .dragging and .drag-over CSS states (style.css:176-189)
  4. Drag Handlers - Implemented all 5 drag handlers with Supabase sync (app.js:123-237)
  5. Click Prevention - Added isDragging flag to prevent modal from opening after drag (app.js:9, 365-368)

  Dev Server Status

  Your app is running at http://localhost:3000

  Testing Checklist

  You can now test:
  - ✅ Click "+" button to create new event manually
  - ✅ Drag events between days to reschedule
  - ✅ Visual feedback during drag (semi-transparent event, blue dashed border on drop zone)
  - ✅ Toast notifications ("Event created", "Event moved")
  - ✅ Events persist to Supabase and localStorage

  All Sprint 2 functionality is implemented and ready to test!


---

Day View Feature Complete! 🎉

  I've successfully implemented the Day View with drag-to-resize functionality! Here's what was added:

  Database Changes:

  - ✅ Added end_time column to store event duration
  - ✅ Updated schema files and setup scripts

  UI Updates:

  - ✅ Added Month/Day view toggle buttons in header
  - ✅ Created time-grid layout (6am-10pm with 1-hour slots)
  - ✅ Events displayed as visual blocks sized by duration
  - ✅ Resize handle at bottom of each event block

  Features:

  1. View Switching - Toggle between Month and Day views
  2. Day View Display - Shows events for selected day with time slots
  3. Event Resizing - Drag bottom edge of event to change duration
  4. Auto Duration - New events default to 1-hour duration
  5. Visual Feedback - Events show start-end time ranges
  6. Persistence - Duration changes save to Supabase

  How to Use:

  1. Click "Day" button in header to switch to Day View
  2. Events appear as colored blocks showing their duration
  3. Hover over an event - resize handle appears at bottom
  4. Drag the bottom edge to make event longer/shorter
  5. Release mouse - duration updates automatically

  Navigation:

  - Use ← → arrows to change the displayed day
  - Click event blocks to open detail modal
  - Switch back to "Month" view anytime

  The app is live at http://localhost:3000 - try switching to Day View and resizing an event!



---

# Sprint 2: Manual Event Creation + Drag-and-Drop

## Sprint Goal
Users can create events manually (without AI) via a "+" button, and drag events between days to reschedule.

This sprint completes Milestones 4-5 and finishes the v0.1 user features.

---

## Current State (After Sprint 1)

**What exists:**
- Event detail modal with view/edit/delete ✅
- `openEventDetail(eventId)` opens modal in view mode
- `enterEditMode()` switches to edit form
- `saveEventChanges()` persists to Supabase + localStorage
- Toast notifications via `showToast(message)`
- Events array and render cycle working

**What we're building:**
- "+" button for manual event creation
- `openNewEventModal()` function (reuses edit form)
- Drag-and-drop between calendar days
- Visual feedback during drag

---

## Part A: Manual Event Creation

### Task A1: Add "New Event" Button

**File:** `index.html`

**Location:** Find the Quick Capture button section. Add a secondary button next to it.

**Find this:**
```html
<!-- Quick Capture Button -->
<button class="quick-capture-btn" onclick="openQuickCapture()">
    <i data-lucide="pencil"></i>
    Quick Capture
</button>
```

**Replace with:**
```html
<!-- Action Buttons -->
<div class="action-buttons">
    <button class="quick-capture-btn" onclick="openQuickCapture()">
        <i data-lucide="pencil"></i>
        Quick Capture
    </button>
    <button class="new-event-btn" onclick="openNewEventModal()">
        <i data-lucide="plus"></i>
    </button>
</div>
```

---

### Task A2: Style the Action Buttons

**File:** `style.css`

**Location:** Find the `.quick-capture-btn` styles. Update and add new styles.

**Find and update `.quick-capture-btn`:**
```css
/* ============================================
   ACTION BUTTONS (Bottom Right)
   ============================================ */

.action-buttons {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    gap: 12px;
    align-items: center;
    z-index: 100;
}

.quick-capture-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    transition: all 0.2s;
}

.quick-capture-btn:hover {
    background: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
}

.quick-capture-btn i {
    width: 20px;
    height: 20px;
}

.new-event-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: white;
    color: #6366f1;
    border: 2px solid #6366f1;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
}

.new-event-btn:hover {
    background: #6366f1;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.new-event-btn i {
    width: 24px;
    height: 24px;
}
```

---

### Task A3: Add New Event Modal Function

**File:** `app.js`

**Location:** Add after the EVENT DETAIL MODAL section.

**Add this code:**
```javascript
// ============================================
// MANUAL EVENT CREATION
// ============================================

function openNewEventModal() {
    // Clear the current event (we're creating new, not editing)
    currentEventId = null;

    // Set default values
    const today = new Date();
    const defaultDate = formatDateISO(today);
    const defaultTime = getNextHourTime();

    // Clear/set form fields
    document.getElementById('eventEditTitle').value = '';
    document.getElementById('eventEditDate').value = defaultDate;
    document.getElementById('eventEditTime').value = defaultTime;
    document.getElementById('eventEditNotes').value = '';

    // Hide view mode, show edit mode directly
    document.getElementById('eventViewMode').style.display = 'none';
    document.getElementById('eventEditMode').style.display = 'block';

    // Hide delete button (can't delete what doesn't exist yet)
    document.getElementById('deleteEventBtn').style.display = 'none';

    // Open modal
    document.getElementById('eventDetailModal').classList.add('open');

    // Focus title input
    setTimeout(() => {
        document.getElementById('eventEditTitle').focus();
    }, 100);

    // Refresh icons
    lucide.createIcons();

    // Log to dev panel
    if (window.devPanelModule) {
        window.devPanelModule.logAction('Opened new event modal');
    }
}

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getNextHourTime() {
    const now = new Date();
    let hours = now.getHours() + 1;
    if (hours > 23) hours = 9; // Default to 9am if late night
    return `${String(hours).padStart(2, '0')}:00`;
}
```

---

### Task A4: Update Save Function to Handle New Events

**File:** `app.js`

**Location:** Modify the existing `saveEventChanges()` function.

**Replace the entire `saveEventChanges()` function with:**
```javascript
async function saveEventChanges() {
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

    // Determine if this is a new event or an edit
    const isNewEvent = currentEventId === null;

    if (isNewEvent) {
        // CREATE NEW EVENT
        const newEvent = {
            id: Date.now(),
            title,
            date,
            time,
            notes,
            raw: '', // No AI input for manual events
            created_at: new Date().toISOString()
        };

        events.push(newEvent);

        // Save to Supabase
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            });

            if (!response.ok) {
                console.warn('Failed to save to Supabase, using localStorage only');
            } else {
                console.log('[Storage] New event created in Supabase');
            }
        } catch (error) {
            console.error('[Storage] Supabase error:', error);
        }

        // Log to dev panel
        if (window.devPanelModule) {
            window.devPanelModule.logAction(`Created event: "${title}"`);
        }

        showToast('Event created');

    } else {
        // UPDATE EXISTING EVENT
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

        // Log to dev panel
        if (window.devPanelModule) {
            window.devPanelModule.logAction(`Saved event: "${title}"`);
        }

        showToast('Event saved');
    }

    // Save to localStorage (fallback/backup)
    localStorage.setItem('events', JSON.stringify(events));

    // Update UI
    renderCalendar();
    closeEventDetail();
}
```

---

### Task A5: Update Close/Exit Functions to Restore Delete Button

**File:** `app.js`

**Location:** Modify `closeEventDetail()` and `exitEditMode()` functions.

**Update `closeEventDetail()`:**
```javascript
function closeEventDetail() {
    document.getElementById('eventDetailModal').classList.remove('open');
    currentEventId = null;
    
    // Reset delete button visibility for next open
    document.getElementById('deleteEventBtn').style.display = 'block';
    
    // Reset to view mode for next open
    document.getElementById('eventViewMode').style.display = 'block';
    document.getElementById('eventEditMode').style.display = 'none';
}
```

**Update `exitEditMode()` - add delete button restore:**
```javascript
function exitEditMode() {
    // If we were creating a new event, just close the modal
    if (currentEventId === null) {
        closeEventDetail();
        return;
    }

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
    
    // Restore delete button
    document.getElementById('deleteEventBtn').style.display = 'block';

    if (window.devPanelModule) {
        window.devPanelModule.logAction('Cancelled edit');
    }
}
```

---

## Part B: Drag-and-Drop Reschedule

### Task B1: Update Calendar Rendering for Drag-and-Drop

**File:** `app.js`

**Location:** Modify the `renderCalendar()` function.

**Find the event pill rendering code and update it. Change from:**
```javascript
${dayEvents.map(event => `
    <div class="event-pill" onclick="openEventDetail(${event.id})">
        ${event.title}
        ${event.time ? ` ${formatTime(event.time)}` : ''}
    </div>
`).join('')}
```

**Change to:**
```javascript
${dayEvents.map(event => `
    <div class="event-pill" 
         draggable="true"
         data-event-id="${event.id}"
         onclick="openEventDetail(${event.id})"
         ondragstart="handleDragStart(event, ${event.id})"
         ondragend="handleDragEnd(event)">
        ${event.title}
        ${event.time ? ` ${formatTime(event.time)}` : ''}
    </div>
`).join('')}
```

**Also update the day cell to be a drop zone. Find:**
```javascript
html += `
    <div class="day-cell ${todayCheck ? 'today' : ''}">
        <div class="day-number">${day}</div>
        <div class="day-events">
```

**Change to:**
```javascript
html += `
    <div class="day-cell ${todayCheck ? 'today' : ''}"
         data-date="${date}"
         ondragover="handleDragOver(event)"
         ondragleave="handleDragLeave(event)"
         ondrop="handleDrop(event, '${date}')">
        <div class="day-number">${day}</div>
        <div class="day-events">
```

---

### Task B2: Add Drag-and-Drop Styles

**File:** `style.css`

**Location:** Add after the event-pill styles or at the end of the calendar section.

**Add these styles:**
```css
/* ============================================
   DRAG AND DROP
   ============================================ */

.event-pill {
    cursor: grab;
    user-select: none;
}

.event-pill:active {
    cursor: grabbing;
}

.event-pill.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}

.day-cell {
    transition: background-color 0.2s, box-shadow 0.2s;
}

.day-cell.drag-over {
    background-color: #eef2ff;
    box-shadow: inset 0 0 0 2px #6366f1;
}

.day-cell.drag-over .day-number {
    color: #6366f1;
    font-weight: 600;
}

/* Prevent text selection during drag */
.calendar-grid.dragging {
    user-select: none;
}

/* Ghost image styling (optional - browser handles this) */
.drag-ghost {
    background: #6366f1;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

---

### Task B3: Add Drag-and-Drop JavaScript

**File:** `app.js`

**Location:** Add a new section after the MANUAL EVENT CREATION section.

**Add this code:**
```javascript
// ============================================
// DRAG AND DROP RESCHEDULE
// ============================================

let draggedEventId = null;

function handleDragStart(e, eventId) {
    draggedEventId = eventId;
    
    // Add visual feedback
    e.target.classList.add('dragging');
    document.getElementById('calendarGrid').classList.add('dragging');
    
    // Set drag data (required for Firefox)
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Log to dev panel
    const event = events.find(ev => ev.id === eventId);
    if (window.devPanelModule && event) {
        window.devPanelModule.logAction(`Started dragging: "${event.title}"`);
    }
}

function handleDragEnd(e) {
    // Remove visual feedback
    e.target.classList.remove('dragging');
    document.getElementById('calendarGrid').classList.remove('dragging');
    
    // Remove drag-over from all cells
    document.querySelectorAll('.day-cell.drag-over').forEach(cell => {
        cell.classList.remove('drag-over');
    });
    
    draggedEventId = null;
}

function handleDragOver(e) {
    e.preventDefault(); // Required to allow drop
    e.dataTransfer.dropEffect = 'move';
    
    // Add highlight to drop target
    const dayCell = e.target.closest('.day-cell');
    if (dayCell && !dayCell.classList.contains('other-month')) {
        dayCell.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    // Remove highlight from drop target
    const dayCell = e.target.closest('.day-cell');
    if (dayCell) {
        // Only remove if we're actually leaving the cell (not entering a child)
        const relatedTarget = e.relatedTarget;
        if (!dayCell.contains(relatedTarget)) {
            dayCell.classList.remove('drag-over');
        }
    }
}

async function handleDrop(e, newDate) {
    e.preventDefault();
    
    // Remove highlight
    const dayCell = e.target.closest('.day-cell');
    if (dayCell) {
        dayCell.classList.remove('drag-over');
    }
    
    if (!draggedEventId) return;
    
    // Find the event
    const eventIndex = events.findIndex(ev => ev.id === draggedEventId);
    if (eventIndex === -1) {
        console.error('Dragged event not found:', draggedEventId);
        return;
    }
    
    const event = events[eventIndex];
    const oldDate = event.date;
    
    // Don't do anything if dropped on same date
    if (oldDate === newDate) {
        return;
    }
    
    // Update the event date
    events[eventIndex] = {
        ...event,
        date: newDate
    };
    
    // Save to Supabase
    try {
        const response = await fetch('/api/events', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(events[eventIndex])
        });
        
        if (!response.ok) {
            console.warn('Failed to save to Supabase, using localStorage only');
        } else {
            console.log('[Storage] Event rescheduled in Supabase');
        }
    } catch (error) {
        console.error('[Storage] Supabase error:', error);
    }
    
    // Save to localStorage
    localStorage.setItem('events', JSON.stringify(events));
    
    // Re-render calendar
    renderCalendar();
    
    // Log to dev panel
    if (window.devPanelModule) {
        window.devPanelModule.logAction(`Rescheduled "${event.title}" from ${oldDate} to ${newDate}`);
    }
    
    // Show feedback
    showToast('Event rescheduled');
}
```

---

### Task B4: Prevent Click When Dragging

**File:** `app.js`

**Location:** The current event pill has both `onclick` and drag handlers. We need to prevent the click from firing after a drag.

**Update `handleDragStart()` to add a flag:**
```javascript
let draggedEventId = null;
let isDragging = false;

function handleDragStart(e, eventId) {
    isDragging = true;
    draggedEventId = eventId;
    
    // ... rest of existing code
}

function handleDragEnd(e) {
    // Delay resetting isDragging so click handler can check it
    setTimeout(() => {
        isDragging = false;
    }, 0);
    
    // ... rest of existing code
}
```

**Update `openEventDetail()` to check the flag:**
```javascript
function openEventDetail(eventId) {
    // Don't open if we just finished dragging
    if (isDragging) {
        return;
    }
    
    // ... rest of existing code
}
```

---

## Testing Checklist

### Manual Event Creation (Part A)
- [ ] "+" button appears next to Quick Capture button
- [ ] Hover states work on both buttons
- [ ] Click "+" → modal opens in edit mode
- [ ] Delete button is hidden (not visible)
- [ ] Default date is today
- [ ] Default time is next hour
- [ ] Title field is focused
- [ ] Fill in title → Save → event appears on calendar
- [ ] Event persists after page refresh
- [ ] Event saved to Supabase
- [ ] Toast shows "Event created"
- [ ] Cancel closes modal without creating event
- [ ] Dev panel logs "Opened new event modal" and "Created event"

### Drag-and-Drop (Part B)
- [ ] Event pills show grab cursor on hover
- [ ] Start dragging → pill becomes semi-transparent
- [ ] Drag over day → day cell highlights (blue border)
- [ ] Drag away → highlight removed
- [ ] Drop on new day → event moves
- [ ] Calendar re-renders with event on new day
- [ ] Date persists after page refresh
- [ ] Event updated in Supabase
- [ ] Toast shows "Event rescheduled"
- [ ] Dev panel logs drag start and reschedule
- [ ] Clicking event after drag still opens modal
- [ ] Dropping on same day does nothing (no toast, no save)
- [ ] Can't drop on "other-month" cells (greyed out days)

### Integration
- [ ] Quick Capture still works
- [ ] View/Edit/Delete from Sprint 1 still works
- [ ] Create new event manually → edit it → delete it
- [ ] Create via Quick Capture → drag to new day → edit
- [ ] Multiple events on same day all draggable
- [ ] No console errors
- [ ] Works on mobile viewport (touch may not work - OK for v0.1)

---

## Success Criteria

Sprint 2 is complete when:
1. ✅ Users can create events via "+" button
2. ✅ "+" opens empty form with sensible defaults
3. ✅ Save creates new event in Supabase + localStorage
4. ✅ Users can drag events between calendar days
5. ✅ Drag has visual feedback (opacity, highlight)
6. ✅ Drop updates event date in Supabase + localStorage
7. ✅ All Sprint 1 functionality still works
8. ✅ Toast notifications for create and reschedule
9. ✅ Dev panel logs all actions
10. ✅ No console errors

---

## Notes for Claude Code

1. **Task order matters for Part A** - Do A1 (HTML) → A2 (CSS) → A3 (JS) → A4 (update save) → A5 (update close). Test after each.

2. **Part B builds on Part A** - Make sure manual creation works before starting drag-and-drop.

3. **renderCalendar() is the key function** - Task B1 modifies it. Be careful not to break existing functionality. 

4. **Test drag in Chrome first** - Firefox and Safari may have quirks. Chrome is the baseline.

5. **Mobile touch drag is complex** - Don't try to implement touch drag in this sprint. It's OK if drag only works on desktop for v0.1.

6. **The `isDragging` flag is important** - Without it, the click handler fires after every drag, which opens the modal unexpectedly.

7. **Don't forget to hide/show delete button** - When creating new event, hide it. When viewing existing event, show it. The close/exit functions need to restore it.

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `index.html` | Wrap buttons in `.action-buttons` div, add "+" button |
| `style.css` | Action button styles, drag-and-drop states |
| `app.js` | `openNewEventModal()`, `formatDateISO()`, `getNextHourTime()`, update `saveEventChanges()`, update `closeEventDetail()`, update `exitEditMode()`, drag handlers |

---

## Estimated Time

| Task | Estimate |
|------|----------|
| A1: Add button HTML | 5 min |
| A2: Button styles | 10 min |
| A3: New event function | 15 min |
| A4: Update save function | 15 min |
| A5: Update close/exit | 10 min |
| B1: Update renderCalendar | 15 min |
| B2: Drag-and-drop CSS | 10 min |
| B3: Drag-and-drop JS | 25 min |
| B4: Prevent click on drag | 10 min |
| Testing | 20 min |
| **Total** | **~2-2.5 hours** |

---

## After Sprint 2

With Sprint 2 complete, **v0.1 user features are done!**

Remaining work for v0.1:
- [ ] Testing and bug fixes
- [ ] Mobile responsiveness check
- [ ] Save snapshot as "v0.1-complete"
- [ ] Deploy to production

Then v0.2 can begin:
- Voice input (Web Speech API)
- Week/day views
- Recurring events
- Visual polish
