// ============================================
// STATE
// ============================================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let events = [];

// Initialize demo mode (managed by dev panel)
window.DEMO_MODE = localStorage.getItem('DEMO_MODE') === 'true';

// We'll use dynamic import for mock AI to avoid module loading issues
let mockAIModule = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
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

function clearCalendar() {
    if (confirm('Clear all events?')) {
        events = [];
        saveEvents();
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
        let parsed;

        if (window.DEMO_MODE) {
            // Load mock AI if not already loaded
            if (!mockAIModule) {
                mockAIModule = await import('/test-data/mock-ai-engine.js');
            }

            // Use mock response in demo mode
            parsed = mockAIModule.parseQuickCapture(text);
            console.log('DEMO Response:', parsed);

            // Log to dev panel if available
            if (window.devPanelModule) {
                window.devPanelModule.logAction(`Quick capture (demo): "${text}"`);
                window.devPanelModule.updateResponseInspector(parsed);
            }
        } else {
            // Call real AI endpoint
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Parse failed');

            parsed = await response.json();
            console.log('AI Response:', parsed);

            // Log to dev panel if available
            if (window.devPanelModule) {
                window.devPanelModule.logAction(`Quick capture (live): "${text}"`);
                window.devPanelModule.updateResponseInspector(parsed);
            }
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
    // Simple: just add events directly, no triage
    if (response.events && response.events.length > 0) {
        response.events.forEach((eventData, index) => {
            events.push({
                id: Date.now() + index,
                title: eventData.title,
                date: eventData.date,
                time: eventData.time || '09:00',
                raw: originalText,
                aiResponse: eventData // store full AI response for debugging
            });
        });

        await saveEvents();
        renderCalendar();
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
// STORAGE
// ============================================

function loadEvents() {
    const stored = localStorage.getItem('events');
    if (stored) {
        events = JSON.parse(stored);
    }
}

async function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}
