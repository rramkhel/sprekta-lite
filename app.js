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

            // Refresh triage if open
            if (window.TriagePanel?.isOpen) {
                window.TriagePanel.refresh();
            }
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

    // Refresh triage if open
    if (window.TriagePanel?.isOpen) {
        window.TriagePanel.refresh();
    }
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

        // Refresh triage if open
        if (window.TriagePanel?.isOpen) {
            window.TriagePanel.refresh();
        }
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
    resetTriage();
    window._pendingEvents = null;
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
    console.log('[Triage] Processing response:', response);

    // Handle legacy format (items array) for backwards compatibility
    if (response.items && !response.action) {
        return processLegacyResponse(originalText, response);
    }

    const { action, confidence, events: eventData, needsInfo, userMessage } = response;

    switch (action) {
        case 'create_event':
            if (confidence === 'high') {
                // Auto-create and show toast
                await createEventsFromResponse(eventData);
                closeQuickCapture();
                showToast(
                    eventData.length === 1
                        ? `✓ Created: ${eventData[0].title}`
                        : `✓ Created ${eventData.length} events`,
                    'success',
                    {
                        actions: [
                            { label: 'Undo', action: 'undo', data: eventData },
                            { label: 'Edit', action: 'edit', data: eventData[0] }
                        ]
                    }
                );
            } else {
                showEventPreview(eventData, originalText);
            }
            break;

        case 'ask_question':
            showTriageQuestion(needsInfo, eventData, originalText);
            break;

        case 'create_task':
            await createTaskFromResponse(eventData[0], originalText);
            closeQuickCapture();
            showToast(`✓ Task saved: ${eventData[0].title}`, 'success');
            break;

        case 'create_note':
            await createNoteFromResponse(originalText);
            closeQuickCapture();
            showToast('✓ Saved as note', 'success');
            break;

        default:
            console.warn('[Triage] Unknown action:', action);
            // Fallback: try to create event anyway
            if (eventData && eventData.length > 0) {
                showEventPreview(eventData, originalText);
            } else {
                showToast('Could not parse input', 'error');
            }
    }
}

async function processLegacyResponse(originalText, response) {
    console.log('[Triage] Processing legacy format');

    const eventItems = response.items.filter(item =>
        item.category === 'event' && item.event
    );

    if (eventItems.length > 0) {
        const events = eventItems.map(item => ({
            title: item.event.title,
            date: item.event.date,
            time: item.event.time,
            originalText: item.originalText,
            confidence: item.confidence
        }));

        await createEventsFromResponse(events);
        closeQuickCapture();
        showToast(`✓ Created ${events.length} event(s)`, 'success');
    } else {
        showToast('No events found', 'warning');
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

        // Refresh triage if open
        if (window.TriagePanel?.isOpen) {
            window.TriagePanel.refresh();
        }

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

    // Refresh triage if open
    if (window.TriagePanel?.isOpen) {
        window.TriagePanel.refresh();
    }
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

    // Refresh triage if open
    if (window.TriagePanel?.isOpen) {
        window.TriagePanel.refresh();
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info', options = {}) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let html = `<span class="toast-message">${message}</span>`;

    if (options.actions && options.actions.length > 0) {
        html += '<div class="toast-actions">';
        options.actions.forEach(action => {
            html += `<button class="toast-action" data-action="${action.action}">${action.label}</button>`;
        });
        html += '</div>';
    }

    toast.innerHTML = html;
    document.body.appendChild(toast);

    if (options.actions) {
        toast.querySelectorAll('.toast-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const actionName = btn.dataset.action;
                const action = options.actions.find(a => a.action === actionName);
                if (action && action.data) {
                    handleToastAction(actionName, action.data);
                }
                toast.remove();
            });
        });
    }

    const duration = options.actions ? 8000 : 4000;
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

async function handleToastAction(action, data) {
    switch (action) {
        case 'undo':
            if (Array.isArray(data)) {
                for (const eventData of data) {
                    const idx = events.findIndex(e =>
                        e.title === eventData.title && e.date === eventData.date
                    );
                    if (idx > -1) events.splice(idx, 1);
                }
                await saveEvents();
                renderCalendar();
                showToast('Undone', 'info');
            }
            break;
        case 'edit':
            if (data && data.title) {
                const event = events.find(e =>
                    e.title === data.title && e.date === data.date
                );
                if (event) openEventDetail(event.id);
            }
            break;
    }
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

// ============================================
// TRIAGE HELPERS (Milestone 8.6)
// ============================================

async function createEventsFromResponse(eventDataArray) {
    for (const eventData of eventDataArray) {
        const startTime = eventData.time || '09:00';
        const newEvent = {
            id: Date.now() + Math.random(),
            title: eventData.title,
            date: eventData.date,
            time: startTime,
            endTime: getDefaultEndTime(startTime),
            raw: eventData.originalText,
            aiResponse: eventData
        };
        events.push(newEvent);
    }
    await saveEvents();
    renderCalendar();
}

async function createTaskFromResponse(taskData, originalText) {
    const newEvent = {
        id: Date.now(),
        title: taskData.title,
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: null,
        allDay: true,
        isTask: true,
        raw: originalText
    };
    events.push(newEvent);
    await saveEvents();
    renderCalendar();
}

async function createNoteFromResponse(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push({
        id: Date.now(),
        text: text,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('notes', JSON.stringify(notes));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// TRIAGE UI (Milestone 8.6)
// ============================================

function showTriageQuestion(needsInfo, events, originalText) {
    const inputMode = document.getElementById('quickCaptureInput');
    const triageMode = document.getElementById('quickCaptureTriage');

    inputMode.classList.add('hidden');
    triageMode.classList.remove('hidden');

    const event = events && events[0] ? events[0] : { title: originalText };

    let html = '';
    switch (needsInfo.field) {
        case 'time':
            html = renderTimeTriageUI(event, needsInfo, originalText);
            break;
        case 'date':
            html = renderDateTriageUI(event, needsInfo, originalText);
            break;
        case 'type':
            html = renderTypeTriageUI(originalText, needsInfo);
            break;
        default:
            html = renderTypeTriageUI(originalText, needsInfo);
    }

    triageMode.innerHTML = html;
    bindTriageEvents(needsInfo.field, event, originalText);
}

function renderTimeTriageUI(event, needsInfo, originalText) {
    const suggestions = needsInfo.suggestions || ['09:00', '12:00', '15:00', '18:00'];
    const formattedDate = formatDateLong(event.date);

    return `
        <div class="triage-header">
            <h3>📅 ${escapeHtml(event.title)}</h3>
            <p class="triage-date">${formattedDate}</p>
        </div>
        <div class="triage-question">
            <p>${needsInfo.question || 'What time?'}</p>
        </div>
        <div class="triage-time-suggestions">
            ${suggestions.map(time => `
                <button class="time-suggestion" data-time="${time}">
                    ${formatTime(time)}
                </button>
            `).join('')}
        </div>
        <div class="triage-custom-time">
            <label>Or pick a time:</label>
            <input type="time" id="triageCustomTime" value="12:00">
        </div>
        <div class="triage-actions">
            <button class="btn-secondary" onclick="triageAsTask('${escapeHtml(event.title)}', '${event.date}', '${escapeHtml(originalText)}')">
                Save as Task
            </button>
            <button class="btn-primary" id="triageConfirmBtn">
                Create Event
            </button>
        </div>
    `;
}

function renderDateTriageUI(event, needsInfo, originalText) {
    const today = new Date().toISOString().split('T')[0];
    return `
        <div class="triage-header">
            <h3>📅 ${escapeHtml(event.title)}</h3>
            ${event.time ? `<p class="triage-time">at ${formatTime(event.time)}</p>` : ''}
        </div>
        <div class="triage-question">
            <p>${needsInfo.question || 'What date?'}</p>
        </div>
        <div class="triage-date-picker">
            <input type="date" id="triageDatePicker" value="${today}" min="${today}">
        </div>
        <div class="triage-actions">
            <button class="btn-secondary" onclick="resetTriage()">Back</button>
            <button class="btn-primary" id="triageConfirmBtn">Create Event</button>
        </div>
    `;
}

function renderTypeTriageUI(originalText, needsInfo) {
    return `
        <div class="triage-header">
            <p class="triage-original-text">"${escapeHtml(originalText)}"</p>
        </div>
        <div class="triage-question">
            <p>${needsInfo.question || 'What would you like to do?'}</p>
        </div>
        <div class="triage-type-options">
            <button class="type-option" data-type="calendar">
                <span class="type-icon">📅</span>
                <span class="type-label">Add to calendar</span>
                <span class="type-desc">Set a date & time</span>
            </button>
            <button class="type-option" data-type="task">
                <span class="type-icon">✓</span>
                <span class="type-label">Save as task</span>
                <span class="type-desc">Add to to-do list</span>
            </button>
            <button class="type-option" data-type="note">
                <span class="type-icon">📝</span>
                <span class="type-label">Save as note</span>
                <span class="type-desc">Just remember it</span>
            </button>
        </div>
    `;
}

function bindTriageEvents(field, event, originalText) {
    const triageMode = document.getElementById('quickCaptureTriage');

    // Time suggestions
    triageMode.querySelectorAll('.time-suggestion').forEach(btn => {
        btn.addEventListener('click', () => {
            const time = btn.dataset.time;
            document.getElementById('triageCustomTime').value = time;
            triageMode.querySelectorAll('.time-suggestion').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Type options
    triageMode.querySelectorAll('.type-option').forEach(btn => {
        btn.addEventListener('click', async () => {
            await handleTypeSelection(btn.dataset.type, originalText);
        });
    });

    // Confirm button
    const confirmBtn = document.getElementById('triageConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            await handleTriageConfirm(field, event, originalText);
        });
    }
}

async function handleTriageConfirm(field, event, originalText) {
    let finalEvent = { ...event };

    if (field === 'time') {
        finalEvent.time = document.getElementById('triageCustomTime').value;
    } else if (field === 'date') {
        finalEvent.date = document.getElementById('triageDatePicker').value;
    }

    finalEvent.originalText = originalText;
    await createEventsFromResponse([finalEvent]);
    closeQuickCapture();
    showToast(`✓ Created: ${finalEvent.title}`, 'success');
}

async function handleTypeSelection(type, originalText) {
    switch (type) {
        case 'calendar':
            showTriageQuestion(
                { field: 'date', question: 'When should this be?' },
                [{ title: originalText }],
                originalText
            );
            break;
        case 'task':
            await createTaskFromResponse({ title: originalText }, originalText);
            closeQuickCapture();
            showToast('✓ Task saved', 'success');
            break;
        case 'note':
            await createNoteFromResponse(originalText);
            closeQuickCapture();
            showToast('✓ Saved as note', 'success');
            break;
    }
}

async function triageAsTask(title, date, originalText) {
    await createTaskFromResponse({ title, date }, originalText);
    closeQuickCapture();
    showToast(`✓ Task saved: ${title}`, 'success');
}

function resetTriage() {
    document.getElementById('quickCaptureInput').classList.remove('hidden');
    document.getElementById('quickCaptureTriage').classList.add('hidden');
    document.getElementById('quickCapturePreview').classList.add('hidden');
}

function showEventPreview(events, originalText) {
    const inputMode = document.getElementById('quickCaptureInput');
    const previewMode = document.getElementById('quickCapturePreview');

    inputMode.classList.add('hidden');
    previewMode.classList.remove('hidden');

    const event = events[0];
    previewMode.innerHTML = `
        <div class="preview-header">
            <h3>Create this event?</h3>
        </div>
        <div class="preview-event-card">
            <div class="preview-title">${escapeHtml(event.title)}</div>
            <div class="preview-datetime">
                <span class="preview-date">${formatDateLong(event.date)}</span>
                ${event.time ? `<span class="preview-time">at ${formatTime(event.time)}</span>` : ''}
            </div>
        </div>
        <div class="preview-actions">
            <button class="btn-secondary" onclick="resetTriage()">Edit</button>
            <button class="btn-primary" onclick="confirmEventPreview()">Create Event</button>
        </div>
    `;

    window._pendingEvents = events;
}

async function confirmEventPreview() {
    if (window._pendingEvents) {
        await createEventsFromResponse(window._pendingEvents);
        closeQuickCapture();
        showToast(`✓ Created: ${window._pendingEvents[0].title}`, 'success');
        window._pendingEvents = null;
    }
}
