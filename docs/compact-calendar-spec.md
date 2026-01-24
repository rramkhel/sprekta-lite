# Compact Calendar View Specification

## Overview
When both chat and triage panels are open, the calendar switches to a compact iOS-style view optimized for narrow widths (typically 400-600px).

## Visual Design

### Layout Structure
```
┌─────────────────────────────────┐
│   MONTH NAVIGATION              │ ← Minimal nav bar
├─────────────────────────────────┤
│  S  M  T  W  T  F  S            │ ← Compact day headers
├─────────────────────────────────┤
│ 28 29 30 31  1  2  3            │
│  4  5  6  7  8  9 10            │ ← Smaller day cells
│ 11 12 13 14 15 16 17            │   with dot indicators
│ 18 19 20 21 22 23 24            │   (no event pills)
│ 25 26 27 28 29 30  1            │
├─────────────────────────────────┤
│ Today, Jan 24                   │ ← Selected day header
├─────────────────────────────────┤
│ 📅 9:00 AM - Team standup       │
│ 🍴 12:30 PM - Lunch with Dave   │ ← Scrollable event list
│ 💼 2:00 PM - Client meeting     │   for selected day
│ 🏋️ 6:00 PM - Gym                │
│                                 │
└─────────────────────────────────┘
```

## Design Details

### Compact Month Grid
- **Day cells**: 40×40px (vs. standard 100px+ height)
- **Font size**: 13px for day numbers
- **Event indicators**: Small colored dots below day number (max 3 visible)
- **No event pills**: Events shown only in list below
- **Hover state**: Subtle background change
- **Selected state**: Blue background with white text
- **Today indicator**: Blue ring around day number

### Event List (Bottom Section)
- **Header**: Shows selected date in natural language
  - "Today, Jan 24"
  - "Tomorrow, Jan 25"
  - "Monday, Jan 27"
- **Event rows**:
  - Icon (emoji or category indicator)
  - Time in compact format (9:00 AM, 2:30 PM)
  - Event title
  - 48px height per row
- **Empty state**: "No events scheduled" with gray text
- **Scrollable**: Independent scroll from month grid

### Month Navigation
- **Compact header**: Single row, 36px height
- **Month/Year**: Centered, 16px font
- **Nav arrows**: Smaller 24×24px buttons
- **View toggle**: Hidden in compact mode (always month view)

## HTML Structure

```html
<div class="calendar-view compact">
  <!-- Compact month navigation -->
  <div class="calendar-header-compact">
    <button class="nav-btn-compact" onclick="changeMonth(-1)">
      <i data-lucide="chevron-left"></i>
    </button>
    <div class="month-year-compact" id="monthYearCompact">January 2026</div>
    <button class="nav-btn-compact" onclick="changeMonth(1)">
      <i data-lucide="chevron-right"></i>
    </button>
  </div>

  <!-- Compact month grid -->
  <div class="calendar-grid-compact" id="calendarGridCompact">
    <!-- Day headers -->
    <div class="day-header-compact">S</div>
    <div class="day-header-compact">M</div>
    <!-- ... -->

    <!-- Day cells -->
    <div class="day-cell-compact today selected" data-date="2026-01-24" onclick="selectDay('2026-01-24')">
      <div class="day-number-compact">24</div>
      <div class="day-dots-compact">
        <span class="event-dot" style="background: #6366f1;"></span>
        <span class="event-dot" style="background: #ec4899;"></span>
        <span class="event-dot" style="background: #f59e0b;"></span>
      </div>
    </div>
    <!-- ... more days -->
  </div>

  <!-- Selected day events -->
  <div class="calendar-day-events" id="calendarDayEvents">
    <div class="day-events-header">
      <h3 id="selectedDayHeader">Today, Jan 24</h3>
    </div>
    <div class="day-events-list" id="dayEventsList">
      <!-- Event rows -->
      <div class="day-event-row" data-event-id="123" onclick="openEvent(123)">
        <span class="event-icon">📅</span>
        <div class="event-time-compact">9:00 AM</div>
        <div class="event-title-compact">Team standup</div>
      </div>
      <!-- More events... -->
    </div>
  </div>
</div>
```

## CSS Styles

### Compact Layout
```css
/* Trigger compact mode */
.calendar-view.compact {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Hide standard calendar */
.calendar-view.compact .calendar-header,
.calendar-view.compact .calendar-grid {
  display: none;
}

/* Compact header */
.calendar-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e5e5;
}

.month-year-compact {
  font-size: 16px;
  font-weight: 600;
  color: #292524;
}

.nav-btn-compact {
  width: 28px;
  height: 28px;
  border: none;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78716c;
}

.nav-btn-compact:hover {
  background: #f5f5f4;
}

/* Compact grid */
.calendar-grid-compact {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 8px;
  background: white;
}

.day-header-compact {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #78716c;
  padding: 6px 0;
  text-transform: uppercase;
}

.day-cell-compact {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease;
  padding: 4px;
}

.day-cell-compact:hover {
  background: #f5f5f4;
}

.day-cell-compact.today {
  background: #f5f3ff;
}

.day-cell-compact.selected {
  background: #6366f1;
}

.day-cell-compact.selected .day-number-compact {
  color: white;
  font-weight: 600;
}

.day-cell-compact.other-month {
  opacity: 0.4;
}

.day-number-compact {
  font-size: 13px;
  font-weight: 500;
  color: #292524;
}

.day-dots-compact {
  display: flex;
  gap: 2px;
  height: 6px;
}

.event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6366f1;
}

/* Day events section */
.calendar-day-events {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 2px solid #e5e5e5;
  overflow: hidden;
}

.day-events-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
}

.day-events-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #292524;
}

.day-events-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.day-event-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 150ms ease;
}

.day-event-row:hover {
  background: #fafafa;
  border-color: #d4d4d4;
  transform: translateX(2px);
}

.event-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.event-time-compact {
  font-size: 12px;
  color: #78716c;
  font-weight: 500;
  min-width: 60px;
}

.event-title-compact {
  flex: 1;
  font-size: 14px;
  color: #292524;
  font-weight: 500;
}

/* Empty state */
.day-events-empty {
  padding: 40px 16px;
  text-align: center;
  color: #a8a29e;
  font-size: 14px;
}
```

## JavaScript Behavior

### State Management
```javascript
let selectedDate = new Date(); // Currently selected day in compact view

// When compact mode activates
function enterCompactMode() {
  const calendarView = document.querySelector('.calendar-view');
  calendarView.classList.add('compact');

  // Select today by default
  selectedDate = new Date();
  renderCompactCalendar();
  renderDayEvents(selectedDate);
}

// When compact mode deactivates
function exitCompactMode() {
  const calendarView = document.querySelector('.calendar-view');
  calendarView.classList.remove('compact');

  // Re-render standard calendar
  renderCalendar();
}
```

### Day Selection
```javascript
function selectDay(dateStr) {
  selectedDate = new Date(dateStr);

  // Update selected state in grid
  document.querySelectorAll('.day-cell-compact').forEach(cell => {
    cell.classList.remove('selected');
  });
  document.querySelector(`[data-date="${dateStr}"]`)?.classList.add('selected');

  // Update events list
  renderDayEvents(selectedDate);
}
```

### Render Compact Grid
```javascript
function renderCompactCalendar() {
  const grid = document.getElementById('calendarGridCompact');
  const year = currentYear;
  const month = currentMonth;

  // Clear existing
  grid.innerHTML = '';

  // Day headers
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
    const header = document.createElement('div');
    header.className = 'day-header-compact';
    header.textContent = day;
    grid.appendChild(header);
  });

  // Generate month days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevMonthDays = new Date(year, month, 0).getDate();
  const startDay = firstDay.getDay();

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const cell = createCompactDayCell(year, month - 1, day, 'other-month');
    grid.appendChild(cell);
  }

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const cell = createCompactDayCell(year, month, day);
    grid.appendChild(cell);
  }

  // Next month days
  const remainingCells = 42 - grid.children.length + 7; // +7 for headers
  for (let day = 1; day <= remainingCells - 7; day++) {
    const cell = createCompactDayCell(year, month + 1, day, 'other-month');
    grid.appendChild(cell);
  }
}

function createCompactDayCell(year, month, day, extraClass = '') {
  const date = new Date(year, month, day);
  const dateStr = date.toISOString().split('T')[0];

  const cell = document.createElement('div');
  cell.className = `day-cell-compact ${extraClass}`;
  cell.dataset.date = dateStr;
  cell.onclick = () => selectDay(dateStr);

  // Check if today
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    cell.classList.add('today');
  }

  // Check if selected
  if (date.toDateString() === selectedDate.toDateString()) {
    cell.classList.add('selected');
  }

  // Day number
  const number = document.createElement('div');
  number.className = 'day-number-compact';
  number.textContent = day;
  cell.appendChild(number);

  // Event dots
  const events = getEventsForDate(dateStr);
  if (events.length > 0) {
    const dots = document.createElement('div');
    dots.className = 'day-dots-compact';

    // Show max 3 dots
    events.slice(0, 3).forEach(event => {
      const dot = document.createElement('span');
      dot.className = 'event-dot';
      dot.style.background = '#6366f1'; // Could use event color
      dots.appendChild(dot);
    });

    cell.appendChild(dots);
  }

  return cell;
}
```

### Render Day Events
```javascript
function renderDayEvents(date) {
  const header = document.getElementById('selectedDayHeader');
  const list = document.getElementById('dayEventsList');

  // Update header
  header.textContent = formatDayHeader(date);

  // Get events for date
  const dateStr = date.toISOString().split('T')[0];
  const events = getEventsForDate(dateStr);

  // Clear list
  list.innerHTML = '';

  if (events.length === 0) {
    // Empty state
    const empty = document.createElement('div');
    empty.className = 'day-events-empty';
    empty.textContent = 'No events scheduled';
    list.appendChild(empty);
    return;
  }

  // Sort by time
  events.sort((a, b) => {
    const timeA = a.start_time || '00:00';
    const timeB = b.start_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  // Render event rows
  events.forEach(event => {
    const row = document.createElement('div');
    row.className = 'day-event-row';
    row.dataset.eventId = event.id;
    row.onclick = () => openEventDetail(event.id);

    // Icon (could be based on category)
    const icon = document.createElement('span');
    icon.className = 'event-icon';
    icon.textContent = getEventIcon(event);
    row.appendChild(icon);

    // Time
    const time = document.createElement('div');
    time.className = 'event-time-compact';
    time.textContent = formatCompactTime(event.start_time);
    row.appendChild(time);

    // Title
    const title = document.createElement('div');
    title.className = 'event-title-compact';
    title.textContent = event.title;
    row.appendChild(title);

    list.appendChild(row);
  });
}

function formatDayHeader(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }
}

function formatCompactTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function getEventIcon(event) {
  // Could be based on event category/type
  // For now, return a default calendar icon
  return '📅';
}
```

## Integration with PanelManager

Update `panel-manager.js`:

```javascript
adaptCalendar(panelCount) {
  if (panelCount >= 2) {
    // Switch to compact mode
    if (window.enterCompactMode) {
      window.enterCompactMode();
    }
  } else {
    // Switch to standard mode
    if (window.exitCompactMode) {
      window.exitCompactMode();
    }
  }
}
```

## User Interactions

1. **Open both panels** → Calendar automatically switches to compact mode
2. **Click a day** → Events for that day appear in bottom list
3. **Click an event** → Opens event detail modal
4. **Navigate months** → Compact grid updates, selected day preserved if visible
5. **Close a panel** → Calendar switches back to standard mode

## Responsive Behavior

- **Width < 400px**: Further compress day cells (32×32px)
- **Width 400-600px**: Standard compact mode (40×40px cells)
- **Width > 600px**: Switch to standard calendar view

## Implementation Priority

### Phase 1 (MVP)
- ✅ Compact month grid with day numbers
- ✅ Day selection (click to select)
- ✅ Event dots indicator (simple colored dots)
- ✅ Day events list below
- ✅ Automatic mode switching

### Phase 2 (Polish)
- Event colors based on category
- Smooth transitions between modes
- Keyboard navigation (arrow keys to move between days)
- Swipe gestures for month navigation (mobile)

### Phase 3 (Advanced)
- Week numbers
- Multi-day event spans (visual indicators)
- Mini event previews on hover
- Quick add event from day click

## Testing Checklist

- [ ] Compact mode activates when both panels open
- [ ] Standard mode restores when panel closes
- [ ] Day selection works correctly
- [ ] Today is highlighted
- [ ] Selected day is highlighted differently
- [ ] Events load for selected day
- [ ] Event click opens detail modal
- [ ] Month navigation preserves selected day
- [ ] Event dots show correctly (max 3)
- [ ] Empty state shows when no events
- [ ] Scrolling works in event list
- [ ] Transitions are smooth

## Future Enhancements

- **Week view option** in compact mode
- **Agenda view** (chronological list without grid)
- **Event filtering** in compact mode
- **Drag to create** event from day cell
- **Color coding** by event type/category
