# Milestone 8.7: Adaptive Compact Calendar

**Goal:** Create iOS-style compact calendar views that work when sidebars squeeze the calendar into narrow widths.

**Status:** Ready for Implementation  
**Estimated Effort:** 6-8 hours  
**Dependencies:** Milestone 8.5+ (side panel layout working)

---

## Problem Statement

### Current Layout Scenarios

| Scenario | Calendar Width | Current Behavior | Problem |
|----------|---------------|------------------|---------|
| Nothing open | 100% | Full month grid | ✅ Works fine |
| Chat panel open | ~60% | Same grid, squeezed | ⚠️ Day cells cramped, events cut off |
| Chat + Profile open | ~20-30% | Same grid, unusable | ❌ Completely broken |

### The Fix

Detect available width and switch to progressively more compact layouts:

| Width | Layout Mode | View |
|-------|-------------|------|
| > 800px | **Full** | Standard 7-column month grid |
| 500-800px | **Compact** | Mini month + agenda list |
| < 500px | **Ultra-compact** | Week strip + day list |

---

## Design Specification

### Layout Mode: Full (> 800px)

**No changes needed.** Current 7-column grid with event pills.

```
┌─────────────────────────────────────────────────────────────┐
│  < January 2026 >                    [Month] [Day]          │
├────┬────┬────┬────┬────┬────┬────┬──────────────────────────┤
│ Sun│ Mon│ Tue│ Wed│ Thu│ Fri│ Sat│                          │
├────┼────┼────┼────┼────┼────┼────┤                          │
│    │    │    │ 1  │ 2  │ 3  │ 4  │                          │
│    │    │    │    │    │ ██ │    │  ← Event pills visible   │
├────┼────┼────┼────┼────┼────┼────┤                          │
│ 5  │ 6  │ 7  │ 8  │ 9  │ 10 │ 11 │                          │
...
```

---

### Layout Mode: Compact (500-800px)

**Mini month grid + scrollable agenda below.**

```
┌────────────────────────────────────┐
│  < January 2026 >     [Mo] [Day]   │
├────────────────────────────────────┤
│   S   M   T   W   T   F   S        │
│               1   2   3   4        │
│   5   6   7   8   9  10  11        │
│  12  13  14  15  16  17  18        │
│  19  20  21 [22] 23  24  25        │  ← Selected day highlighted
│  26  27  28  29  30  31            │    Dots under days with events
│                   •   •            │
├────────────────────────────────────┤
│  Wednesday, January 22             │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ 9:00 AM                      │  │
│  │ Team Standup                 │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 2:00 PM                      │  │
│  │ Call with Bob                │  │  ← Scrollable agenda
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 6:00 PM                      │  │
│  │ Dinner with Sarah            │  │
│  └──────────────────────────────┘  │
│                                    │
│  (No more events)                  │
└────────────────────────────────────┘
```

**Key Features:**
- Mini month grid (numbers only, no event pills)
- Dots under dates that have events
- Click date → updates agenda below
- Agenda shows all events for selected day
- Click event → opens detail modal

---

### Layout Mode: Ultra-Compact (< 500px)

**Horizontal week strip + day events list.**

```
┌─────────────────────────┐
│ < Jan 2026 >   [W] [D]  │
├─────────────────────────┤
│  M    T    W    T    F  │
│ 20   21  [22]  23   24  │  ← Swipeable week strip
│  •         •            │    Dots = has events
├─────────────────────────┤
│ Wed, Jan 22             │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 9:00 AM             │ │
│ │ Team Standup        │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 2:00 PM             │ │  ← Event cards
│ │ Call with Bob       │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 6:00 PM             │ │
│ │ Dinner              │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Key Features:**
- Week strip shows 5-7 days horizontally
- Swipe left/right to change weeks
- Tap date → shows that day's events
- Events as tappable cards
- Very touch-friendly

---

## State Management

### New State Variables

```javascript
// Calendar layout state
let calendarLayoutMode = 'full'; // 'full' | 'compact' | 'ultra-compact'
let selectedDate = new Date();   // For agenda views

// Existing (keep)
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentView = 'month'; // 'month' | 'day'
```

### Layout Detection

```javascript
function detectLayoutMode() {
    const container = document.getElementById('app-main');
    const width = container.offsetWidth;
    
    if (width > 800) return 'full';
    if (width > 500) return 'compact';
    return 'ultra-compact';
}

function updateLayoutMode() {
    const newMode = detectLayoutMode();
    if (newMode !== calendarLayoutMode) {
        calendarLayoutMode = newMode;
        renderCalendar(); // Re-render in new mode
    }
}
```

### Triggers for Layout Check

```javascript
// Check on:
// 1. Window resize
window.addEventListener('resize', debounce(updateLayoutMode, 100));

// 2. Chat panel open/close
function toggleChatPanel() {
    // ... existing code ...
    setTimeout(updateLayoutMode, 350); // After animation
}

// 3. Profile panel open/close
function toggleProfilePanel() {
    // ... existing code ...
    setTimeout(updateLayoutMode, 350);
}
```

---

## Implementation Tasks

### Sprint 8.7.1: Layout Detection & Switching

**Goal:** Detect width and switch render modes.

#### Task 1.1: Add Layout State

**File:** `app.js`

Add at top with other state:

```javascript
// Layout state
let calendarLayoutMode = 'full';
let selectedDate = new Date();
```

#### Task 1.2: Add Layout Detection

**File:** `app.js`

```javascript
function detectLayoutMode() {
    const container = document.getElementById('app-main');
    if (!container) return 'full';
    
    const width = container.offsetWidth;
    
    if (width > 800) return 'full';
    if (width > 500) return 'compact';
    return 'ultra-compact';
}

function updateLayoutMode() {
    const newMode = detectLayoutMode();
    if (newMode !== calendarLayoutMode) {
        console.log(`[Layout] Switching: ${calendarLayoutMode} → ${newMode}`);
        calendarLayoutMode = newMode;
        
        // Update container class for CSS
        const container = document.querySelector('.calendar-container');
        container.classList.remove('layout-full', 'layout-compact', 'layout-ultra-compact');
        container.classList.add(`layout-${newMode}`);
        
        renderCalendar();
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

#### Task 1.3: Wire Up Triggers

**File:** `app.js`

In DOMContentLoaded or init:

```javascript
// Initial layout detection
updateLayoutMode();

// Resize listener
window.addEventListener('resize', debounce(updateLayoutMode, 100));

// Also call updateLayoutMode() after chat/profile panel animations
```

Update chat toggle (in `js/triage-ui.js` or wherever):

```javascript
function toggleChatPanel() {
    // ... existing toggle code ...
    
    // After animation completes, check layout
    setTimeout(() => {
        if (typeof updateLayoutMode === 'function') {
            updateLayoutMode();
        }
    }, 350);
}
```

---

### Sprint 8.7.2: Compact Month View

**Goal:** Mini month grid + agenda list.

#### Task 2.1: Update renderCalendar() to Branch

**File:** `app.js`

```javascript
function renderCalendar() {
    if (currentView === 'day') {
        renderDayView();
        return;
    }
    
    // Branch based on layout mode
    switch (calendarLayoutMode) {
        case 'compact':
            renderCompactMonthView();
            break;
        case 'ultra-compact':
            renderUltraCompactView();
            break;
        default:
            renderFullMonthView();
    }
}

// Rename existing renderCalendar logic to:
function renderFullMonthView() {
    // ... existing month grid code ...
}
```

#### Task 2.2: Create Compact Month Renderer

**File:** `app.js`

```javascript
function renderCompactMonthView() {
    const grid = document.getElementById('calendarGrid');
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    // Build mini month grid
    let html = '<div class="compact-calendar">';
    
    // Mini month header
    html += '<div class="compact-month-grid">';
    html += '<div class="compact-weekdays">';
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => {
        html += `<span class="compact-weekday">${d}</span>`;
    });
    html += '</div>';
    
    // Mini month days
    html += '<div class="compact-days">';
    
    // Empty cells for first week
    for (let i = 0; i < firstDay; i++) {
        html += '<span class="compact-day empty"></span>';
    }
    
    // Day numbers
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = day === today.getDate() && 
                        currentMonth === today.getMonth() && 
                        currentYear === today.getFullYear();
        const isSelected = selectedDate && 
                          day === selectedDate.getDate() &&
                          currentMonth === selectedDate.getMonth() &&
                          currentYear === selectedDate.getFullYear();
        
        const classes = [
            'compact-day',
            isToday ? 'today' : '',
            isSelected ? 'selected' : '',
            dayEvents.length > 0 ? 'has-events' : ''
        ].filter(Boolean).join(' ');
        
        html += `
            <span class="${classes}" 
                  data-date="${dateStr}"
                  onclick="selectCompactDate('${dateStr}')">
                ${day}
                ${dayEvents.length > 0 ? '<span class="event-dot"></span>' : ''}
            </span>
        `;
    }
    
    html += '</div></div>';
    
    // Agenda section
    html += renderAgendaSection();
    
    html += '</div>';
    
    grid.innerHTML = html;
}

function selectCompactDate(dateStr) {
    selectedDate = new Date(dateStr + 'T12:00:00');
    renderCalendar();
}

function renderAgendaSection() {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.date === dateStr)
                           .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    
    let html = '<div class="compact-agenda">';
    html += `<div class="agenda-header">${formattedDate}</div>`;
    html += '<div class="agenda-events">';
    
    if (dayEvents.length === 0) {
        html += '<div class="agenda-empty">No events</div>';
    } else {
        dayEvents.forEach(event => {
            html += `
                <div class="agenda-event" onclick="openEventDetail(${event.id})">
                    <div class="agenda-event-time">${event.time ? formatTime(event.time) : 'All day'}</div>
                    <div class="agenda-event-title">${escapeHtml(event.title)}</div>
                </div>
            `;
        });
    }
    
    html += '</div></div>';
    return html;
}
```

#### Task 2.3: Add Compact Month Styles

**File:** `style.css`

```css
/* ============================================
   COMPACT CALENDAR (500-800px)
   ============================================ */

.compact-calendar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e7e5e4;
}

/* Mini Month Grid */
.compact-month-grid {
    padding: 16px;
    border-bottom: 1px solid #e7e5e4;
}

.compact-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
}

.compact-weekday {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: #78716c;
    text-transform: uppercase;
}

.compact-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.compact-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
    color: #292524;
    cursor: pointer;
    border-radius: 50%;
    position: relative;
    transition: all 0.15s ease;
}

.compact-day:hover {
    background: #f5f5f4;
}

.compact-day.empty {
    visibility: hidden;
}

.compact-day.today {
    color: #6366f1;
    font-weight: 700;
}

.compact-day.selected {
    background: #6366f1;
    color: white;
}

.compact-day.selected.today {
    background: #6366f1;
    color: white;
}

.event-dot {
    position: absolute;
    bottom: 2px;
    width: 4px;
    height: 4px;
    background: #6366f1;
    border-radius: 50%;
}

.compact-day.selected .event-dot {
    background: white;
}

/* Agenda Section */
.compact-agenda {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.agenda-header {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #292524;
    background: #fafaf9;
    border-bottom: 1px solid #e7e5e4;
}

.agenda-events {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.agenda-empty {
    padding: 24px 16px;
    text-align: center;
    color: #78716c;
    font-size: 14px;
}

.agenda-event {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: #f5f5f4;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.agenda-event:hover {
    background: #eeeeed;
}

.agenda-event:last-child {
    margin-bottom: 0;
}

.agenda-event-time {
    font-size: 13px;
    font-weight: 500;
    color: #6366f1;
    min-width: 70px;
}

.agenda-event-title {
    font-size: 14px;
    font-weight: 500;
    color: #292524;
}
```

---

### Sprint 8.7.3: Ultra-Compact Week View

**Goal:** Horizontal week strip + day events.

#### Task 3.1: Create Ultra-Compact Renderer

**File:** `app.js`

```javascript
function renderUltraCompactView() {
    const grid = document.getElementById('calendarGrid');
    
    // Get the week containing selectedDate
    const weekStart = getWeekStart(selectedDate);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        weekDays.push(d);
    }
    
    const today = new Date();
    
    let html = '<div class="ultra-compact-calendar">';
    
    // Week strip
    html += '<div class="week-strip">';
    weekDays.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = day.toDateString() === today.toDateString();
        const isSelected = day.toDateString() === selectedDate.toDateString();
        
        const dayName = day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
        const dayNum = day.getDate();
        
        const classes = [
            'week-strip-day',
            isToday ? 'today' : '',
            isSelected ? 'selected' : '',
            dayEvents.length > 0 ? 'has-events' : ''
        ].filter(Boolean).join(' ');
        
        html += `
            <div class="${classes}" 
                 data-date="${dateStr}"
                 onclick="selectCompactDate('${dateStr}')">
                <span class="week-strip-name">${dayName}</span>
                <span class="week-strip-num">${dayNum}</span>
                ${dayEvents.length > 0 ? '<span class="week-dot"></span>' : ''}
            </div>
        `;
    });
    html += '</div>';
    
    // Navigation hint
    html += `
        <div class="week-nav-hint">
            <button class="week-nav-btn" onclick="navigateWeek(-1)">‹</button>
            <span>${selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            <button class="week-nav-btn" onclick="navigateWeek(1)">›</button>
        </div>
    `;
    
    // Day events
    html += renderAgendaSection();
    
    html += '</div>';
    
    grid.innerHTML = html;
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function navigateWeek(direction) {
    selectedDate.setDate(selectedDate.getDate() + (direction * 7));
    renderCalendar();
}
```

#### Task 3.2: Add Ultra-Compact Styles

**File:** `style.css`

```css
/* ============================================
   ULTRA-COMPACT CALENDAR (< 500px)
   ============================================ */

.ultra-compact-calendar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e7e5e4;
}

/* Week Strip */
.week-strip {
    display: flex;
    justify-content: space-around;
    padding: 12px 8px;
    background: #fafaf9;
    border-bottom: 1px solid #e7e5e4;
}

.week-strip-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    min-width: 40px;
    border-radius: 12px;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease;
}

.week-strip-day:hover {
    background: #f0f0f0;
}

.week-strip-day.selected {
    background: #6366f1;
}

.week-strip-day.today .week-strip-num {
    color: #6366f1;
    font-weight: 700;
}

.week-strip-day.selected .week-strip-name,
.week-strip-day.selected .week-strip-num {
    color: white;
}

.week-strip-name {
    font-size: 11px;
    font-weight: 500;
    color: #78716c;
    text-transform: uppercase;
    margin-bottom: 4px;
}

.week-strip-num {
    font-size: 16px;
    font-weight: 600;
    color: #292524;
}

.week-dot {
    position: absolute;
    bottom: 4px;
    width: 4px;
    height: 4px;
    background: #6366f1;
    border-radius: 50%;
}

.week-strip-day.selected .week-dot {
    background: white;
}

/* Week Navigation */
.week-nav-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #78716c;
    border-bottom: 1px solid #e7e5e4;
}

.week-nav-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: #78716c;
    cursor: pointer;
    padding: 4px 8px;
}

.week-nav-btn:hover {
    color: #6366f1;
}

/* Ultra-compact uses same agenda styles */
.ultra-compact-calendar .compact-agenda {
    flex: 1;
}
```

---

### Sprint 8.7.4: Integration & Polish

**Goal:** Wire everything together, handle edge cases.

#### Task 4.1: Update Header for Compact Modes

When in compact/ultra-compact, simplify the header:

```javascript
function updateHeaderForLayout() {
    const viewToggle = document.querySelector('.view-toggle');
    const monthYear = document.querySelector('.month-year');
    
    if (calendarLayoutMode === 'ultra-compact') {
        // Hide month/day toggle, show simpler nav
        viewToggle.style.display = 'none';
        monthYear.style.fontSize = '16px';
        monthYear.style.minWidth = 'auto';
    } else if (calendarLayoutMode === 'compact') {
        // Smaller toggle buttons
        viewToggle.style.display = 'flex';
        viewToggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.style.padding = '6px 12px';
            btn.style.fontSize = '12px';
        });
    } else {
        // Reset to defaults
        viewToggle.style.display = 'flex';
        viewToggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.style.padding = '';
            btn.style.fontSize = '';
        });
        monthYear.style.fontSize = '';
        monthYear.style.minWidth = '';
    }
}
```

#### Task 4.2: Handle Panel Transitions

Update chat toggle to trigger layout check:

**File:** `js/triage-ui.js` (or wherever ChatUI lives)

```javascript
toggle() {
    const panel = document.getElementById('chat-panel');
    const appMain = document.getElementById('app-main');
    
    if (panel.classList.contains('open')) {
        // Close
        panel.classList.remove('open');
        appMain.classList.remove('chat-open');
    } else {
        // Open
        panel.classList.add('open');
        appMain.classList.add('chat-open');
    }
    
    // Check layout after animation
    setTimeout(() => {
        if (typeof updateLayoutMode === 'function') {
            updateLayoutMode();
        }
    }, 350);
}
```

#### Task 4.3: Ensure Selected Date Syncs

When clicking events or navigating:

```javascript
// When opening event detail, update selectedDate
function openEventDetail(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        selectedDate = new Date(event.date + 'T12:00:00');
    }
    // ... rest of existing code
}

// When navigating months in full view, update selectedDate
function changeMonth(direction) {
    currentMonth += direction;
    // ... existing logic ...
    
    // Keep selectedDate in sync
    selectedDate = new Date(currentYear, currentMonth, 1);
    
    renderCalendar();
}
```

---

## Testing Checklist

### Layout Detection
- [ ] Full width → full layout (7-column grid)
- [ ] Open chat → compact layout (mini month + agenda)
- [ ] Open chat + profile → ultra-compact (week strip)
- [ ] Close panels → returns to appropriate layout
- [ ] Window resize triggers layout check

### Compact Month View
- [ ] Mini month shows all days correctly
- [ ] Dots appear under days with events
- [ ] Click day → agenda updates
- [ ] Selected day highlighted
- [ ] Today highlighted differently
- [ ] Agenda shows events sorted by time
- [ ] Click event → detail modal opens
- [ ] Month navigation works

### Ultra-Compact View
- [ ] Week strip shows 7 days
- [ ] Current day and selected day highlighted
- [ ] Dots under days with events
- [ ] Click day → agenda updates
- [ ] Week navigation (‹ ›) works
- [ ] Agenda shows correctly

### Edge Cases
- [ ] No events on selected day → "No events" message
- [ ] Many events → agenda scrolls
- [ ] Event without time → shows "All day"
- [ ] Layout persists through refresh
- [ ] Works on mobile viewport

---

## Success Criteria

- [ ] Calendar usable at any width
- [ ] Smooth transitions between layouts
- [ ] No content cut off or overlapping
- [ ] Event dots visible in compact views
- [ ] Agenda readable and tappable
- [ ] Works with both sidebars open simultaneously
- [ ] No console errors
- [ ] Feels native/iOS-like

---

## Files Modified

1. `app.js` - Layout detection, compact renderers
2. `style.css` - Compact and ultra-compact styles
3. `js/triage-ui.js` - Layout update trigger
4. `js/profile-ui.js` - Layout update trigger (if profile is a panel)

---

## Future Enhancements (Not in Scope)

- Swipe gestures for week navigation
- Pull-to-refresh
- Haptic feedback on mobile
- Smooth animated transitions between layouts
- Week view in full-width mode
- Custom accent colors
