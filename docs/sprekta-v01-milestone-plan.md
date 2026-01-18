# Sprekta v0.1 Milestone Plan

## Goal
Complete the core calendar experience: users can capture events via AI, view them, edit them, delete them, and manually create/move them. Voice input deferred.

## Current State → Target State

| Feature | Now | Target |
|---------|-----|--------|
| Quick capture (text) | ✅ Working | ✅ Keep |
| AI parsing | ✅ Working | ✅ Keep |
| Calendar month view | ✅ Working | ✅ Keep |
| Event creation (AI) | ✅ Working | ✅ Keep |
| Event detail view | ❌ Shows debug JSON | ✅ Modal with formatted details |
| Event editing | ❌ None | ✅ Edit title, date, time, notes |
| Event deletion | ❌ Only "Clear All" | ✅ Delete individual events |
| Manual event creation | ❌ None | ✅ "+" button fallback |
| Drag-and-drop reschedule | ❌ None | ✅ Drag between days |
| Voice input | ❌ None | 🔜 Deferred to v0.2 |

---

## Milestone 1: Event Detail Modal

**Goal:** Click an event → see a nicely formatted modal (read-only first)

**User Flow:**
1. User sees event pill on calendar: `Call mom 6:00 PM`
2. User clicks the pill
3. Modal opens showing:
   - Title: "Call mom"
   - Date: "Sunday, January 19, 2025"
   - Time: "6:00 PM"
   - Notes: (empty or content)
   - Close button (X)
4. User clicks X or outside modal → closes

**UI Design:**
```
┌─────────────────────────────────────┐
│  ✕                                  │
│                                     │
│  📅 Call mom                        │  ← title (large)
│                                     │
│  Sunday, January 19, 2025           │  ← formatted date
│  6:00 PM                            │  ← formatted time
│                                     │
│  ─────────────────────────────────  │
│  Notes                              │
│  (No notes)                         │  ← or actual notes
│                                     │
└─────────────────────────────────────┘
```

**Data Needed:**
```javascript
// Event object (already exists)
{
  id: 1737234567890,
  title: "Call mom",
  date: "2025-01-19",      // ISO format
  time: "18:00",           // 24hr format
  notes: "",               // optional
  raw: "call mom tomorrow at 6pm",  // original input
  aiResponse: { ... }      // AI parse result
}
```

**Implementation Tasks:**
1. Add `<div id="eventDetailModal">` to index.html
2. Add modal styles to style.css (reuse quick capture modal pattern)
3. Add `openEventDetail(eventId)` function to app.js
4. Add `closeEventDetail()` function
5. Change event pill onclick from `showEventDebug()` to `openEventDetail()`
6. Format date/time nicely for display

**Success Criteria:**
- [ ] Click any event → modal opens
- [ ] Modal shows title, date, time, notes
- [ ] Click X or backdrop → modal closes
- [ ] Works on mobile (responsive)

---

## Milestone 2: Event Editing

**Goal:** Edit button in modal → switch to edit mode → save changes

**User Flow:**
1. User opens event detail modal (M1)
2. User clicks "Edit" button
3. Modal switches to edit mode:
   - Title becomes text input
   - Date becomes date picker
   - Time becomes time picker
   - Notes becomes textarea
4. User makes changes
5. User clicks "Save" → changes persist, modal closes
6. User clicks "Cancel" → discard changes, back to view mode

**UI Design (Edit Mode):**
```
┌─────────────────────────────────────┐
│  ✕                                  │
│                                     │
│  Title                              │
│  ┌─────────────────────────────┐    │
│  │ Call mom                    │    │  ← text input
│  └─────────────────────────────┘    │
│                                     │
│  Date                               │
│  ┌─────────────────────────────┐    │
│  │ 2025-01-19              📅  │    │  ← date picker
│  └─────────────────────────────┘    │
│                                     │
│  Time                               │
│  ┌─────────────────────────────┐    │
│  │ 18:00                   🕐  │    │  ← time picker
│  └─────────────────────────────┘    │
│                                     │
│  Notes                              │
│  ┌─────────────────────────────┐    │
│  │                             │    │  ← textarea
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│         [ Cancel ]  [ Save ]        │
└─────────────────────────────────────┘
```

**Implementation Tasks:**
1. Add "Edit" button to detail modal (M1)
2. Create edit mode HTML (inputs for each field)
3. Add `enterEditMode()` function - swap view → edit
4. Add `exitEditMode()` function - swap edit → view
5. Add `saveEventChanges()` function:
   - Update local `events` array
   - Save to Supabase via `/api/events` PUT
   - Save to localStorage (fallback)
   - Re-render calendar
   - Close modal
6. Handle validation (title required, valid date/time)

**Success Criteria:**
- [ ] "Edit" button appears in detail modal
- [ ] Clicking Edit shows form with current values
- [ ] Can change title, date, time, notes
- [ ] Save persists to Supabase + localStorage
- [ ] Cancel discards changes
- [ ] Calendar updates immediately after save

---

## Milestone 3: Event Deletion

**Goal:** Delete button with confirmation → remove event

**User Flow:**
1. User opens event detail modal
2. User clicks "Delete" button (trash icon)
3. Confirmation appears: "Delete this event?"
4. User confirms → event deleted, modal closes, calendar updates
5. User cancels → nothing happens

**UI Design:**
```
Detail Modal (add delete button):
┌─────────────────────────────────────┐
│  ✕                            🗑️    │  ← delete icon top-right
│  ...                                │
└─────────────────────────────────────┘

Confirmation (inline or mini-modal):
┌─────────────────────────────────────┐
│                                     │
│  Delete "Call mom"?                 │
│                                     │
│  This cannot be undone.             │
│                                     │
│         [ Cancel ]  [ Delete ]      │
│                                     │
└─────────────────────────────────────┘
```

**Implementation Tasks:**
1. Add delete button (trash icon) to detail modal header
2. Add `deleteEvent(eventId)` function:
   - Show confirmation (can use `confirm()` for v0.1, nicer modal later)
   - Remove from local `events` array
   - Delete from Supabase via `/api/events` DELETE
   - Remove from localStorage
   - Close modal
   - Re-render calendar
3. Add toast/feedback: "Event deleted"

**Success Criteria:**
- [ ] Delete button visible in modal
- [ ] Clicking shows confirmation
- [ ] Confirming removes event from calendar
- [ ] Event removed from Supabase + localStorage
- [ ] Cancel does nothing

---

## Milestone 4: Manual Event Creation

**Goal:** "+" button to create event without AI (fallback/power user)

**User Flow:**
1. User clicks "+" button (new location TBD - maybe next to quick capture)
2. Empty edit modal opens (same as M2 edit mode)
3. User fills in title, date, time, notes
4. User clicks "Save" → event created
5. Calendar updates

**UI Design:**
```
Calendar header or floating button:
┌──────────────────────────────────────────────┐
│  < January 2025 >              [+] [Clear]   │
│  ...                                          │
└──────────────────────────────────────────────┘

Or near quick capture button:
┌─────────────────────┐
│  ✏️ Quick Capture   │  ← existing
│  + New Event        │  ← new (smaller, secondary)
└─────────────────────┘
```

**Implementation Tasks:**
1. Add "+" button to UI (decide placement)
2. Add `openNewEventModal()` function:
   - Open edit modal with empty fields
   - Default date = today (or selected day if we track that)
   - Default time = next hour rounded
3. Reuse save logic from M2, but POST instead of PUT
4. Generate new event ID (timestamp-based)

**Success Criteria:**
- [ ] "+" button visible and accessible
- [ ] Clicking opens empty edit modal
- [ ] Can fill in all fields
- [ ] Save creates new event
- [ ] Event appears on calendar immediately

---

## Milestone 5: Drag-and-Drop Reschedule

**Goal:** Drag event pill to different day → updates date

**User Flow:**
1. User long-presses or clicks-and-holds event pill
2. Pill becomes "draggable" (visual feedback)
3. User drags to different day cell
4. Day cell highlights on hover (drop target)
5. User releases → event moves to new date
6. Supabase + localStorage updated

**UI Design:**
```
Dragging state:
┌─────────┬─────────┬─────────┐
│  Mon 19 │  Tue 20 │  Wed 21 │
│         │ ┌─────┐ │         │
│         │ │Call │ │  ← dragging (semi-transparent)
│         │ │ mom │ │
│         │ └─────┘ │         │
│         │    ↓    │         │
│         │  ~~~~   │  ← drop target highlight
└─────────┴─────────┴─────────┘

After drop:
┌─────────┬─────────┬─────────┐
│  Mon 19 │  Tue 20 │  Wed 21 │
│         │         │ Call mom│  ← moved!
│         │         │ 6:00 PM │
└─────────┴─────────┴─────────┘
```

**Implementation Tasks:**
1. Add `draggable="true"` to event pills
2. Add drag event listeners:
   - `ondragstart` - store event ID, add dragging class
   - `ondragend` - cleanup
3. Add drop zone listeners to day cells:
   - `ondragover` - prevent default, add highlight
   - `ondragleave` - remove highlight
   - `ondrop` - update event date, save, re-render
4. Update event in Supabase + localStorage
5. Visual feedback (ghost image, highlight)

**Touch Support (mobile):**
- May need touch event handlers (`touchstart`, `touchmove`, `touchend`)
- Or use a library like SortableJS
- Can defer full mobile drag to v0.2 if complex

**Success Criteria:**
- [ ] Can drag event pill on desktop
- [ ] Drop target highlights on hover
- [ ] Dropping updates event date
- [ ] Change persists to Supabase + localStorage
- [ ] Calendar re-renders correctly
- [ ] (Stretch) Works on touch devices

---

## Implementation Order

```
M1: Event Detail Modal
 ↓
M2: Event Editing
 ↓
M3: Event Deletion
 ↓
M4: Manual Event Creation
 ↓
M5: Drag-and-Drop
```

Each milestone builds on the previous. M1-M3 share the same modal, so do them together. M4 reuses M2's edit form. M5 is independent and can be done last (or deferred if time-boxed).

---

## Estimated Effort

| Milestone | Complexity | Estimate |
|-----------|------------|----------|
| M1: Detail Modal | Low | 1-2 hours |
| M2: Editing | Medium | 2-3 hours |
| M3: Deletion | Low | 30 min |
| M4: Manual Create | Low | 1 hour |
| M5: Drag-and-Drop | Medium-High | 2-4 hours |
| **Total** | | **7-11 hours** |

---

## Files to Modify

**index.html:**
- Add event detail modal HTML
- Add "+" button for manual creation

**style.css:**
- Modal styles (view mode, edit mode)
- Drag-and-drop states (dragging, drop target)
- Button styles (edit, delete, save, cancel)

**app.js:**
- `openEventDetail(eventId)` - open modal with event data
- `closeEventDetail()` - close modal
- `enterEditMode()` - switch to edit form
- `exitEditMode()` - switch to view mode
- `saveEventChanges()` - persist edits
- `deleteEvent(eventId)` - remove event
- `openNewEventModal()` - create new event
- Drag-and-drop event handlers

**api/events.js:**
- Verify PUT endpoint works for updates
- Verify DELETE endpoint works

---

## Testing Strategy

**After each milestone:**
1. Test in demo mode first (no API calls)
2. Test with real Supabase
3. Test on mobile viewport
4. Check dev panel logs for errors
5. Save snapshot before moving to next milestone

**Scenarios to test:**
- Create event via quick capture → edit it → delete it
- Create event manually → drag to new date
- Edit event → cancel → verify no changes
- Delete event → verify gone from Supabase
- Multiple events on same day
- Events spanning month boundaries

---

## Definition of Done (v0.1)

- [ ] All 5 milestones complete
- [ ] Works on desktop Chrome
- [ ] Works on mobile Safari (iOS)
- [ ] Data persists in Supabase
- [ ] No console errors
- [ ] Quick capture still works
- [ ] Dev panel still works
- [ ] Snapshot saved as "v0.1-complete"

---

## What's Next (v0.2)

After v0.1 is solid:
1. Voice input (Web Speech API)
2. Week/day views
3. Recurring events
4. Smart categorization
5. Visual polish (animations, empty states)
