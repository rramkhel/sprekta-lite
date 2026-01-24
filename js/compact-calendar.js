/**
 * Compact Calendar (iOS-style)
 *
 * Handles the compact calendar view with day selection and event list.
 */

let selectedDate = new Date();
let currentCompactView = 'month'; // 'month' or 'week'
let currentWeekStart = null; // Track current week start date

// Enter compact mode
export function enterCompactMode() {
  const calendarView = document.querySelector('.calendar-view');
  if (!calendarView) return;

  calendarView.classList.add('compact');

  // Ensure currentYear and currentMonth are set
  if (!window.currentYear || window.currentMonth === undefined) {
    const now = new Date();
    window.currentYear = now.getFullYear();
    window.currentMonth = now.getMonth();
  }

  // Select today by default
  selectedDate = new Date();

  // Reset to month view when entering compact mode
  currentCompactView = 'month';
  calendarView.classList.remove('week-mode');

  renderCompactCalendar();
  renderDayEvents(selectedDate);

  // Re-initialize Lucide icons for new compact elements
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Exit compact mode
export function exitCompactMode() {
  const calendarView = document.querySelector('.calendar-view');
  if (!calendarView) return;

  calendarView.classList.remove('compact');

  // Re-render standard calendar
  if (window.renderCalendar) {
    window.renderCalendar();
  }
}

// Change month/week in compact mode
window.changeMonthCompact = function(direction) {
  if (currentCompactView === 'week') {
    // Navigate by week
    changeWeek(direction);
  } else {
    // Navigate by month
    if (!window.currentYear || !window.currentMonth === undefined) return;

    window.currentMonth += direction;
    if (window.currentMonth > 11) {
      window.currentMonth = 0;
      window.currentYear++;
    } else if (window.currentMonth < 0) {
      window.currentMonth = 11;
      window.currentYear--;
    }

    renderCompactCalendar();
  }
};

// Select a day
window.selectDay = function(dateStr) {
  selectedDate = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues

  // Update selected state in grid
  document.querySelectorAll('.day-cell-compact').forEach(cell => {
    cell.classList.remove('selected');
  });
  const selectedCell = document.querySelector(`[data-date="${dateStr}"]`);
  if (selectedCell) {
    selectedCell.classList.add('selected');
  }

  // Update events list
  renderDayEvents(selectedDate);
};

// Render compact calendar grid
function renderCompactCalendar() {
  const grid = document.getElementById('calendarGridCompact');
  const header = document.getElementById('monthYearCompact');
  if (!grid || !header) return;

  const year = window.currentYear;
  const month = window.currentMonth;

  // Update header
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  header.textContent = `${monthNames[month]} ${year}`;

  // Clear existing
  grid.innerHTML = '';

  // Day headers
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
    const headerEl = document.createElement('div');
    headerEl.className = 'day-header-compact';
    headerEl.textContent = day;
    grid.appendChild(headerEl);
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
  const totalCells = startDay + lastDay.getDate();
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let day = 1; day <= remainingCells; day++) {
    const cell = createCompactDayCell(year, month + 1, day, 'other-month');
    grid.appendChild(cell);
  }
}

// Create a compact day cell
function createCompactDayCell(year, month, day, extraClass = '') {
  const date = new Date(year, month, day);
  const dateStr = date.toISOString().split('T')[0];

  const cell = document.createElement('div');
  cell.className = `day-cell-compact ${extraClass}`;
  cell.dataset.date = dateStr;
  cell.onclick = () => window.selectDay(dateStr);

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

// Get events for a specific date
function getEventsForDate(dateStr) {
  if (!window.events) return [];
  return window.events.filter(event => event.date === dateStr);
}

// Render day events list
function renderDayEvents(date) {
  const header = document.getElementById('selectedDayHeader');
  const list = document.getElementById('dayEventsList');
  if (!header || !list) return;

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
    row.onclick = () => {
      if (window.openEventDetail) {
        window.openEventDetail(event.id);
      }
    };

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

// Format day header with natural language
function formatDayHeader(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (compareDate.getTime() === today.getTime()) {
    return 'Today, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (compareDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }
}

// Format time for compact display
function formatCompactTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// Get icon for event (placeholder)
function getEventIcon(event) {
  // Could be based on event category/type in the future
  return '📅';
}

// Switch between month and week views
window.switchCompactView = function(viewType) {
  currentCompactView = viewType;

  const calendarView = document.querySelector('.calendar-view');
  const monthBtn = document.getElementById('compactMonthBtn');
  const weekBtn = document.getElementById('compactWeekBtn');

  if (viewType === 'week') {
    calendarView?.classList.add('week-mode');
    monthBtn?.classList.remove('active');
    weekBtn?.classList.add('active');

    // Initialize week start to current week
    if (!currentWeekStart) {
      currentWeekStart = getWeekStart(new Date());
    }

    renderWeekView();
  } else {
    // Month view
    calendarView?.classList.remove('week-mode');
    weekBtn?.classList.remove('active');
    monthBtn?.classList.add('active');

    // Re-render the compact month calendar
    renderCompactCalendar();
    renderDayEvents(selectedDate);
  }
};

// Get the start of the week (Sunday) for a given date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Navigate week view
window.changeWeek = function(direction) {
  if (!currentWeekStart) {
    currentWeekStart = getWeekStart(new Date());
  }

  currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
  renderWeekView();
};

// Render week view
function renderWeekView() {
  updateWeekHeader();
  renderWeekTimes();
  renderWeekDays();

  // Re-initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Update week view header with date range
function updateWeekHeader() {
  const header = document.getElementById('monthYearCompact');
  if (!header || !currentWeekStart) return;

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Format: "Jan 14 - 20, 2024" or "Jan 28 - Feb 3, 2024"
  const startMonth = monthNames[currentWeekStart.getMonth()];
  const endMonth = monthNames[weekEnd.getMonth()];
  const year = currentWeekStart.getFullYear();

  let dateRange;
  if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
    // Same month
    dateRange = `${startMonth} ${currentWeekStart.getDate()} - ${weekEnd.getDate()}, ${year}`;
  } else {
    // Different months
    dateRange = `${startMonth} ${currentWeekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${year}`;
  }

  header.textContent = dateRange;
}

// Render time labels (24 hours)
function renderWeekTimes() {
  const container = document.getElementById('weekViewTimes');
  if (!container) return;

  container.innerHTML = '';

  // Create 24 hour labels
  for (let hour = 0; hour < 24; hour++) {
    const label = document.createElement('div');
    label.className = 'week-time-label';

    // Format hour (12 AM, 1 AM, etc.)
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    label.textContent = `${h12} ${ampm}`;

    container.appendChild(label);
  }
}

// Render week days grid
function renderWeekDays() {
  const container = document.getElementById('weekViewDays');
  if (!container) return;

  if (!currentWeekStart) {
    currentWeekStart = getWeekStart(new Date());
  }

  container.innerHTML = '';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create 7 day columns
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(currentWeekStart);
    dayDate.setDate(dayDate.getDate() + i);

    const column = document.createElement('div');
    column.className = 'week-day-column';

    // Day header
    const header = document.createElement('div');
    header.className = 'week-day-header';

    const dayName = document.createElement('div');
    dayName.style.fontSize = '10px';
    dayName.style.fontWeight = '600';
    dayName.style.color = '#78716c';
    dayName.textContent = dayNames[i];

    const dayNum = document.createElement('div');
    dayNum.style.fontSize = '14px';
    dayNum.style.fontWeight = '600';
    dayNum.style.marginTop = '2px';

    // Check if today
    const today = new Date();
    if (dayDate.toDateString() === today.toDateString()) {
      dayNum.style.color = '#ea580c';
      dayNum.style.background = '#fed7aa';
      dayNum.style.borderRadius = '50%';
      dayNum.style.width = '24px';
      dayNum.style.height = '24px';
      dayNum.style.display = 'flex';
      dayNum.style.alignItems = 'center';
      dayNum.style.justifyContent = 'center';
    } else {
      dayNum.style.color = '#292524';
    }

    dayNum.textContent = dayDate.getDate();

    header.appendChild(dayName);
    header.appendChild(dayNum);
    column.appendChild(header);

    // Hour slots container
    const slotsContainer = document.createElement('div');
    slotsContainer.style.position = 'relative';

    // Create 24 hour slots
    for (let hour = 0; hour < 24; hour++) {
      const slot = document.createElement('div');
      slot.className = 'week-hour-slot';
      slot.dataset.hour = hour;
      slotsContainer.appendChild(slot);
    }

    // Add events for this day
    const dateStr = dayDate.toISOString().split('T')[0];
    const events = getEventsForDate(dateStr);

    events.forEach(event => {
      const eventBlock = createWeekEventBlock(event);
      if (eventBlock) {
        slotsContainer.appendChild(eventBlock);
      }
    });

    column.appendChild(slotsContainer);
    container.appendChild(column);
  }
}

// Create event block for week view
function createWeekEventBlock(event) {
  if (!event.start_time) return null;

  const block = document.createElement('div');
  block.className = 'week-event-block';
  block.dataset.eventId = event.id;
  block.textContent = event.title;

  // Calculate position based on time
  const [hours, minutes] = event.start_time.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;

  // Calculate duration (default 1 hour if no end time)
  let durationMinutes = 60;
  if (event.end_time) {
    const [endHours, endMinutes] = event.end_time.split(':').map(Number);
    const endTotalMinutes = endHours * 60 + endMinutes;
    durationMinutes = endTotalMinutes - startMinutes;
  }

  // Position: 40px per hour
  const topPosition = (startMinutes / 60) * 40;
  const height = (durationMinutes / 60) * 40;

  block.style.top = `${topPosition}px`;
  block.style.height = `${Math.max(height, 20)}px`; // Minimum 20px height

  // Click to open detail
  block.onclick = () => {
    if (window.openEventDetail) {
      window.openEventDetail(event.id);
    }
  };

  return block;
}

// Make functions available globally
window.enterCompactMode = enterCompactMode;
window.exitCompactMode = exitCompactMode;

export default {
  enterCompactMode,
  exitCompactMode
};
