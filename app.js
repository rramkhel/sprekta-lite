// ============================================
// STATE
// ============================================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentDay = new Date().getDate();
let events = [];
let draggedEventId = null;
let isDragging = false;
let currentView = 'month'; // 'month' or 'day'

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();
    renderCalendar();
    lucide.createIcons();

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
});

// ============================================
// CALENDAR RENDERING
// ============================================

function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    let html = '';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="day-header">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="day-cell other-month"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === date);
        const todayCheck = isTodayDate(day);

        html += `
            <div class="day-cell ${todayCheck ? 'today' : ''}"
                 ondragover="handleDragOver(event)"
                 ondragleave="handleDragLeave(event)"
                 ondrop="handleDrop(event, '${date}')">
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${dayEvents.map(event => `
                        <div class="event-pill"
                             draggable="true"
                             ondragstart="handleDragStart(event, ${event.id})"
                             ondragend="handleDragEnd(event)"
                             onclick="openEventDetail(${event.id})">
                            ${event.title}
                            ${event.time ? ` ${formatTime(event.time)}` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    document.getElementById('calendarGrid').innerHTML = html;
    lucide.createIcons();
}

function isTodayDate(day) {
    const today = new Date();
    return day === today.getDate() &&
           currentMonth === today.getMonth() &&
           currentYear === today.getFullYear();
}

function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function changeMonth(direction) {
    if (currentView === 'month') {
        // Navigate months
        currentMonth += direction;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    } else {
        // Navigate days
        currentDay += direction;

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        if (currentDay > daysInMonth) {
            currentDay = 1;
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        if (currentDay < 1) {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            currentDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        }

        renderDayView();
    }
}

// ============================================
// VIEW SWITCHING
// ============================================

function switchView(view) {
    currentView = view;

    // Update button states
    document.getElementById('monthViewBtn').classList.toggle('active', view === 'month');
    document.getElementById('dayViewBtn').classList.toggle('active', view === 'day');

    // Show/hide appropriate grid
    if (view === 'month') {
        document.getElementById('calendarGrid').style.display = 'grid';
        document.getElementById('dayViewGrid').style.display = 'none';
        renderCalendar();
    } else {
        document.getElementById('calendarGrid').style.display = 'none';
        document.getElementById('dayViewGrid').style.display = 'block';
        renderDayView();
    }

    lucide.createIcons();
}

// ============================================
// DAY VIEW RENDERING
// ============================================

function renderDayView() {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === date);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = new Date(currentYear, currentMonth, currentDay).getDay();

    document.getElementById('monthYear').textContent =
        `${dayNames[dayOfWeek]}, ${monthNames[currentMonth]} ${currentDay}, ${currentYear}`;

    let html = '<div class="day-view-container">';

    // Time labels column
    html += '<div class="day-view-times">';
    for (let hour = 6; hour < 22; hour++) {
        const displayHour = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        html += `<div class="time-slot-label">${displayHour}:00 ${ampm}</div>`;
    }
    html += '</div>';

    // Events column
    html += '<div class="day-view-events">';

    // Time slots (for clicking to create events)
    for (let hour = 6; hour < 22; hour++) {
        html += `<div class="time-slot" data-hour="${hour}"></div>`;
    }

    // Render events as positioned blocks
    dayEvents.forEach(event => {
        const startHour = event.time ? parseInt(event.time.split(':')[0]) : 9;
        const startMinute = event.time ? parseInt(event.time.split(':')[1]) : 0;
        const endHour = event.endTime ? parseInt(event.endTime.split(':')[0]) : startHour + 1;
        const endMinute = event.endTime ? parseInt(event.endTime.split(':')[1]) : startMinute;

        // Calculate position and height
        const topPosition = ((startHour - 6) * 60) + (startMinute / 60 * 60);
        const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        const height = (durationMinutes / 60) * 60;

        const endTimeFormatted = event.endTime ? formatTime(event.endTime) : '';

        html += `
            <div class="day-event-block"
                 style="top: ${topPosition}px; height: ${height}px;"
                 onclick="openEventDetail(${event.id})"
                 data-event-id="${event.id}">
                <div class="day-event-title">${event.title}</div>
                <div class="day-event-time">${formatTime(event.time)}${endTimeFormatted ? ' - ' + endTimeFormatted : ''}</div>
                <div class="resize-handle"
                     onmousedown="startResize(event, ${event.id})"
                     onclick="event.stopPropagation()"></div>
            </div>
        `;
    });

    html += '</div></div>';

    document.getElementById('dayViewGrid').innerHTML = html;
    lucide.createIcons();
}

// ============================================
// EVENT RESIZE (DAY VIEW)
// ============================================

let resizingEventId = null;
let resizeStartY = 0;
let resizeStartHeight = 0;

function startResize(e, eventId) {
    e.preventDefault();
    e.stopPropagation();

    resizingEventId = eventId;
    resizeStartY = e.clientY;

    const eventBlock = e.target.closest('.day-event-block');
    resizeStartHeight = eventBlock.offsetHeight;

    // Add event listeners
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    eventBlock.classList.add('resizing');
}

function handleResize(e) {
    if (!resizingEventId) return;

    const eventBlock = document.querySelector(`[data-event-id="${resizingEventId}"]`);
    if (!eventBlock) return;

    const deltaY = e.clientY - resizeStartY;
    const newHeight = Math.max(30, resizeStartHeight + deltaY); // Min 30px (30 minutes)

    eventBlock.style.height = `${newHeight}px`;
}

async function stopResize(e) {
    if (!resizingEventId) return;

    const eventBlock = document.querySelector(`[data-event-id="${resizingEventId}"]`);
    if (eventBlock) {
        eventBlock.classList.remove('resizing');

        // Calculate new end time based on height
        const height = eventBlock.offsetHeight;
        const durationMinutes = Math.round((height / 60) * 60); // Convert px to minutes

        const event = events.find(ev => ev.id === resizingEventId);
        if (event && event.time) {
            const [startHour, startMinute] = event.time.split(':').map(Number);
            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = startTotalMinutes + durationMinutes;

            const endHour = Math.floor(endTotalMinutes / 60);
            const endMinute = endTotalMinutes % 60;
            const newEndTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

            // Update event
            event.endTime = newEndTime;

            // Save to Supabase
            try {
                const response = await fetch('/api/events', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });

                if (!response.ok) {
                    console.warn('Failed to save to Supabase, using localStorage only');
                } else {
                    console.log('[Storage] Event duration updated in Supabase');
                }
            } catch (error) {
                console.error('[Storage] Supabase error:', error);
            }

            // Save to localStorage
            localStorage.setItem('events', JSON.stringify(events));

            // Log to dev panel
            if (window.devPanelModule) {
                window.devPanelModule.logAction(`Resized "${event.title}" to ${formatTime(event.time)} - ${formatTime(newEndTime)}`);
            }

            // Show feedback
            showToast('Event duration updated');

            // Re-render
            renderDayView();
        }
    }

    // Clean up
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    resizingEventId = null;
    resizeStartY = 0;
    resizeStartHeight = 0;
}

// ============================================
// DRAG AND DROP HANDLERS
// ============================================

function handleDragStart(e, eventId) {
    draggedEventId = eventId;
    isDragging = true;
    e.target.classList.add('dragging');

    // Set drag data (for good browser compatibility)
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);

    // Log to dev panel
    if (window.devPanelModule) {
        const event = events.find(ev => ev.id === eventId);
        window.devPanelModule.logAction(`Started dragging: "${event?.title}"`);
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedEventId = null;

    // Remove all drag-over highlights
    document.querySelectorAll('.day-cell').forEach(cell => {
        cell.classList.remove('drag-over');
    });

    // Reset isDragging after a small delay to prevent click from firing
    setTimeout(() => {
        isDragging = false;
    }, 100);
}

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow drop
    e.dataTransfer.dropEffect = 'move';

    // Add visual feedback
    const dayCell = e.currentTarget;
    if (!dayCell.classList.contains('drag-over')) {
        dayCell.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    // Only remove if we're leaving the day-cell itself
    const dayCell = e.currentTarget;
    if (!dayCell.contains(e.relatedTarget)) {
        dayCell.classList.remove('drag-over');
    }
}

async function handleDrop(e, targetDate) {
    e.preventDefault();
    e.stopPropagation();

    const dayCell = e.currentTarget;
    dayCell.classList.remove('drag-over');

    if (!draggedEventId) return;

    // Find the event being dragged
    const eventIndex = events.findIndex(ev => ev.id === draggedEventId);
    if (eventIndex === -1) {
        console.error('Dragged event not found:', draggedEventId);
        return;
    }

    const event = events[eventIndex];
    const oldDate = event.date;

    // Don't do anything if dropping on same date
    if (oldDate === targetDate) {
        console.log('[Drag] Dropped on same date, no change needed');
        return;
    }

    // Update the event's date
    const updatedEvent = {
        ...event,
        date: targetDate
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

    // Log to dev panel
    if (window.devPanelModule) {
        window.devPanelModule.logAction(`Moved "${event.title}" from ${oldDate} to ${targetDate}`);
    }

    // Show feedback
    showToast('Event moved');

    // Re-render calendar
    renderCalendar();
}

async function clearCalendar() {
    if (confirm('Clear all events?')) {
        // Delete from Supabase
        try {
            for (const event of events) {
                await fetch('/api/events', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: event.id })
                });
            }
            console.log('[Storage] Deleted all events from Supabase');
        } catch (error) {
            console.error('[Storage] Failed to delete from Supabase:', error);
        }

        events = [];
        localStorage.setItem('events', JSON.stringify(events));
        renderCalendar();
    }
}

// ============================================
// QUICK CAPTURE
// ============================================

function openQuickCapture() {
    document.getElementById('quickCaptureModal').classList.add('open');
    document.getElementById('quick-capture-input').focus();
}

function closeQuickCapture() {
    document.getElementById('quickCaptureModal').classList.remove('open');
    document.getElementById('quick-capture-input').value = '';
}

async function submitQuickCapture() {
    const input = document.getElementById('quick-capture-input');
    const text = input.value.trim();

    if (!text) return;

    try {
        // Call real AI endpoint
        const response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('Parse failed');

        const parsed = await response.json();
        console.log('AI Response:', parsed);

        // Log to dev panel if available
        if (window.devPanelModule) {
            window.devPanelModule.logAction(`Quick capture: "${text}"`);
            window.devPanelModule.updateResponseInspector(parsed);
        }

        // Add events from AI response
        await processQuickCaptureResponse(text, parsed);

        closeQuickCapture();
        alert('✓ Added to calendar');

    } catch (error) {
        console.error('Error:', error);
        if (window.devPanelModule) {
            window.devPanelModule.logAction(`Error: ${error.message}`);
        }
        alert('Failed to process. Check console.');
    }
}

async function processQuickCaptureResponse(originalText, response) {
    console.log('[Process Response] Original text:', originalText);
    console.log('[Process Response] Full response:', response);

    // Handle the actual API format: { items: [...] }
    if (response.items && response.items.length > 0) {
        console.log('[Process Response] Found', response.items.length, 'items');

        // Filter only items that are events (have event data)
        const eventItems = response.items.filter(item => item.category === 'event' && item.event);
        console.log('[Process Response] Found', eventItems.length, 'event items');

        eventItems.forEach((item, index) => {
            const eventData = item.event;
            const startTime = eventData.time || '09:00';
            const newEvent = {
                id: Date.now() + index,
                title: eventData.title,
                date: eventData.date,
                time: startTime,
                endTime: getDefaultEndTime(startTime),
                raw: originalText,
                aiResponse: item // store full AI response for debugging
            };

            console.log('[Process Response] Creating event:', newEvent);
            events.push(newEvent);
        });

        if (eventItems.length > 0) {
            await saveEvents();
            console.log('[Process Response] Events saved to localStorage:', events);
            renderCalendar();
            console.log('[Process Response] Calendar re-rendered');
        } else {
            console.warn('[Process Response] No event items found. Items were:', response.items);
            alert('No events found. AI parsed as tasks/notes instead.');
        }
    } else {
        console.warn('[Process Response] No items in response!', response);
        alert('AI returned no items.');
    }
}

// ============================================
// EVENT DETAIL MODAL
// ============================================

let currentEventId = null;

function openEventDetail(eventId) {
    // Prevent opening modal if we just finished dragging
    if (isDragging) {
        console.log('[Event] Ignoring click - drag in progress');
        return;
    }

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

    // Restore delete button visibility (in case it was hidden for new event creation)
    document.getElementById('deleteEventBtn').style.display = 'block';

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

function getDefaultEndTime(startTime) {
    if (!startTime) return null;
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + 1; // Default 1 hour duration
    return `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
    // If we're creating a new event (no currentEventId), just close the modal
    if (!currentEventId) {
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

    // Restore delete button visibility (in case it was hidden for new event creation)
    document.getElementById('deleteEventBtn').style.display = 'block';

    if (window.devPanelModule) {
        window.devPanelModule.logAction('Cancelled edit');
    }
}

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

    // CREATE NEW EVENT
    if (!currentEventId) {
        const newEvent = {
            id: Date.now(),
            title,
            date,
            time,
            endTime: getDefaultEndTime(time),
            notes
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
                console.log('[Storage] Event created in Supabase');
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
            window.devPanelModule.logAction(`Created event: "${title}"`);
        }

        // Show feedback
        showToast('Event created');
        return;
    }

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

// ============================================
// STORAGE (Supabase)
// ============================================

async function loadEvents() {
    console.log('[Storage] Loading events from Supabase...');

    try {
        const response = await fetch('/api/events');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        events = data.events || [];

        console.log('[Storage] Loaded', events.length, 'events from Supabase');

        // Also cache in localStorage as backup
        localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
        console.error('[Storage] Failed to load from Supabase:', error);

        // Fallback to localStorage
        console.log('[Storage] Falling back to localStorage');
        const stored = localStorage.getItem('events');
        if (stored) {
            events = JSON.parse(stored);
            console.log('[Storage] Loaded', events.length, 'events from localStorage');
        }
    }
}

async function saveEvents() {
    console.log('[Storage] Saving', events.length, 'events to Supabase...');

    // Save to localStorage first (immediate backup)
    localStorage.setItem('events', JSON.stringify(events));

    try {
        // Get existing events from Supabase to find which ones to save
        const response = await fetch('/api/events');
        const data = await response.json();
        const existingIds = new Set((data.events || []).map(e => e.id));

        // Save new events to Supabase
        const savePromises = events
            .filter(event => !existingIds.has(event.id))
            .map(event => {
                return fetch('/api/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });
            });

        await Promise.all(savePromises);
        console.log('[Storage] Saved to Supabase successfully');
    } catch (error) {
        console.error('[Storage] Failed to save to Supabase:', error);
        console.log('[Storage] Event saved to localStorage only');
    }
}

// ============================================
// DEBUG / TESTING
// ============================================

// Add test event manually (for debugging)
window.addTestEvent = function(title, date, time) {
    const testEvent = {
        id: Date.now(),
        title: title || 'Test Event',
        date: date || '2026-01-21', // Tuesday
        time: time || '18:30',
        raw: 'Manual test',
        aiResponse: null
    };

    console.log('[Test] Adding test event:', testEvent);
    events.push(testEvent);
    saveEvents();
    renderCalendar();
    console.log('[Test] Event added. Total events:', events.length);
};

// View all events (for debugging)
window.viewEvents = function() {
    console.log('[Debug] Current events:', events);
    console.log('[Debug] localStorage events:', JSON.parse(localStorage.getItem('events') || '[]'));
};

// Clear all events (for debugging)
window.clearEvents = function() {
    events = [];
    saveEvents();
    renderCalendar();
    console.log('[Debug] All events cleared');
};
