# Milestone 8.6: Hook Up Smart Triage Flow

**Goal:** Connect the existing triage UI infrastructure to the quick capture flow, so AI responses branch based on confidence level.

**Status:** Ready for Implementation  
**Estimated Effort:** 4-6 hours  
**Dependencies:** Milestone 8.5 complete (basic quick capture working)

---

## Overview

### Current State
- Quick capture sends text to `/api/parse`
- API returns `{ items: [{ category, confidence, event }] }`
- `processQuickCaptureResponse()` creates events directly (no branching)
- UI shows `alert('✓ Added')` for all cases
- Rich schemas exist in `types/schemas.js` but aren't used
- Mock AI engine exists but isn't wired up

### Target State
- API returns richer response with `action` field
- `processQuickCaptureResponse()` branches based on `action` and `confidence`
- Different UI flows for different confidence levels:
  - **High confidence** → Auto-create + toast with undo
  - **Medium confidence** → Inline triage (time picker, etc.)
  - **Low confidence** → Ask clarifying question

---

## UX Design

### Flow A: High Confidence (Auto-Create)
```
User types: "Call mom tomorrow at 6pm"
    ↓
AI returns: { action: "create_event", confidence: "high", events: [...] }
    ↓
Event created automatically
    ↓
Toast: "✓ Created: Call mom · Tomorrow 6pm" [Undo] [Edit]
    ↓
Modal closes
```

### Flow B: Medium Confidence (Inline Triage)
```
User types: "Meeting with Sarah tomorrow"
    ↓
AI returns: { action: "ask_question", confidence: "medium", needsInfo: { field: "time" } }
    ↓
Quick capture modal transforms to show:
┌─────────────────────────────────────┐
│ ✕                                   │
│                                     │
│ 📅 Meeting with Sarah               │
│ Tomorrow (Jan 25)                   │
│                                     │
│ What time?                          │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ 9am │ │ 12pm│ │ 3pm │ │ 6pm │    │
│ └─────┘ └─────┘ └─────┘ └─────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Or pick a time...           ▼  │ │
│ └─────────────────────────────────┘ │
│                                     │
│   [ Save as Task ]  [ Create Event ]│
└─────────────────────────────────────┘
```

### Flow C: Low Confidence (Clarification)
```
User types: "Remember to exercise"
    ↓
AI returns: { action: "ask_question", confidence: "low", needsInfo: { field: "type" } }
    ↓
Quick capture modal shows:
┌─────────────────────────────────────┐
│ ✕                                   │
│                                     │
│ "Remember to exercise"              │
│                                     │
│ What would you like to do?          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📅 Add to calendar              │ │ → Opens date/time picker
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Save as task                  │ │ → Creates task (no time)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📝 Save as note                 │ │ → Creates note
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Flow D: Multiple Events
```
User types: "Meeting at 2pm and dinner at 7pm tomorrow"
    ↓
AI returns: { action: "create_event", confidence: "high", events: [event1, event2] }
    ↓
Both events created
    ↓
Toast: "✓ Created 2 events" [View] [Undo]
```

---

## Implementation Tasks

### Part 1: Update API Response Format

#### Task 1.1: Update `/api/parse.js` Prompt

**File:** `prompts/calendar-parser.md`

**Change the response format section to:**

```markdown
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
    "suggestions": ["9:00", "12:00", "15:00", "18:00"]
  },
  "userMessage": "I found an event but need more details."
}
```

## Decision Rules

1. **High confidence + complete info** → `action: "create_event"`
   - Has clear title, date, AND time
   - Example: "Call mom tomorrow at 6pm"

2. **Medium confidence + missing time** → `action: "ask_question"`, `needsInfo.field: "time"`
   - Has title and date, but no time
   - Example: "Meeting with Sarah tomorrow"

3. **Medium confidence + missing date** → `action: "ask_question"`, `needsInfo.field: "date"`
   - Has title and time, but no date
   - Example: "Dentist at 3pm"

4. **Low confidence + vague** → `action: "ask_question"`, `needsInfo.field: "type"`
   - No clear date or time
   - Example: "Remember to exercise"

5. **Task-like input** → `action: "create_task"`
   - Has deadline but no specific time
   - Example: "Finish report by Friday"

6. **Note-like input** → `action: "create_note"`
   - No temporal information at all
   - Example: "Ideas for vacation"
```

#### Task 1.2: Update Examples in Prompt

**Add these examples to `prompts/calendar-parser.md`:**

```markdown
## Examples

### Example 1: High Confidence Event
Input: "Call mom tomorrow at 6pm"
Output:
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
  "userMessage": "Got it! Creating event."
}
```

### Example 2: Medium Confidence - Missing Time
Input: "Meeting with Sarah tomorrow"
Output:
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

### Example 3: Low Confidence - Vague
Input: "Remember to exercise"
Output:
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

### Example 4: Task
Input: "Finish report by Friday"
Output:
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

### Part 2: Update Response Processing

#### Task 2.1: Rewrite `processQuickCaptureResponse()`

**File:** `app.js`

**Replace the existing function with:**

```javascript
async function processQuickCaptureResponse(originalText, response) {
    console.log('[Triage] Processing response:', response);
    
    // Handle legacy format (items array) for backwards compatibility
    if (response.items && !response.action) {
        return processLegacyResponse(originalText, response);
    }
    
    const { action, confidence, events, needsInfo, userMessage } = response;
    
    switch (action) {
        case 'create_event':
            if (confidence === 'high') {
                // Auto-create and show toast
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
                // Show preview for confirmation
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
            // Fallback: try to create event anyway
            if (events && events.length > 0) {
                showEventPreview(events, originalText);
            } else {
                showToast('Could not parse input', 'error');
            }
    }
}

// Backwards compatibility with old API format
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
        showToast('No events found in response', 'warning');
    }
}
```

#### Task 2.2: Add Helper Functions

**File:** `app.js`

**Add these new functions:**

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
    // For now, create as an all-day event
    // TODO: Implement proper task storage
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
    // TODO: Implement proper notes storage
    // For now, just log it
    console.log('[Notes] Would save note:', text);
    
    // Could store in localStorage for now
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push({
        id: Date.now(),
        text: text,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('notes', JSON.stringify(notes));
}
```

---

### Part 3: Build Triage UI Components

#### Task 3.1: Add Triage Container to HTML

**File:** `index.html`

**Add inside the quick capture modal, after the input area:**

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
        
        <!-- Triage Mode (shown when clarification needed) -->
        <div id="quickCaptureTriage" class="quick-capture-triage-mode hidden">
            <!-- Dynamically populated -->
        </div>
        
        <!-- Preview Mode (shown for confirmation) -->
        <div id="quickCapturePreview" class="quick-capture-preview-mode hidden">
            <!-- Dynamically populated -->
        </div>
    </div>
</div>
```

#### Task 3.2: Add Triage UI Functions

**File:** `app.js`

**Add these functions:**

```javascript
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
            html = renderGenericTriageUI(event, needsInfo, originalText);
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
                <span class="type-desc">Set a specific date & time</span>
            </button>
            
            <button class="type-option" data-type="task">
                <span class="type-icon">✓</span>
                <span class="type-label">Save as task</span>
                <span class="type-desc">Add to your to-do list</span>
            </button>
            
            <button class="type-option" data-type="note">
                <span class="type-icon">📝</span>
                <span class="type-label">Save as note</span>
                <span class="type-desc">Just remember it</span>
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
            <button class="btn-secondary" onclick="resetTriage()">
                Back
            </button>
            <button class="btn-primary" id="triageConfirmBtn">
                Create Event
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
            const type = btn.dataset.type;
            await handleTypeSelection(type, originalText);
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
        const timeInput = document.getElementById('triageCustomTime');
        finalEvent.time = timeInput.value;
    } else if (field === 'date') {
        const dateInput = document.getElementById('triageDatePicker');
        finalEvent.date = dateInput.value;
    }
    
    finalEvent.originalText = originalText;
    
    await createEventsFromResponse([finalEvent]);
    closeQuickCapture();
    showToast(`✓ Created: ${finalEvent.title}`, 'success');
}

async function handleTypeSelection(type, originalText) {
    switch (type) {
        case 'calendar':
            // Show date/time picker
            showTriageQuestion(
                { field: 'date', question: 'When should this be?' },
                [{ title: originalText }],
                originalText
            );
            break;
        case 'task':
            await createTaskFromResponse({ title: originalText }, originalText);
            closeQuickCapture();
            showToast(`✓ Task saved`, 'success');
            break;
        case 'note':
            await createNoteFromResponse(originalText);
            closeQuickCapture();
            showToast(`✓ Saved as note`, 'success');
            break;
    }
}

async function triageAsTask(title, date, originalText) {
    await createTaskFromResponse({ title, date }, originalText);
    closeQuickCapture();
    showToast(`✓ Task saved: ${title}`, 'success');
}

function resetTriage() {
    const inputMode = document.getElementById('quickCaptureInput');
    const triageMode = document.getElementById('quickCaptureTriage');
    const previewMode = document.getElementById('quickCapturePreview');
    
    inputMode.classList.remove('hidden');
    triageMode.classList.add('hidden');
    previewMode.classList.add('hidden');
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
            <button class="btn-secondary" onclick="resetTriage()">
                Edit
            </button>
            <button class="btn-primary" onclick="confirmEventPreview()">
                Create Event
            </button>
        </div>
    `;
    
    // Store for confirmation
    window._pendingEvents = events;
    window._pendingOriginalText = originalText;
}

async function confirmEventPreview() {
    if (window._pendingEvents) {
        await createEventsFromResponse(window._pendingEvents);
        closeQuickCapture();
        showToast(`✓ Created: ${window._pendingEvents[0].title}`, 'success');
        window._pendingEvents = null;
    }
}

// Helper: escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

#### Task 3.3: Update `closeQuickCapture()` to Reset State

**File:** `app.js`

**Update the function:**

```javascript
function closeQuickCapture() {
    document.getElementById('quickCaptureModal').classList.remove('open');
    document.getElementById('quick-capture-input').value = '';
    
    // Reset triage state
    resetTriage();
    
    // Clear pending data
    window._pendingEvents = null;
    window._pendingOriginalText = null;
}
```

---

### Part 4: Add Triage Styles

#### Task 4.1: Add CSS for Triage UI

**File:** `style.css`

**Add these styles:**

```css
/* ============================================
   TRIAGE UI STYLES
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

/* Triage Header */
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

/* Triage Question */
.triage-question {
    margin-bottom: 16px;
}

.triage-question p {
    font-size: 15px;
    color: #333;
    margin: 0;
}

/* Time Suggestions */
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

/* Custom Time Input */
.triage-custom-time {
    margin-bottom: 20px;
}

.triage-custom-time label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 6px;
}

.triage-custom-time input[type="time"] {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
}

/* Type Options */
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

/* Date Picker */
.triage-date-picker {
    margin-bottom: 20px;
}

.triage-date-picker input[type="date"] {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
}

/* Triage Actions */
.triage-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #eee;
}

/* Preview Card */
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

.preview-date {
    margin-right: 8px;
}

.preview-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

/* Button Styles */
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
```

---

### Part 5: Enhanced Toast with Actions

#### Task 5.1: Update Toast Function

**File:** `app.js`

**Replace or update `showToast()`:**

```javascript
function showToast(message, type = 'info', options = {}) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let html = `<span class="toast-message">${message}</span>`;
    
    // Add action buttons if provided
    if (options.actions && options.actions.length > 0) {
        html += '<div class="toast-actions">';
        options.actions.forEach(action => {
            html += `<button class="toast-action" data-action="${action.action}">${action.label}</button>`;
        });
        html += '</div>';
    }
    
    toast.innerHTML = html;
    document.body.appendChild(toast);
    
    // Bind action handlers
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
    
    // Auto-dismiss after 5 seconds (longer if has actions)
    const duration = options.actions ? 8000 : 4000;
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

async function handleToastAction(action, data) {
    switch (action) {
        case 'undo':
            // Remove the events that were just created
            if (Array.isArray(data)) {
                for (const eventData of data) {
                    const idx = events.findIndex(e => e.title === eventData.title && e.date === eventData.date);
                    if (idx > -1) {
                        events.splice(idx, 1);
                    }
                }
                await saveEvents();
                renderCalendar();
                showToast('Undone', 'info');
            }
            break;
        case 'edit':
            // Open the event for editing
            if (data && data.title) {
                const event = events.find(e => e.title === data.title && e.date === data.date);
                if (event) {
                    openEventDetail(event.id);
                }
            }
            break;
    }
}
```

#### Task 5.2: Add Toast Styles

**File:** `style.css`

**Add/update toast styles:**

```css
/* ============================================
   TOAST STYLES
   ============================================ */

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

.toast-success {
    background: #34C759;
}

.toast-error {
    background: #FF3B30;
}

.toast-warning {
    background: #FF9500;
}

.toast-message {
    font-size: 14px;
}

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

## Testing Checklist

### Test 1: High Confidence Event
```
Input: "Call mom tomorrow at 6pm"
Expected: 
- Event auto-created
- Toast shows "✓ Created: Call mom" with Undo/Edit buttons
- Modal closes automatically
- Event appears on calendar
```

### Test 2: Missing Time (Medium Confidence)
```
Input: "Meeting with Sarah tomorrow"
Expected:
- Triage UI appears with time picker
- Shows suggested times (9am, 12pm, 3pm, 6pm)
- Can pick time or use custom picker
- Click "Create Event" → event created with selected time
```

### Test 3: Vague Input (Low Confidence)
```
Input: "Remember to exercise"
Expected:
- Type selection UI appears
- Three options: Calendar, Task, Note
- Selecting "Calendar" → shows date picker
- Selecting "Task" → saves as task
- Selecting "Note" → saves as note
```

### Test 4: Undo Action
```
Steps:
1. Create event via high-confidence input
2. Click "Undo" on toast
Expected:
- Event removed from calendar
- Shows "Undone" toast
```

### Test 5: Edit from Toast
```
Steps:
1. Create event via high-confidence input
2. Click "Edit" on toast
Expected:
- Event detail modal opens
- Can edit event details
```

### Test 6: Legacy API Compatibility
```
Steps:
1. If API returns old format { items: [...] }
Expected:
- Still creates events correctly
- No errors in console
```

---

## Success Criteria

- [ ] High confidence events auto-create with undo option
- [ ] Medium confidence shows appropriate triage UI
- [ ] Low confidence asks what type to create
- [ ] Time picker works with suggestions and custom input
- [ ] Type selection (calendar/task/note) works
- [ ] Toast shows with action buttons
- [ ] Undo action removes created events
- [ ] Edit action opens event detail
- [ ] Backwards compatible with old API format
- [ ] No console errors
- [ ] Works on mobile viewport

---

## Files Modified

1. `prompts/calendar-parser.md` - Updated response format
2. `app.js` - New triage logic and UI functions
3. `index.html` - Triage container in modal
4. `style.css` - Triage and toast styles

---

## Future Enhancements (Not in Scope)

- Proper task storage (currently saves as all-day events)
- Notes view/management
- Multi-event preview UI
- Drag to reschedule from triage
- Voice input in triage mode
- Keyboard shortcuts for triage options
