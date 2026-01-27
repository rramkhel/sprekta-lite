```
Sprint 8.7: Testing the Adaptive Compact Calendar

  The implementation is complete! Here's how to test all three layout modes:

  Test Scenarios

  | Test             | Steps                                              | Expected Result                           |
  |------------------|----------------------------------------------------|-------------------------------------------|
  | Full Width       | Close all panels (chat/triage), maximize window    | Standard 7-column month grid displays     |
  | Compact          | Open chat panel OR resize window to 500-800px wide | Mini month grid + agenda list appears     |
  | Ultra-Compact    | Open chat + triage OR resize to <500px             | Week strip + day events shown             |
  | Date Selection   | Click any date in compact view mini month          | Agenda updates to show that day's events  |
  | Event Click      | Click an event in the agenda list                  | Event detail modal opens                  |
  | Week Navigation  | Click ‹ › buttons in ultra-compact mode            | Week changes forward/backward             |
  | Month Navigation | Click ‹ › in compact mode header                   | Month changes, selected date updates      |
  | Resize           | Drag browser window to different widths            | Layout smoothly transitions between modes |

  What to Look For

  Full Mode (>800px):
  - Standard calendar grid with 7 columns
  - All existing features work normally

  Compact Mode (500-800px):
  - Mini month at top with single-letter day headers (S M T W T F S)
  - Small numbers for days with dots underneath if events exist
  - Selected day highlighted in blue
  - Agenda list below showing selected day's events
  - Events show time + title

  Ultra-Compact Mode (<500px):
  - Horizontal week strip at top
  - Single letter day names (S M T W T F S)
  - Today highlighted, selected day has blue background
  - Week navigation buttons (‹ ›)
  - Current month/year shown between nav buttons
  - Agenda list below for selected day

  Quick Visual Check

  Console Logs:
  When resizing or toggling panels, you should see:
  [Layout] Switching: full → compact
  [Layout] Switching: compact → ultra-compact

  CSS Classes:
  The .calendar-container should dynamically get:
  - .layout-full
  - .layout-compact
  - .layout-ultra-compact

  Testing Steps

  1. Open the app: http://localhost:3000
  2. Check full mode: Ensure all panels are closed
  3. Test compact: Open the chat panel (should trigger compact mode)
  4. Test ultra-compact: Also open triage panel OR resize window very narrow
  5. Test interactions: Click dates, events, navigation buttons
  6. Test resize: Slowly drag window width and watch transitions

  All the code has been added successfully:
  - ✅ Layout detection functions
  - ✅ Three rendering modes (full, compact, ultra-compact)
  - ✅ Complete CSS styling
  - ✅ Global function declarations
  - ✅ Resize listeners with debouncing

  The server is running without any errors related to the layout code. Some unrelated API errors appear in the logs
  (database schema, Anthropic credits), but those don't affect the calendar layout functionality we just implemented.
```


---


# Sprint 8.7 Instructions: Adaptive Compact Calendar

**Purpose:** Step-by-step implementation for iOS-style compact calendar views.

---

## Overview

The calendar needs to adapt to available width:

| Container Width | Layout Mode | What Renders |
|-----------------|-------------|--------------|
| > 800px | `full` | Standard 7-column month grid |
| 500-800px | `compact` | Mini month + agenda list |
| < 500px | `ultra-compact` | Week strip + day events |

---

## Task Order

1. Add layout state variables
2. Add layout detection function
3. Add debounce utility
4. Update renderCalendar() to branch
5. Move existing render to renderFullMonthView()
6. Add renderCompactMonthView()
7. Add renderUltraCompactView()
8. Add helper functions
9. Wire up triggers
10. Add all CSS
11. Test all scenarios

---

## Task 1: Add Layout State

**File:** `app.js`

**Find the state variables at top of file and add:**

```javascript
// Layout state (add with other state vars)
let calendarLayoutMode = 'full'; // 'full' | 'compact' | 'ultra-compact'
let selectedDate = new Date();
```

---

## Task 2: Add Layout Detection

**File:** `app.js`

**Add these functions (can go after state variables):**

```javascript
// ============================================
// LAYOUT DETECTION
// ============================================

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
        if (container) {
            container.classList.remove('layout-full', 'layout-compact', 'layout-ultra-compact');
            container.classList.add(`layout-${newMode}`);
        }
        
        // Update header visibility
        updateHeaderForLayout();
        
        renderCalendar();
    }
}

function updateHeaderForLayout() {
    const viewToggle = document.querySelector('.view-toggle');
    const clearBtn = document.querySelector('.clear-btn');
    
    if (!viewToggle) return;
    
    if (calendarLayoutMode === 'ultra-compact') {
        viewToggle.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
    } else if (calendarLayoutMode === 'compact') {
        viewToggle.style.display = 'flex';
        if (clearBtn) clearBtn.style.display = 'none';
    } else {
        viewToggle.style.display = 'flex';
        if (clearBtn) clearBtn.style.display = 'flex';
    }
}

// Debounce utility
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

---

## Task 3: Update renderCalendar() to Branch

**File:** `app.js`

**Find `renderCalendar()` and replace it with:**

```javascript
function renderCalendar() {
    // Handle day view
    if (currentView === 'day' && calendarLayoutMode === 'full') {
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
    
    lucide.createIcons();
}
```

---

## Task 4: Rename Existing Month Render

**File:** `app.js`

**Find the OLD renderCalendar() code (the one that builds the month grid) and rename the function to `renderFullMonthView()`.**

The function should start with something like:
```javascript
function renderFullMonthView() {
    const grid = document.getElementById('calendarGrid');
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // ... rest of existing month grid code
```

**Important:** Keep all the existing month grid logic exactly as-is, just change the function name.

---

## Task 5: Add Compact Month View

**File:** `app.js`

**Add this function:**

```javascript
// ============================================
// COMPACT MONTH VIEW
// ============================================

function renderCompactMonthView() {
    const grid = document.getElementById('calendarGrid');
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    let html = '<div class="compact-calendar">';
    
    // Mini month grid
    html += '<div class="compact-month-grid">';
    html += '<div class="compact-weekdays">';
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => {
        html += `<span class="compact-weekday">${d}</span>`;
    });
    html += '</div>';
    
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

// Helper if not already present
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

## Task 6: Add Ultra-Compact View

**File:** `app.js`

**Add this function:**

```javascript
// ============================================
// ULTRA-COMPACT VIEW (Week Strip)
// ============================================

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
        const dateStr = formatDateForStorage(day);
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
    
    // Day events (reuse agenda)
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

function formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

---

## Task 7: Wire Up Layout Triggers

**File:** `app.js`

**In the DOMContentLoaded event (or init section), add:**

```javascript
// Initial layout detection
updateLayoutMode();

// Resize listener
window.addEventListener('resize', debounce(updateLayoutMode, 100));
```

**Also update changeMonth() to keep selectedDate in sync:**

Find the `changeMonth()` function and add at the end (before renderCalendar()):

```javascript
// Keep selectedDate in sync with current month
if (currentView === 'month') {
    // If selectedDate is not in current month, reset to 1st of month
    if (selectedDate.getMonth() !== currentMonth || selectedDate.getFullYear() !== currentYear) {
        selectedDate = new Date(currentYear, currentMonth, 1);
    }
}
```

---

## Task 8: Update Chat Panel Toggle

**File:** `js/triage-ui.js` (or wherever ChatUI.toggle lives)

**Find the toggle function and add layout update after animation:**

```javascript
// At end of toggle function, after classList changes:
setTimeout(() => {
    if (typeof updateLayoutMode === 'function') {
        updateLayoutMode();
    }
}, 350); // After CSS transition completes
```

---

## Task 9: Add All CSS

**File:** `style.css`

**Add at the end of the file:**

```css
/* ============================================
   COMPACT CALENDAR VIEWS (Milestone 8.7)
   ============================================ */

/* Hide regular grid in compact modes */
.layout-compact .calendar-grid,
.layout-ultra-compact .calendar-grid {
    display: block; /* Override grid display */
}

/* ----------------------------------------
   COMPACT MODE (500-800px)
   ---------------------------------------- */

.compact-calendar {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 140px);
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e7e5e4;
}

/* Mini Month Grid */
.compact-month-grid {
    padding: 16px;
    border-bottom: 1px solid #e7e5e4;
    flex-shrink: 0;
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
    gap: 2px;
}

.compact-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 13px;
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
    min-height: 0;
}

.agenda-header {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #292524;
    background: #fafaf9;
    border-bottom: 1px solid #e7e5e4;
    flex-shrink: 0;
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
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    min-width: 65px;
    flex-shrink: 0;
}

.agenda-event-title {
    font-size: 14px;
    font-weight: 500;
    color: #292524;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ----------------------------------------
   ULTRA-COMPACT MODE (< 500px)
   ---------------------------------------- */

.ultra-compact-calendar {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 140px);
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e7e5e4;
}

/* Week Strip */
.week-strip {
    display: flex;
    justify-content: space-around;
    padding: 12px 4px;
    background: #fafaf9;
    border-bottom: 1px solid #e7e5e4;
    flex-shrink: 0;
}

.week-strip-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 6px;
    min-width: 36px;
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

.week-strip-day.selected.today .week-strip-num {
    color: white;
}

.week-strip-name {
    font-size: 10px;
    font-weight: 500;
    color: #78716c;
    text-transform: uppercase;
    margin-bottom: 4px;
}

.week-strip-num {
    font-size: 15px;
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
    flex-shrink: 0;
}

.week-nav-btn {
    background: none;
    border: none;
    font-size: 20px;
    color: #78716c;
    cursor: pointer;
    padding: 4px 12px;
    border-radius: 6px;
    transition: all 0.15s ease;
}

.week-nav-btn:hover {
    color: #6366f1;
    background: #f5f5f4;
}

/* Ultra-compact uses same agenda styles */
.ultra-compact-calendar .compact-agenda {
    flex: 1;
}

/* ----------------------------------------
   HEADER ADJUSTMENTS FOR COMPACT
   ---------------------------------------- */

.layout-compact .calendar-header,
.layout-ultra-compact .calendar-header {
    flex-wrap: wrap;
    gap: 12px;
}

.layout-compact .header-actions,
.layout-ultra-compact .header-actions {
    gap: 8px;
}

.layout-ultra-compact .month-year {
    font-size: 16px;
    min-width: auto;
}

.layout-ultra-compact .calendar-nav {
    gap: 8px;
}

.layout-ultra-compact .nav-btn {
    width: 28px;
    height: 28px;
}
```

---

## Task 10: Make updateLayoutMode Global

**File:** `app.js`

If `updateLayoutMode` is not already accessible globally, add at the end of the file or in the window assignments:

```javascript
// Make layout functions globally accessible
window.updateLayoutMode = updateLayoutMode;
window.selectCompactDate = selectCompactDate;
window.navigateWeek = navigateWeek;
```

---

## Testing

After implementation, test these scenarios:

| Test | Steps | Expected |
|------|-------|----------|
| Full width | Close all panels | 7-column grid shows |
| Compact | Open chat panel | Mini month + agenda shows |
| Ultra-compact | Open chat + resize window narrow | Week strip + agenda shows |
| Date selection | Click date in compact view | Agenda updates |
| Event click | Click event in agenda | Detail modal opens |
| Week nav | Click ‹ › in ultra-compact | Week changes |
| Month nav | Click ‹ › in compact | Month changes, date stays selected |
| Resize | Drag browser window | Layout switches smoothly |

---

## Common Issues

**Layout doesn't switch:**
- Check that `updateLayoutMode()` is being called
- Verify `app-main` container exists
- Check console for errors

**Agenda doesn't show events:**
- Verify `events` array has correct date format (YYYY-MM-DD)
- Check `selectedDate` is valid

**Styles not applying:**
- Verify `.layout-compact` / `.layout-ultra-compact` classes are on `.calendar-container`
- Check CSS is loaded after existing styles

---

## Done!

Once all tests pass:
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Test on Vercel deployment
- [ ] Test with chat + profile both open
