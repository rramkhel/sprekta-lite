/**
 * Unified Calendar System
 * Single source of truth for Month/Week/Day views
 */

// ============================================
// STATE
// ============================================

let currentView = 'week'; // 'month' | 'week' | 'day'
let selectedDate = new Date();
let viewingMonth = new Date().getMonth();
let viewingYear = new Date().getFullYear();

// ============================================
// INITIALIZATION
// ============================================

export function initCalendar() {
  // Set up navigation
  document.getElementById('navPrev')?.addEventListener('click', () => navigate(-1));
  document.getElementById('navNext')?.addEventListener('click', () => navigate(1));

  // Set up view toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Set initial active button
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === currentView);
  });

  // Initial render
  render();
}

// ============================================
// NAVIGATION
// ============================================

function navigate(direction) {
  if (currentView === 'month') {
    viewingMonth += direction;
    if (viewingMonth > 11) { viewingMonth = 0; viewingYear++; }
    if (viewingMonth < 0) { viewingMonth = 11; viewingYear--; }
  } else if (currentView === 'week') {
    selectedDate.setDate(selectedDate.getDate() + (direction * 7));
    viewingMonth = selectedDate.getMonth();
    viewingYear = selectedDate.getFullYear();
  } else if (currentView === 'day') {
    selectedDate.setDate(selectedDate.getDate() + direction);
    viewingMonth = selectedDate.getMonth();
    viewingYear = selectedDate.getFullYear();
  }
  render();
}

function switchView(view) {
  currentView = view;

  // Update toggle buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  render();
}

// ============================================
// MAIN RENDER
// ============================================

function render() {
  updateTitle();

  const content = document.getElementById('calendarContent');
  const eventsList = document.getElementById('calendarEvents');

  if (!content) return;

  // Show/hide events panel
  if (eventsList) {
    eventsList.style.display = currentView === 'month' ? 'flex' : 'none';
  }

  switch (currentView) {
    case 'month':
      content.innerHTML = renderMonthGrid();
      renderEventsList();
      break;
    case 'week':
      content.innerHTML = renderWeekView();
      break;
    case 'day':
      content.innerHTML = renderDayView();
      break;
  }

  // Re-init icons
  if (window.lucide) lucide.createIcons();
}

function updateTitle() {
  const title = document.getElementById('calendarTitle');
  if (!title) return;

  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  if (currentView === 'month') {
    title.textContent = `${months[viewingMonth]} ${viewingYear}`;
  } else if (currentView === 'week') {
    const weekStart = getWeekStart(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (weekStart.getMonth() === weekEnd.getMonth()) {
      title.textContent = `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
    } else {
      title.textContent = `${months[weekStart.getMonth()].slice(0,3)} ${weekStart.getDate()} - ${months[weekEnd.getMonth()].slice(0,3)} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
    }
  } else if (currentView === 'day') {
    title.textContent = `${days[selectedDate.getDay()]}, ${months[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  }
}

// ============================================
// MONTH VIEW
// ============================================

function renderMonthGrid() {
  const firstDay = new Date(viewingYear, viewingMonth, 1).getDay();
  const daysInMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();
  const today = new Date();

  let html = '<div class="month-grid">';

  // Day headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div class="month-header">${d}</div>`;
  });

  // Empty cells
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="month-day empty"></div>';
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(viewingYear, viewingMonth, day);
    const dayEvents = getEventsForDate(dateStr);
    const isToday = day === today.getDate() &&
                    viewingMonth === today.getMonth() &&
                    viewingYear === today.getFullYear();
    const isSelected = day === selectedDate.getDate() &&
                       viewingMonth === selectedDate.getMonth() &&
                       viewingYear === selectedDate.getFullYear();

    const classes = ['month-day', isToday ? 'today' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ');

    html += `
      <div class="${classes}" data-date="${dateStr}" onclick="selectDate('${dateStr}')">
        <span class="day-number">${day}</span>
        ${dayEvents.length ? `<div class="event-dots">${dayEvents.slice(0,3).map(() => '<span class="dot"></span>').join('')}</div>` : ''}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function renderEventsList() {
  const container = document.getElementById('calendarEvents');
  if (!container) return;

  const dateStr = formatDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const dayEvents = getEventsForDate(dateStr).sort((a,b) => (a.time || '').localeCompare(b.time || ''));

  const dateLabel = formatDateLabel(selectedDate);

  let html = `<div class="events-header">${dateLabel}</div>`;
  html += '<div class="events-list">';

  if (dayEvents.length === 0) {
    html += '<div class="events-empty">No events</div>';
  } else {
    dayEvents.forEach(event => {
      html += `
        <div class="event-row" onclick="openEventDetail(${event.id})">
          <div class="event-time">${event.time ? formatTime(event.time) : 'All day'}</div>
          <div class="event-title">${escapeHtml(event.title)}</div>
        </div>
      `;
    });
  }

  html += '</div>';
  container.innerHTML = html;
}

// ============================================
// WEEK VIEW
// ============================================

function renderWeekView() {
  const weekStart = getWeekStart(selectedDate);
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  let html = '<div class="week-grid">';

  // Time column
  html += '<div class="week-times">';
  for (let h = 0; h < 24; h++) {
    html += `<div class="hour-label">${h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h-12) + ' PM'}</div>`;
  }
  html += '</div>';

  // Day columns
  days.forEach(day => {
    const dateStr = formatDate(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEvents = getEventsForDate(dateStr);
    const allDayEvents = dayEvents.filter(e => !e.time);
    const timedEvents = dayEvents.filter(e => e.time);
    const isToday = day.toDateString() === today.toDateString();

    html += `<div class="week-day ${isToday ? 'today' : ''}">`;
    html += `<div class="week-day-header" onclick="selectDate('${dateStr}'); switchView('day');">`;
    html += `<span class="week-day-name">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day.getDay()]}</span>`;
    html += `<span class="week-day-num">${day.getDate()}</span>`;
    html += '</div>';

    // All-day events section
    if (allDayEvents.length > 0) {
      html += '<div class="week-day-allday">';
      allDayEvents.forEach(event => {
        html += `
          <div class="week-allday-event" onclick="openEventDetail(${event.id})">
            ${escapeHtml(event.title)}
          </div>
        `;
      });
      html += '</div>';
    }

    html += '<div class="week-day-events">';

    // Hour slots
    for (let h = 0; h < 24; h++) {
      html += `<div class="hour-slot"></div>`;
    }

    // Timed events positioned absolutely
    timedEvents.forEach(event => {
      const [hours, mins] = event.time.split(':').map(Number);
      const top = hours * 40 + (mins / 60) * 40;
      const duration = event.endTime ? calculateDuration(event.time, event.endTime) : 60;
      const height = (duration / 60) * 40;

      html += `
        <div class="week-event" style="top:${top}px;height:${Math.max(height,20)}px" onclick="openEventDetail(${event.id})">
          ${escapeHtml(event.title)}
        </div>
      `;
    });

    html += '</div></div>';
  });

  html += '</div>';
  return html;
}

// ============================================
// DAY VIEW
// ============================================

function renderDayView() {
  const dateStr = formatDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const dayEvents = getEventsForDate(dateStr);
  const allDayEvents = dayEvents.filter(e => !e.time);
  const timedEvents = dayEvents.filter(e => e.time);

  let html = '<div class="day-grid">';

  // All-day events section (if any)
  if (allDayEvents.length > 0) {
    html += '<div class="day-allday-section">';
    html += '<div class="day-allday-label">All day</div>';
    html += '<div class="day-allday-events">';
    allDayEvents.forEach(event => {
      html += `
        <div class="day-allday-event" onclick="openEventDetail(${event.id})">
          ${escapeHtml(event.title)}
        </div>
      `;
    });
    html += '</div></div>';
  }

  // Time column
  html += '<div class="day-times">';
  for (let h = 0; h < 24; h++) {
    html += `<div class="hour-label">${h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h-12) + ' PM'}</div>`;
  }
  html += '</div>';

  // Events column
  html += '<div class="day-events-column">';

  // Hour slots
  for (let h = 0; h < 24; h++) {
    html += `<div class="hour-slot"></div>`;
  }

  // Timed events
  timedEvents.forEach(event => {
    const [hours, mins] = event.time.split(':').map(Number);
    const top = hours * 60 + mins;
    const duration = event.endTime ? calculateDuration(event.time, event.endTime) : 60;

    html += `
      <div class="day-event" style="top:${top}px;height:${Math.max(duration,30)}px" onclick="openEventDetail(${event.id})">
        <div class="day-event-time">${formatTime(event.time)}${event.endTime ? ' - ' + formatTime(event.endTime) : ''}</div>
        <div class="day-event-title">${escapeHtml(event.title)}</div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

// ============================================
// HELPERS
// ============================================

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateLabel(date) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const compare = new Date(date);
  compare.setHours(0,0,0,0);

  if (compare.getTime() === today.getTime()) return 'Today';

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (compare.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function calculateDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function getEventsForDate(dateStr) {
  return (window.events || []).filter(e => e.date === dateStr);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.selectDate = function(dateStr) {
  selectedDate = new Date(dateStr + 'T12:00:00');
  viewingMonth = selectedDate.getMonth();
  viewingYear = selectedDate.getFullYear();
  render();
};

window.switchView = switchView;
window.initCalendar = initCalendar;
window.renderCalendar = render;

export default { initCalendar };
