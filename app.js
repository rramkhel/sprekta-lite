// ============================================
// STATE
// ============================================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let events = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();
    renderCalendar();
    lucide.createIcons();
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
            <div class="day-cell ${todayCheck ? 'today' : ''}">
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${dayEvents.map(event => `
                        <div class="event-pill" onclick="showEventDebug(${event.id})">
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
            const newEvent = {
                id: Date.now() + index,
                title: eventData.title,
                date: eventData.date,
                time: eventData.time || '09:00',
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
// EVENT DEBUG
// ============================================

function showEventDebug(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        alert(JSON.stringify(event, null, 2));
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
