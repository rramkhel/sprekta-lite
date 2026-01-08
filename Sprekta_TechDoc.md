# Technical Documentation: Sprekta Calendar

## System Architecture

### Overview
Sprekta is a single-page application (SPA) built with vanilla JavaScript, HTML5, and CSS3. It uses client-side storage and the Anthropic Claude API for AI-powered chat functionality.

**Architecture Type:** Client-side monolithic SPA  
**Deployment:** Static file hosting (vercel, netlify, GitHub pages)  
**Data Layer:** Browser localStorage via window.storage API  
**AI Layer:** Anthropic Claude API (claude-sonnet-4)

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                       │
│                                                          │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   UI Layer │  │  State Mgmt  │  │  Storage Layer  │ │
│  │  (Views)   │──│  (JS Vars)   │──│ (localStorage)  │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
│         │                 │                             │
│         │                 └──────────┐                  │
│         │                            │                  │
│  ┌────────────────────────────────────────────┐        │
│  │           Event Processing Logic            │        │
│  │  - Quick Capture Parser                     │        │
│  │  - Calendar Renderer                        │        │
│  │  - Triage Flow Controller                   │        │
│  │  - Profile Extractor                        │        │
│  └────────────────────────────────────────────┘        │
│         │                                                │
│         └──────────────────────────────────────────┐    │
│                                                     │    │
└─────────────────────────────────────────────────────────┘
                                                      │
                                    ┌─────────────────┴────────────────┐
                                    │   Anthropic Claude API          │
                                    │   (claude-sonnet-4-20250514)    │
                                    └──────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **HTML5:** Semantic markup, accessibility attributes
- **CSS3:** Custom properties (CSS variables), flexbox, grid, animations
- **JavaScript (ES6+):** Async/await, arrow functions, destructuring, template literals
- **Icons:** Lucide Icons (CDN)
- **Fonts:** Google Fonts (Inter, DM Sans, DM Serif Display)

### APIs & Services
- **Anthropic Claude API:** AI chat, profile extraction, event parsing (future)
- **Web Storage API:** Persistent local storage (window.storage)
- **Web Speech API:** Voice capture (future implementation)

### Development Tools
- **Version Control:** Git
- **Editor:** VS Code (recommended)
- **Testing:** Manual testing (automated testing future)
- **Deployment:** Static file hosting

---

## File Structure

```
sprekta/
├── index.html                 # Main application file (currently: calendar-final.html)
├── README.md                  # Project overview
├── Sprekta_PRD.md            # Product requirements document
├── Sprekta_TechDoc.md        # This file
└── assets/ (future)
    ├── icons/
    ├── fonts/
    └── images/
```

**Current State:** Single-file application (~2000 lines)  
**Future State:** Modularized structure with separate JS, CSS files

---

## Data Models

### Event Object
```javascript
{
  id: Number,              // Unique identifier (timestamp)
  title: String,           // Event name
  date: String,            // ISO date format "YYYY-MM-DD"
  time: String,            // 24-hour format "HH:MM"
  description: String,     // Additional details
  pending: Boolean,        // Triage status (true = needs confirmation)
  originalText: String,    // Raw capture text (for pending events)
  location: String,        // Where event takes place (optional)
  duration: String,        // How long event lasts (optional)
  buffer: String,          // Prep/travel time (optional)
  reminder: String         // Reminder notes (optional)
}
```

**Example:**
```javascript
{
  id: 1704728400000,
  title: "Lunch with Sarah",
  date: "2026-01-09",
  time: "13:00",
  description: "📍 Café Lumière • ⏱️ 1.5 hours • 🚌 30 min before",
  pending: false,
  originalText: "lunch with sarah thursday 1pm",
  location: "Café Lumière",
  duration: "1.5 hours",
  buffer: "30 min before",
  reminder: ""
}
```

### Note Object
```javascript
{
  id: Number,              // Unique identifier (timestamp)
  content: String,         // HTML content (from contenteditable)
  createdAt: String,       // ISO timestamp
  updatedAt: String        // ISO timestamp
}
```

### Profile Object
```javascript
{
  core: {                  // Stable identity facts
    name: String,
    role: String,
    location: String,
    personality: String,
    workStyle: String,
    strengths: String,
    growthAreas: String
  },
  context: {               // Current life situation
    currentFocus: String,
    lifePhase: String,
    recentChanges: String,
    activeProjects: String,
    currentChallenges: String
  },
  people: {                // Key relationships (name: context)
    "Name": String
  },
  goals: [                 // Array of goal objects
    {
      text: String,
      addedAt: String      // ISO timestamp
    }
  ],
  preferences: {           // Work/communication preferences
    communicationStyle: String,
    meetingPreferences: String,
    workHours: String,
    focusEnvironment: String,
    feedbackStyle: String
  },
  constraints: {           // Commitments and limitations
    weeklyRecurring: String,
    personalCommitments: String,
    blackoutTimes: String,
    travelConstraints: String,
    energyPatterns: String
  },
  locations: {             // Frequent places
    home: String,
    office: String,
    gym: String,
    favoriteSpots: String,
    commonRoutes: String
  },
  habits: {                // Daily routines
    morningRoutine: String,
    workDayStructure: String,
    eveningRoutine: String,
    weekendPatterns: String,
    selfCare: String
  },
  tools: {                 // Software and systems
    coreTools: String,
    taskManagement: String,
    noteTaking: String,
    communication: String,
    learning: String
  },
  updatedAt: String        // ISO timestamp
}
```

### Quick Capture Object
```javascript
{
  id: Number,              // Unique identifier (timestamp)
  text: String,            // Raw captured text
  capturedAt: String,      // ISO timestamp
  processed: Boolean       // Whether AI has processed it
}
```

---

## Key Functions & Logic

### Quick Capture System

#### `openQuickCapture()`
Opens the capture modal with pre-filled demo text.

```javascript
function openQuickCapture() {
  const modal = document.getElementById('quickCaptureModal');
  const input = document.getElementById('quickCaptureInput');
  
  modal.classList.add('open');
  
  // Pre-fill for demo
  if (quickCaptureDemo) {
    input.value = "Call mom tomorrow at 6pm...";
  }
  
  setTimeout(() => input.focus(), 100);
  lucide.createIcons();
}
```

#### `submitQuickCapture()`
Processes captured text, parses events, and adds to calendar.

**Algorithm:**
1. Split input by newlines
2. For each line:
   - Check if contains temporal markers (time, date keywords)
   - If yes: parse as event → add to calendar with `pending: true`
   - If no: categorize as task (future implementation)
3. Save to storage
4. Show toast notification
5. Close modal

```javascript
async function submitQuickCapture() {
  const text = input.value.trim();
  if (!text) return;
  
  const lines = text.split('\n').filter(line => line.trim());
  let addedEvents = 0;
  
  for (const line of lines) {
    const hasTime = /\d{1,2}(:\d{2})?\s*(am|pm)|tomorrow|today|next|monday/i.test(line);
    
    if (hasTime) {
      const eventData = parseEventFromText(line);
      if (eventData) {
        events.push({
          id: Date.now() + addedEvents,
          ...eventData,
          pending: true,
          originalText: line
        });
        addedEvents++;
      }
    }
  }
  
  if (addedEvents > 0) {
    await saveEvents();
    renderCalendar();
  }
  
  showToast('✓ Event penciled in', `${addedEvents} events added`);
  closeQuickCapture();
}
```

#### `parseEventFromText(line)`
Extracts date, time, and title from natural language text.

**Parsing Rules:**
- **Time extraction:** Regex for "2pm", "14:00", "9:30am"
- **Date extraction:**
  - "today" → today's date
  - "tomorrow" → tomorrow's date
  - "next week" → 7 days from now
  - Day of week ("Monday", "Friday") → next occurrence of that day
- **Title extraction:** Remove date/time tokens from text

**Example:**
```javascript
Input: "Call mom tomorrow at 6pm about birthday plans"

Parse:
- Detect "tomorrow" → date = 2026-01-09
- Detect "6pm" → time = "18:00"
- Remove "tomorrow" and "6pm" → title = "Call mom about birthday plans"

Output: {
  title: "Call mom about birthday plans",
  date: "2026-01-09",
  time: "18:00"
}
```

**Limitations:**
- Simple regex-based parsing
- Doesn't handle complex phrases ("next Tuesday after lunch")
- No timezone handling
- No recurring event syntax

**Future Enhancement:**
Use Anthropic Claude API for natural language parsing:
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    system: `Parse this text into events. Extract title, date, time.
             Current date: ${new Date().toISOString()}`,
    messages: [{ role: 'user', content: capturedText }]
  })
});
```

---

### Calendar Rendering

#### `renderCalendar()`
Generates month grid with events.

**Algorithm:**
1. Get current month/year from `currentDate`
2. Calculate first day of month (for grid offset)
3. Calculate days in month
4. Build HTML:
   - Day headers (Sun-Sat)
   - Previous month overflow days (greyed)
   - Current month days
     - Highlight today
     - Render events for each day
     - Apply pending/confirmed styling
   - Next month overflow days (greyed)
5. Insert into DOM
6. Initialize Lucide icons

**Event Rendering:**
```javascript
const dayEvents = events.filter(e => e.date === dateStr);

dayEvents.forEach(event => {
  const pendingClass = event.pending ? 'pending' : '';
  const onclick = event.pending ? `onclick="openTriageModal(${event.id})"` : '';
  
  html += `<div class="event-pill ${pendingClass}" ${onclick}>
    ${escapeHtml(event.title)}
  </div>`;
});
```

**Styles:**
- **Pending:** Grey text, dotted border, clickable cursor
- **Confirmed:** White text, orange background, default cursor

---

### Triage Flow

#### `openTriageModal(eventId)`
Opens progressive disclosure modal for pending event.

```javascript
function openTriageModal(eventId) {
  currentTriageEvent = events.find(e => e.id === eventId);
  triageStep = 0;
  renderTriageStep();
  document.getElementById('triageModal').classList.add('open');
}
```

#### `renderTriageStep()`
Renders current triage question based on step.

**Steps:**
0. Location (Where will this be?)
1. Duration (How long?)
2. Buffer Time (Prep/travel?)
3. Reminders (Anything to remember?)

**Smart Suggestions:**
- Uses `userProfile` for context-aware suggestions
- Example: If profile mentions "take the bus", suggest travel buffer time
- Suggestion chips enable one-click answers

```javascript
function renderTriageStep() {
  const body = document.getElementById('triageBody');
  
  if (triageStep === 0) {
    body.innerHTML = `
      <div class="triage-label">Where will this be?</div>
      <input type="text" id="triageLocation">
      <div class="triage-suggestions">
        <div class="suggestion-chip" onclick="selectSuggestion('triageLocation', 'Office')">
          Office
        </div>
        <div class="suggestion-chip" onclick="selectSuggestion('triageLocation', 'Home')">
          Home
        </div>
      </div>
    `;
  }
  // ... other steps
}
```

#### `selectSuggestion(inputId, value)`
Fills input with suggested value and advances to next step.

```javascript
function selectSuggestion(inputId, value) {
  document.getElementById(inputId).value = value;
  setTimeout(nextTriageStep, 200); // Brief delay for UX feedback
}
```

#### `confirmEvent()`
Finalizes event with all gathered details.

```javascript
async function confirmEvent() {
  const event = events.find(e => e.id === currentTriageEvent.id);
  
  event.pending = false;
  event.location = document.getElementById('triageLocation')?.value || '';
  event.duration = document.getElementById('triageDuration')?.value || '';
  event.buffer = document.getElementById('triageBuffer')?.value || '';
  event.reminder = document.getElementById('triageReminder')?.value || '';
  
  // Build description string
  event.description = [
    event.location ? `📍 ${event.location}` : '',
    event.duration ? `⏱️ ${event.duration}` : '',
    event.buffer ? `🚌 ${event.buffer}` : '',
    event.reminder ? `📌 ${event.reminder}` : ''
  ].filter(Boolean).join(' • ');
  
  await saveEvents();
  renderCalendar();
  closeTriageModal();
  showToast('✓ Event confirmed', `${event.title} is on your calendar`);
}
```

---

### Profile System

#### Profile Auto-Extraction (Chat Integration)

When user interacts with chat, AI can extract profile data:

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  body: JSON.stringify({
    system: `You are a calendar assistant with access to user profile.
    
    USER PROFILE: ${JSON.stringify(userProfile, null, 2)}
    
    Extract profile information and return with profile_updates:
    {
      "action": "add_event",
      "event": {...},
      "profile_updates": {
        "core": { "name": "Rachel" },
        "people": { "Sarah": "best friend, meets downtown" }
      },
      "message": "Added lunch with Sarah"
    }`,
    messages: conversationHistory
  })
});
```

#### `updateProfile(updates)`
Merges new profile data with existing profile.

```javascript
function updateProfile(updates) {
  if (updates.core) {
    userProfile.core = { ...userProfile.core, ...updates.core };
  }
  if (updates.people) {
    userProfile.people = { ...userProfile.people, ...updates.people };
  }
  if (updates.goals) {
    updates.goals.forEach(goal => {
      if (!userProfile.goals.find(g => g.text === goal.text)) {
        userProfile.goals.push(goal);
      }
    });
  }
  saveProfile();
}
```

---

### Storage Layer

All data persists via `window.storage` (browser localStorage wrapper).

#### Storage Keys
- `calendar-events` → Array of event objects
- `all-notes` → Array of note objects
- `user-profile` → Profile object
- `quick-captures` → Array of capture objects

#### Storage Functions

```javascript
// Save events
async function saveEvents() {
  try {
    await window.storage.set('calendar-events', JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save events:', error);
  }
}

// Load events
async function loadEvents() {
  try {
    const result = await window.storage.get('calendar-events');
    if (result && result.value) {
      events = JSON.parse(result.value);
      renderCalendar();
    }
  } catch (error) {
    console.log('No existing events');
  }
}
```

**Storage Limits:**
- localStorage: ~5-10MB per origin (browser-dependent)
- Events: ~200 bytes each → ~25,000 events before hitting limits
- Notes: Variable, depends on content length
- Profile: ~10-20KB

**Error Handling:**
- Try-catch all storage operations
- Log errors to console
- Show user-friendly error messages (future)
- Implement storage quota warnings (future)

---

## State Management

### Global State Variables

```javascript
// Chat
let conversationHistory = [];      // Array of {role, content}
let chatStarted = false;           // Has user sent first message

// Calendar
let events = [];                   // Array of event objects
let currentDate = new Date();      // Month being viewed

// Notes
let notes = [];                    // Array of note objects
let activeNoteId = null;           // Currently open note

// Profile
let userProfile = {                // User profile object
  core: {},
  context: {},
  people: {},
  goals: [],
  // ... other sections
  updatedAt: null
};

// Quick Capture
let quickCaptureDemo = true;       // Demo mode flag

// Triage
let currentTriageEvent = null;     // Event being triaged
let triageStep = 0;                // Current triage step (0-3)
```

### View State
Controlled via CSS classes on `.app` container:
- `.view-chat` → Chat only
- `.view-split` → Chat 40% + Calendar 60%
- `.view-calendar` → Calendar only
- `.view-notes` → Notes only

```javascript
function setView(view) {
  const app = document.querySelector('.app');
  app.className = `app view-${view}`;
  
  // Update active button
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.view-btn').classList.add('active');
}
```

---

## API Integration

### Anthropic Claude API

**Endpoint:** `https://api.anthropic.com/v1/messages`  
**Model:** `claude-sonnet-4-20250514`  
**Authentication:** No API key in browser (handled server-side when deployed)

**Request Format:**
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 1500,
  system: "System prompt with context...",
  messages: [
    { role: "user", content: "User message" },
    { role: "assistant", content: "Assistant response" },
    // ... conversation history
  ]
}
```

**Response Format:**
```javascript
{
  content: [
    { type: "text", text: "Response text" }
  ]
}
```

**Usage in Sprekta:**
1. **Chat Feature:** User asks to add events conversationally
2. **Profile Extraction:** AI extracts user info from conversation
3. **Future: NLP Parsing:** Replace regex parser with AI parsing

**Rate Limiting:**
- Current: No limits (using user's API access)
- Production: Implement rate limiting per user
- Fallback: Disable chat if API unavailable, keep other features working

---

## Performance Optimizations

### Current Optimizations
1. **Debounced auto-save** on notes (future: currently instant)
2. **Lazy icon initialization** via `lucide.createIcons()` after DOM changes
3. **Event delegation** for calendar cell clicks (future enhancement)
4. **Minimal re-renders** - only update changed parts (future enhancement)

### Future Optimizations
1. **Virtual scrolling** for large note lists
2. **Memoization** of parsed event data
3. **Web Workers** for AI parsing (non-blocking)
4. **Service Worker** for offline support
5. **IndexedDB** migration from localStorage (larger storage limits)

---

## Security Considerations

### Current Implementation
- **Client-side only:** All data stays in browser
- **No backend:** No server-side vulnerabilities
- **localStorage:** Not encrypted, accessible to any script on same origin
- **XSS Protection:** Using `escapeHtml()` for user-generated content
- **API Keys:** Not hardcoded (future: env variables)

### Security Best Practices

#### 1. XSS Prevention
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;  // textContent auto-escapes
  return div.innerHTML;
}
```

Always use `escapeHtml()` when inserting user content into HTML:
```javascript
html += `<div>${escapeHtml(event.title)}</div>`;  // Safe
html += `<div>${event.title}</div>`;              // UNSAFE!
```

#### 2. Content Security Policy (Future)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://unpkg.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;">
```

#### 3. API Key Management
```javascript
// Don't do this:
const API_KEY = "sk-ant-xxxxx";  // NEVER hardcode!

// Do this:
const API_KEY = process.env.ANTHROPIC_API_KEY;  // Env variable
```

For production, move API calls to backend:
```
Browser → Backend Proxy → Anthropic API
         (with API key)
```

#### 4. Data Encryption (Future)
Encrypt sensitive data before storing:
```javascript
async function saveProfile() {
  const encrypted = await encryptData(userProfile);
  await window.storage.set('user-profile', encrypted);
}
```

---

## Testing Strategy

### Current Testing
- Manual testing only
- Developer (Rachel) dogfooding

### Future Testing

#### Unit Tests (Jest)
```javascript
describe('parseEventFromText', () => {
  test('parses tomorrow at 2pm', () => {
    const result = parseEventFromText('lunch tomorrow at 2pm');
    expect(result.title).toBe('lunch');
    expect(result.time).toBe('14:00');
  });
  
  test('handles no time specified', () => {
    const result = parseEventFromText('lunch tomorrow');
    expect(result.time).toBe('09:00'); // Default
  });
});
```

#### Integration Tests (Cypress)
```javascript
describe('Quick Capture Flow', () => {
  it('captures and stages an event', () => {
    cy.visit('/');
    cy.get('.quick-capture-btn').click();
    cy.get('.quick-capture-input').type('Team meeting tomorrow at 10am');
    cy.get('.quick-capture-action.primary').click();
    
    cy.get('.toast').should('contain', 'Event penciled in');
    cy.get('.event-pill.pending').should('exist');
  });
});
```

#### E2E Tests
1. User captures event → Appears on calendar as pending
2. User clicks pending event → Triage modal opens
3. User completes triage → Event becomes confirmed
4. User creates note → Note appears in sidebar
5. User switches views → State persists

---

## Deployment

### Build Process
Currently: No build process (single HTML file)

Future with tooling:
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build  # Outputs to /dist

# Deploy
npm run deploy
```

### Hosting Options

#### Option 1: Vercel (Recommended)
```bash
vercel --prod
```
- **Pros:** Free tier, auto HTTPS, CDN, preview deploys
- **Cons:** Serverless functions needed for API proxy

#### Option 2: Netlify
```bash
netlify deploy --prod
```
- **Pros:** Similar to Vercel, generous free tier
- **Cons:** Same - needs serverless functions

#### Option 3: GitHub Pages
```bash
git push origin main
```
- **Pros:** Free, simple, version controlled
- **Cons:** No server-side logic, API keys exposed

#### Option 4: Custom Domain
```bash
# Build and upload to S3 + CloudFront
aws s3 sync dist/ s3://sprekta.com
aws cloudfront create-invalidation
```

### Environment Variables
```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-xxxxx
ENVIRONMENT=production
```

**Access in code:**
```javascript
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
```

---

## Monitoring & Analytics

### Error Tracking (Future)
```javascript
window.onerror = function(msg, url, lineNo, columnNo, error) {
  // Send to error tracking service (Sentry, LogRocket, etc.)
  trackError({
    message: msg,
    stack: error?.stack,
    url: url,
    line: lineNo,
    user: getUserId()
  });
};
```

### Performance Monitoring
```javascript
// Measure key interactions
performance.mark('capture-start');
submitQuickCapture();
performance.mark('capture-end');
performance.measure('capture-duration', 'capture-start', 'capture-end');

const measure = performance.getEntriesByName('capture-duration')[0];
console.log(`Capture took ${measure.duration}ms`);
```

### User Analytics (Privacy-Respecting)
Track key metrics without PII:
- Events created per week
- Triage completion rate
- View usage distribution
- Feature adoption

```javascript
// Use Plausible or Simple Analytics (privacy-focused)
plausible('event', {
  name: 'Event Created',
  props: { pending: true }
});
```

---

## Accessibility

### Current Implementation
- Semantic HTML (`<button>`, `<input>`, etc.)
- Lucide icons with aria-labels (future)
- Keyboard navigation (partial)

### WCAG 2.1 AA Compliance (Future)

#### Keyboard Navigation
```javascript
// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    openQuickCapture();
  }
});
```

#### Screen Reader Support
```html
<button 
  class="quick-capture-btn"
  aria-label="Open quick capture to jot down thoughts"
  onclick="openQuickCapture()">
  <i data-lucide="pencil" aria-hidden="true"></i>
  Jot it down
</button>
```

#### Focus Management
```javascript
// Trap focus in modal
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, input, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}
```

#### Color Contrast
All text meets WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Interactive elements: Clear focus indicators

---

## Known Issues & Limitations

### MVP Limitations
1. **Single-user only:** No multi-user support or sharing
2. **No recurring events:** Each event is one-time
3. **No reminders:** Events don't trigger notifications
4. **Local storage only:** Data not synced across devices
5. **No calendar integrations:** Can't import/export to Google Calendar, etc.
6. **Simple NLP:** Regex-based parsing misses complex phrasing
7. **No offline support:** Requires internet for AI features
8. **No mobile app:** Web-only
9. **No undo/redo:** Destructive actions can't be reversed
10. **No search:** Can't search events or notes

### Known Bugs
1. **Date parsing edge cases:** "next Monday" might calculate wrong if today is Monday
2. **Timezone issues:** No timezone handling, assumes local time
3. **Storage limits:** No warning when approaching localStorage limits
4. **Modal z-index conflicts:** Multiple modals can overlap
5. **Mobile keyboard:** Keyboard might cover input on some devices

### Technical Debt
1. **Single file monolith:** Should be split into modules
2. **No type safety:** Plain JS, should migrate to TypeScript
3. **Manual DOM manipulation:** Should use framework (React, Vue) for complex state
4. **Inline styles:** CSS should be extracted to separate file
5. **No build system:** Should use Vite, Webpack, or similar
6. **Hardcoded strings:** Should use i18n for internationalization

---

## Future Technical Improvements

### Phase 1: Foundation
1. **Migrate to TypeScript** - Type safety, better IDE support
2. **Add build system (Vite)** - Fast dev server, hot reload, optimized builds
3. **Split into modules** - Separate concerns (views, state, API, utils)
4. **Implement proper state management** - Zustand, Redux, or similar
5. **Add unit tests** - Jest for business logic

### Phase 2: Features
1. **IndexedDB migration** - Larger storage limits, better performance
2. **Service Worker** - Offline support, background sync
3. **Web Push Notifications** - Event reminders
4. **AI-powered parsing** - Replace regex with Claude API calls
5. **Recurring events** - Support for repeating patterns

### Phase 3: Scale
1. **Backend API** - User authentication, cloud sync
2. **React Native app** - Native mobile experience
3. **Real-time sync** - WebSocket for multi-device sync
4. **Collaboration features** - Shared calendars, team features
5. **Advanced analytics** - Usage patterns, productivity insights

---

## API Reference (Internal)

### Quick Capture API

#### `openQuickCapture()`
Opens the quick capture modal.

**Parameters:** None  
**Returns:** Void  
**Side Effects:** Sets modal visibility, focuses input

#### `submitQuickCapture()`
Processes and saves captured text.

**Parameters:** None (reads from DOM input)  
**Returns:** `Promise<void>`  
**Side Effects:** 
- Parses text into events
- Adds events to global `events` array
- Saves to storage
- Shows toast notification
- Closes modal

#### `parseEventFromText(line: String)`
Extracts event data from natural language text.

**Parameters:**
- `line` (String): Single line of text to parse

**Returns:** `Object | null`
```javascript
{
  title: String,   // Event name
  date: String,    // ISO date "YYYY-MM-DD"
  time: String     // 24-hour time "HH:MM"
}
```

**Returns `null` if:** No date could be extracted

### Calendar API

#### `renderCalendar()`
Renders calendar grid for current month.

**Parameters:** None (uses global `currentDate`)  
**Returns:** Void  
**Side Effects:** Updates DOM (#calendarGrid)

#### `changeMonth(delta: Number)`
Navigates to different month.

**Parameters:**
- `delta` (Number): Months to add/subtract (-1 = previous, +1 = next)

**Returns:** Void  
**Side Effects:** Updates `currentDate`, re-renders calendar

### Triage API

#### `openTriageModal(eventId: Number)`
Opens triage modal for pending event.

**Parameters:**
- `eventId` (Number): ID of event to triage

**Returns:** Void  
**Side Effects:** Sets `currentTriageEvent`, renders first step, shows modal

#### `confirmEvent()`
Finalizes event after triage.

**Parameters:** None (uses global `currentTriageEvent`)  
**Returns:** `Promise<void>`  
**Side Effects:**
- Updates event object with triage details
- Sets `pending: false`
- Saves to storage
- Re-renders calendar
- Closes modal
- Shows success toast

### Storage API

#### `saveEvents()`
Persists events to localStorage.

**Parameters:** None (uses global `events`)  
**Returns:** `Promise<void>`  
**Throws:** Error if storage fails

#### `loadEvents()`
Loads events from localStorage.

**Parameters:** None  
**Returns:** `Promise<void>`  
**Side Effects:** Updates global `events`, renders calendar

---

## Glossary

**Capture:** Act of jotting down thoughts without structure  
**Staging:** Events added to calendar with pending status  
**Triage:** Process of confirming and enriching pending events  
**Progressive Disclosure:** Asking questions one at a time  
**Profile:** User context data (identity, patterns, preferences)  
**Pattern Learning:** System observing user behavior to improve suggestions  
**Penciled In:** Visual state of pending events (grey, dotted)  
**Quick Capture:** The jot-down feature (button + modal)  
**Toast:** Temporary notification (bottom-left)  
**Suggestion Chip:** One-click answer option in triage

---

## Contributing

### Code Style
- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Naming:**
  - Variables: camelCase (`eventTitle`)
  - Functions: camelCase (`parseEvent`)
  - Constants: UPPER_SNAKE (`API_KEY`)
  - CSS classes: kebab-case (`quick-capture-btn`)

### Commit Messages
```
feat: Add voice capture to quick input
fix: Correct date parsing for "next Monday"
docs: Update API documentation
refactor: Extract event parser to separate module
test: Add unit tests for parseEventFromText
```

### Pull Request Process
1. Create feature branch: `git checkout -b feature/voice-capture`
2. Make changes with clear commits
3. Test manually (future: run test suite)
4. Update documentation if needed
5. Submit PR with description of changes
6. Address review feedback
7. Merge to main after approval

---

## Support & Contact

**Product Owner:** Rachel Ramkhelawan  
**Repository:** (To be added)  
**Documentation:** This file + Sprekta_PRD.md  

**For Questions:**
- Check existing documentation first
- Review code comments
- Open GitHub issue (future)

---

## Version History

- **v1.0** (January 2026): Initial technical documentation
- **v1.1** (TBD): Updates after beta testing

---

**Document Owner:** Rachel Ramkhelawan  
**Last Updated:** January 8, 2026  
**Status:** Complete - Ready for Development Reference
