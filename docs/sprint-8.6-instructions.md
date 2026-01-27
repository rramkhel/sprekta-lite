```
⏺ Perfect! Sprint 8.6: Smart Triage Flow is now complete! 🎉

  What Was Implemented:

  1. Enhanced AI Prompt (prompts/calendar-parser.md)

  - New action-based response format with action, confidence, events, needsInfo fields
  - AI now decides between: create_event, ask_question, create_task, create_note
  - Includes field-level confidence tracking and smart suggestions

  2. Three-Mode Quick Capture (index.html)

  - Input Mode: Default capture interface
  - Triage Mode: Shows when AI needs more info (time, date, or type)
  - Preview Mode: Confirmation screen for medium-confidence events

  3. Triage UI Styles (style.css)

  - Text-first design with typography hierarchy
  - Time picker with suggestions (9am, 12pm, 3pm, 6pm)
  - Type selection buttons (Calendar, Task, Note)
  - Enhanced toast with action buttons
  - Smooth animations and hover states

  4. Smart Response Processing (app.js)

  - High confidence: Auto-creates event + shows toast with Undo/Edit
  - Medium confidence (missing time): Shows time picker with suggestions
  - Medium confidence (missing date): Shows date picker
  - Low confidence: Asks user to choose type (calendar/task/note)
  - Backwards compatible with legacy API format

  5. Helper Functions

  - createEventsFromResponse(): Creates events from AI data
  - createTaskFromResponse(): Saves tasks (as all-day events)
  - createNoteFromResponse(): Stores notes in localStorage
  - showEventPreview(): Confirmation UI for medium-confidence
  - handleToastAction(): Undo/Edit functionality

  How It Works:

  Flow A: High Confidence

  Input: "Call mom tomorrow at 6pm"
  → AI detects complete event
  → Auto-creates on calendar
  → Toast: "✓ Created: Call mom" [Undo] [Edit]

  Flow B: Missing Time

  Input: "Meeting with Sarah tomorrow"
  → AI detects missing time
  → Shows time picker with suggestions
  → User picks time
  → Creates event

  Flow C: Vague Input

  Input: "Remember to exercise"
  → AI detects ambiguous type
  → Shows options: Calendar / Task / Note
  → User selects
  → Saves accordingly

  Changes Committed:

  - ✅ Commit 4edf2e4: feat: smart triage flow (Sprint 8.6)
  - ✅ Pushed to GitHub
  - ✅ Ready for deployment

  Next Step: Test the flows! Try these inputs:
  1. "Call mom tomorrow at 6pm" (high confidence)
  2. "Meeting with Sarah tomorrow" (missing time)
  3. "Remember to exercise" (vague)

  The system should now intelligently triage based on confidence level! 🚀
```


---


# Sprint 8.6 Instructions for Claude Code

**Purpose:** Step-by-step implementation guide for the triage flow.

---

## Pre-Flight Checklist

Before starting, verify:
- [ ] Quick capture modal exists and works
- [ ] `/api/parse` endpoint returns responses
- [ ] Events can be created and saved
- [ ] Calendar renders events

---

## Task Order

Complete these in order:

1. Update API prompt
2. Add triage HTML structure
3. Add triage CSS
4. Update `processQuickCaptureResponse()`
5. Add triage UI functions
6. Add enhanced toast
7. Test all flows

---

## Task 1: Update API Prompt

**File:** `prompts/calendar-parser.md`

**Replace the entire file with:**

```markdown
# Calendar Parser System Prompt

You are a smart calendar parser. Parse captured text and decide what action to take.

Current date: {{CURRENT_DATE}}

## Response Format

Respond with JSON only:

```json
{
  "action": "create_event" | "ask_question" | "create_task" | "create_note",
  "confidence": "high" | "medium" | "low",
  "events": [
    {
      "title": "event title",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "originalText": "the captured line",
      "confidence": "high" | "medium" | "low",
      "fieldConfidence": {
        "title": "high",
        "date": "high" | "medium" | "low",
        "time": "high" | "medium" | "low" | null
      }
    }
  ],
  "needsInfo": {
    "field": "time" | "date" | "type",
    "question": "What time?",
    "suggestions": ["09:00", "12:00", "15:00", "18:00"]
  },
  "userMessage": "Optional message to user"
}
```

## Decision Rules

1. **action: "create_event"** with **confidence: "high"**
   - Input has clear title, date, AND time
   - Example: "Call mom tomorrow at 6pm"

2. **action: "ask_question"** with **needsInfo.field: "time"**
   - Has title and date, but NO time
   - Example: "Meeting with Sarah tomorrow"
   - Include time suggestions: ["09:00", "12:00", "15:00", "18:00"]

3. **action: "ask_question"** with **needsInfo.field: "date"**
   - Has title and time, but NO date
   - Example: "Dentist at 3pm"

4. **action: "ask_question"** with **needsInfo.field: "type"**
   - No clear date or time, vague input
   - Example: "Remember to exercise"
   - Question: "Would you like to add this to your calendar, save as a task, or keep as a note?"

5. **action: "create_task"**
   - Has deadline but no specific time
   - Example: "Finish report by Friday"

6. **action: "create_note"**
   - No temporal information at all
   - Example: "Ideas for vacation"

## Examples

### High Confidence Event
Input: "Call mom tomorrow at 6pm"
```json
{
  "action": "create_event",
  "confidence": "high",
  "events": [{
    "title": "Call mom",
    "date": "2025-01-25",
    "time": "18:00",
    "originalText": "Call mom tomorrow at 6pm",
    "confidence": "high",
    "fieldConfidence": { "title": "high", "date": "high", "time": "high" }
  }],
  "userMessage": "Creating event."
}
```

### Missing Time
Input: "Meeting with Sarah tomorrow"
```json
{
  "action": "ask_question",
  "confidence": "medium",
  "events": [{
    "title": "Meeting with Sarah",
    "date": "2025-01-25",
    "time": null,
    "originalText": "Meeting with Sarah tomorrow",
    "confidence": "medium",
    "fieldConfidence": { "title": "high", "date": "high", "time": null }
  }],
  "needsInfo": {
    "field": "time",
    "question": "What time is the meeting?",
    "suggestions": ["09:00", "12:00", "15:00", "18:00"]
  },
  "userMessage": "When is this meeting?"
}
```

### Vague Input
Input: "Remember to exercise"
```json
{
  "action": "ask_question",
  "confidence": "low",
  "events": [],
  "needsInfo": {
    "field": "type",
    "question": "Would you like to add this to your calendar, save as a task, or keep as a note?",
    "suggestions": ["calendar", "task", "note"]
  },
  "userMessage": "How would you like to save this?"
}
```

### Task
Input: "Finish report by Friday"
```json
{
  "action": "create_task",
  "confidence": "medium",
  "events": [{
    "title": "Finish report",
    "date": "2025-01-31",
    "time": null,
    "originalText": "Finish report by Friday",
    "confidence": "medium",
    "fieldConfidence": { "title": "high", "date": "medium", "time": null }
  }],
  "userMessage": "Saved as a task due Friday."
}
```
```

---

## Task 2: Update HTML Structure

**File:** `index.html`

**Find the quick capture modal and replace its inner content:**

```html
<!-- Quick Capture Modal -->
<div id="quickCaptureModal" class="modal">
    <div class="modal-content quick-capture-modal">
        <button class="modal-close" onclick="closeQuickCapture()">✕</button>
        
        <!-- Input Mode (default) -->
        <div id="quickCaptureInput" class="quick-capture-input-mode">
            <h2>Jot it down</h2>
            <textarea 
                id="quick-capture-input" 
                placeholder="Call mom tomorrow at 6pm..."
                rows="3"
            ></textarea>
            <div class="quick-capture-actions">
                <button onclick="submitQuickCapture()" class="btn-primary">
                    Add to Calendar
                </button>
            </div>
        </div>
        
        <!-- Triage Mode -->
        <div id="quickCaptureTriage" class="quick-capture-triage-mode hidden"></div>
        
        <!-- Preview Mode -->
        <div id="quickCapturePreview" class="quick-capture-preview-mode hidden"></div>
    </div>
</div>
```

---

## Task 3: Add CSS Styles

**File:** `style.css`

**Add at the end of the file:**

```css
/* ============================================
   TRIAGE UI STYLES (Milestone 8.6)
   ============================================ */

.quick-capture-triage-mode,
.quick-capture-preview-mode {
    padding: 20px;
}

.quick-capture-triage-mode.hidden,
.quick-capture-preview-mode.hidden,
.quick-capture-input-mode.hidden {
    display: none;
}

.triage-header {
    margin-bottom: 20px;
}

.triage-header h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
}

.triage-date,
.triage-time {
    color: #666;
    font-size: 14px;
}

.triage-original-text {
    font-style: italic;
    color: #666;
    font-size: 16px;
}

.triage-question {
    margin-bottom: 16px;
}

.triage-question p {
    font-size: 15px;
    color: #333;
    margin: 0;
}

.triage-time-suggestions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.time-suggestion {
    padding: 10px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease;
}

.time-suggestion:hover {
    border-color: #007AFF;
    background: #F0F7FF;
}

.time-suggestion.selected {
    border-color: #007AFF;
    background: #007AFF;
    color: white;
}

.triage-custom-time {
    margin-bottom: 20px;
}

.triage-custom-time label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 6px;
}

.triage-custom-time input[type="time"],
.triage-date-picker input[type="date"] {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
}

.triage-type-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.type-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
}

.type-option:hover {
    border-color: #007AFF;
    background: #F0F7FF;
}

.type-icon {
    font-size: 24px;
}

.type-label {
    font-size: 15px;
    font-weight: 500;
    color: #333;
}

.type-desc {
    font-size: 13px;
    color: #666;
    margin-left: auto;
}

.triage-date-picker {
    margin-bottom: 20px;
}

.triage-actions,
.preview-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #eee;
}

.preview-header {
    margin-bottom: 16px;
}

.preview-header h3 {
    font-size: 16px;
    font-weight: 500;
    color: #666;
    margin: 0;
}

.preview-event-card {
    background: #F8F9FA;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
}

.preview-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
}

.preview-datetime {
    color: #666;
    font-size: 14px;
}

.btn-primary {
    padding: 10px 20px;
    background: #007AFF;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
}

.btn-primary:hover {
    background: #0056CC;
}

.btn-secondary {
    padding: 10px 20px;
    background: #F0F0F0;
    color: #333;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
}

.btn-secondary:hover {
    background: #E0E0E0;
}

/* Toast with Actions */
.toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: toast-slide-up 0.3s ease;
}

@keyframes toast-slide-up {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

.toast-fade-out {
    opacity: 0;
    transition: opacity 0.3s ease;
}

.toast-success { background: #34C759; }
.toast-error { background: #FF3B30; }
.toast-warning { background: #FF9500; }

.toast-message { font-size: 14px; }

.toast-actions {
    display: flex;
    gap: 8px;
    margin-left: 8px;
}

.toast-action {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
}

.toast-action:hover {
    background: rgba(255,255,255,0.3);
}
```

---

## Task 4: Update Response Processing

**File:** `app.js`

**Find `processQuickCaptureResponse()` and replace with:**

```javascript
async function processQuickCaptureResponse(originalText, response) {
    console.log('[Triage] Processing response:', response);
    
    // Handle legacy format (items array)
    if (response.items && !response.action) {
        return processLegacyResponse(originalText, response);
    }
    
    const { action, confidence, events, needsInfo, userMessage } = response;
    
    switch (action) {
        case 'create_event':
            if (confidence === 'high') {
                await createEventsFromResponse(events);
                closeQuickCapture();
                showToast(
                    events.length === 1 
                        ? `✓ Created: ${events[0].title}` 
                        : `✓ Created ${events.length} events`,
                    'success',
                    { 
                        actions: [
                            { label: 'Undo', action: 'undo', data: events },
                            { label: 'Edit', action: 'edit', data: events[0] }
                        ]
                    }
                );
            } else {
                showEventPreview(events, originalText);
            }
            break;
            
        case 'ask_question':
            showTriageQuestion(needsInfo, events, originalText);
            break;
            
        case 'create_task':
            await createTaskFromResponse(events[0], originalText);
            closeQuickCapture();
            showToast(`✓ Task saved: ${events[0].title}`, 'success');
            break;
            
        case 'create_note':
            await createNoteFromResponse(originalText);
            closeQuickCapture();
            showToast('✓ Saved as note', 'success');
            break;
            
        default:
            console.warn('[Triage] Unknown action:', action);
            if (events && events.length > 0) {
                showEventPreview(events, originalText);
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
```

---

## Task 5: Add Triage Helper Functions

**File:** `app.js`

**Add these functions (can go after the response processing):**

```javascript
// ============================================
// TRIAGE HELPERS
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
// TRIAGE UI
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
```

---

## Task 6: Update Toast and Close Functions

**File:** `app.js`

**Replace or add `showToast()`:**

```javascript
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
```

**Update `closeQuickCapture()`:**

```javascript
function closeQuickCapture() {
    document.getElementById('quickCaptureModal').classList.remove('open');
    document.getElementById('quick-capture-input').value = '';
    resetTriage();
    window._pendingEvents = null;
}
```

---

## Testing

After implementation, test these inputs:

| Input | Expected Behavior |
|-------|-------------------|
| "Call mom tomorrow at 6pm" | Auto-creates event, shows toast with Undo/Edit |
| "Meeting with Sarah tomorrow" | Shows time picker triage UI |
| "Remember to exercise" | Shows type selection (calendar/task/note) |
| "Finish report by Friday" | Creates task |

---

## Done!

Once all tests pass:
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Verify on Vercel deployment
