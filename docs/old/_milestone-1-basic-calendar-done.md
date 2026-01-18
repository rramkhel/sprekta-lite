Yes! Let me refine this into a proper milestone with clear before/after and specific changes.

---

# MILESTONE: Minimal Working Prototype (MVP-01)

## Goal
Strip Sprekta Lite to bare essentials: Quick capture → AI parse → Calendar display. Test AI parsing with real use cases. No polish needed.

## Success Criteria
✅ User can quick capture natural language  
✅ AI parses and creates calendar event  
✅ Event displays on calendar immediately  
✅ Click event shows raw data for debugging  
✅ App loads fast, no complexity

---

## File-by-File Changes

### 1. `index.html` - Simplify Structure

**REMOVE these entire sections:**
- `<div id="notes-view">` (entire notes section)
- `<div id="profile-panel">` (entire profile section)
- `<div id="triage-modal">` (entire triage modal)
- `<div id="chat-view">` (entire chat interface)
- Any dev panel/versioning UI if present
- All `<script>` tags for modules except `app.js`

**KEEP and simplify:**
- Calendar header + grid
- Quick capture button
- Quick capture modal (but simplify it)

**Quick capture modal changes:**
```html
<!-- Before: Complex modal with examples, voice button, etc -->
<!-- After: Simple modal -->
<div id="quickCaptureModal" class="modal">
  <div class="modal-content" style="max-width: 500px;">
    <h3>Quick Capture</h3>
    <textarea 
      id="quickCaptureInput" 
      placeholder="Type naturally: 'Call mom tomorrow at 6pm'"
      rows="3"
      style="width: 100%; padding: 8px; font-size: 14px;"
    ></textarea>
    <div style="margin-top: 12px; text-align: right;">
      <button onclick="closeQuickCapture()" style="margin-right: 8px;">Cancel</button>
      <button onclick="submitQuickCapture()" class="primary">Add</button>
    </div>
  </div>
</div>
```

**Final structure should be:**
```html
<body>
  <div id="calendar-view">
    <!-- Calendar header -->
    <!-- Calendar grid -->
    <!-- Quick capture button -->
  </div>
  
  <div id="quickCaptureModal">
    <!-- Simplified modal above -->
  </div>
  
  <script src="/app.js"></script>
</body>
```

---

### 2. `app.js` - Gut Everything

**DELETE these entire sections/functions:**
- All notes functions (`loadAllNotes`, `saveAllNotes`, `createNewNote`, `openNote`, etc.)
- All profile functions (anything with `userProfile`)
- All chat functions (`sendMessage`, `addMessage`, `conversationHistory`, etc.)
- All triage modal functions (`openTriageModal`, `closeTriageModal`, etc.)
- `parseEventFromText()` (we're using AI, not manual parsing)
- Any dev panel code

**KEEP these functions (but simplify):**
- `renderCalendar()`
- `changeMonth()`
- `formatTime()`
- `loadEvents()`
- `saveEvents()`
- `openQuickCapture()`
- `closeQuickCapture()`
- `submitQuickCapture()`
- `processQuickCaptureResponse()`

**CHANGE `submitQuickCapture()` to:**
```javascript
async function submitQuickCapture() {
    const input = document.getElementById('quickCaptureInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        // Call AI endpoint
        const response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) throw new Error('Parse failed');
        
        const parsed = await response.json();
        console.log('AI Response:', parsed);
        
        // Add events from AI response
        await processQuickCaptureResponse(text, parsed);
        
        closeQuickCapture();
        alert('✓ Added to calendar');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to process. Check console.');
    }
}
```

**CHANGE `processQuickCaptureResponse()` to:**
```javascript
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
```

**CHANGE calendar event click handler:**
When user clicks an event, instead of opening triage modal, just show alert:
```javascript
// In renderCalendar(), when rendering event blocks:
// Find where events are clickable and change to:
onclick="showEventDebug(${event.id})"

// Add this function:
function showEventDebug(eventId) {
    const event = events.find(e => e.id === eventId);
    if (event) {
        alert(JSON.stringify(event, null, 2));
    }
}
```

**Event object structure:**
```javascript
{
  id: 1737234567890,
  title: 'RealRoots event',
  date: '2026-01-21',
  time: '18:30',
  raw: 'i have a realroots event on tuesday at 6:30pm',
  aiResponse: { /* full AI response */ }
}
```

**Remove:**
- `quickCaptureDemo` flag and example text
- `pending` flag on events
- `confidence` handling
- All `window.DEMO_MODE` code
- Mock AI code

---

### 3. `style.css` - Minimal Styles

**DELETE styles for:**
- `.notes-*` (all notes classes)
- `.profile-*` (all profile classes)
- `.triage-*` (all triage classes)
- `.chat-*` (all chat classes)
- `.dev-*` (all dev panel classes)
- Complex animations
- Toast notifications (use browser alert instead)

**KEEP:**
- Basic calendar grid layout
- Month navigation
- Event block styling
- Modal backdrop + content
- Button styles

**Simplify modal:**
```css
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
}

.modal.open {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

**Calendar should be plain:**
- Simple grid
- Events as colored blocks with title + time
- No fancy interactions (drag, resize, etc.)

---

### 4. `api/parse.js` - Keep As-Is

✅ **NO CHANGES NEEDED**

This file already works. Just make sure it returns events in this format:
```json
{
  "action": "create_event",
  "events": [
    {
      "title": "RealRoots event",
      "date": "2026-01-21",
      "time": "18:30",
      "originalText": "i have a realroots event on tuesday at 6:30pm",
      "confidence": "high"
    }
  ],
  "confidence": "high"
}
```

---

## Testing Checklist

After changes, test these scenarios:

### Test 1: Basic Event
```
Input: "i have a realroots event on tuesday at 6:30pm"
Expected: Event appears on Jan 21 at 6:30 PM
Verify: Click event, see JSON in alert
```

### Test 2: Missing Time
```
Input: "dentist appointment next friday"
Expected: Event appears on Jan 24 with default time
Verify: AI fills in missing details
```

### Test 3: Complex Input
```
Input: "Call mom tomorrow about birthday plans, need to pick a restaurant"
Expected: Event created with full title
Verify: Raw input preserved in event.raw
```

### Test 4: Multiple Events
```
Input: "Meeting at 2pm tomorrow and dinner with Sarah at 7pm"
Expected: Two events created
Verify: Both appear on calendar
```

---

## Visual Mock (After Changes)

```
┌─────────────────────────────────────┐
│  January 2026          [< >]        │
├──┬──┬──┬──┬──┬──┬──────────────────┤
│Su│Mo│Tu│We│Th│Fr│Sa                │
├──┼──┼──┼──┼──┼──┼──────────────────┤
│  │  │  │1 │2 │3 │4                 │
│5 │6 │7 │8 │9 │10│11                │
│12│13│14│15│16│17│18                │
│19│20│21│22│23│24│25  <- Jan 21:    │
│  │  │🟦│  │  │  │     RealRoots     │
│  │  │6:30│  │  │  │     6:30 PM     │
│26│27│28│29│30│31│                  │
└──┴──┴──┴──┴──┴──┴──────────────────┘

         [Quick Capture Button]

Click event → Browser alert shows JSON
```

---

## Success Definition

**You're done when:**
1. App has <500 lines of code total
2. No features except: calendar view + quick capture
3. You can type a sentence and it appears on calendar
4. Clicking event shows you the raw data
5. App loads in <1 second

**The whole point:** Fast iteration on AI parsing. Everything else is noise.

---

## Notes for Claude Code

- Be aggressive with deletions
- Don't worry about breaking things - we want minimal
- Use browser `alert()` instead of fancy toasts
- If unsure whether to keep something, delete it
- Focus: Can user test AI parsing? If yes, you're done.

---

Want me to adjust anything before you hand this to Claude Code?