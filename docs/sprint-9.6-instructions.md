# Sprint 9.6: Polish & Integration

## Sprint Goal

End-to-end testing, edge case handling, mobile optimization, and final polish. Ensure all Milestone 9 pieces work together seamlessly.

---

## What We've Built

| Sprint | Feature |
|--------|---------|
| 9.1 | Three-panel layout |
| 9.2 | Capture classification |
| 9.3 | Triage panel UI |
| 9.4 | Ghost events |
| 9.5 | Decay system + Admin |

Now we connect everything and polish.

---

## Task 1: End-to-End Flow Testing

### 1.1 Complete Event Flow

Test this sequence:

1. **Capture:** Type "dentist tuesday 3pm"
2. **Classification:** AI identifies as complete event
3. **Calendar:** Event appears immediately (solid)
4. **Triage:** Shows in "While You Were Away" as ✓
5. **Session summary:** "added to calendar"

**Verify:**
- [ ] Event has correct date/time
- [ ] No ghost styling
- [ ] Capture status = "scheduled"
- [ ] Capture.event_id links to event

### 1.2 Incomplete Event Flow

Test this sequence:

1. **Capture:** Type "dentist next week"
2. **Classification:** AI identifies as incomplete event
3. **Calendar:** Ghost event appears (dotted)
4. **Triage:** Shows in "Needs Attention"
5. **Session summary:** Shows ⚠ "needs a time"
6. **Resolution:** Click ghost → set date/time → confirm
7. **Calendar:** Event becomes solid
8. **Triage:** Removed from "Needs Attention"

**Verify:**
- [ ] Ghost styling correct
- [ ] Resolve modal works
- [ ] Capture status transitions: pending → ghost → resolved
- [ ] Event.is_ghost changes from true to false

### 1.3 Todo Flow

Test this sequence:

1. **Capture:** Type "buy batteries"
2. **Classification:** AI identifies as timeless todo
3. **Backlog:** Appears in backlog section
4. **Decay:** decay_at set (14 days)
5. **Admin:** Shows in captures table

**Verify:**
- [ ] No calendar event created
- [ ] Capture.status = "backlog"
- [ ] Decay date set correctly
- [ ] Shows in collapsed backlog

### 1.4 Deadline Todo Flow

1. **Capture:** Type "call mom before thanksgiving"
2. **Classification:** AI identifies deadline
3. **Triage:** As deadline approaches, shows in "Needs Attention"
4. **Resolution:** Click resolve → schedule time

**Verify:**
- [ ] has_deadline = true
- [ ] parsed_data.deadline set
- [ ] Shows urgency text ("X days left")

### 1.5 Reference Flow

1. **Capture:** Type "sarah bday march 15"
2. **Classification:** AI identifies as reference
3. **Calendar:** Annual event created (all-day)

**Verify:**
- [ ] Event is all-day
- [ ] Recurrence = annual (if supported)
- [ ] Capture status = scheduled

---

## Task 2: Edge Cases

### 2.1 Rapid Captures

User types multiple captures quickly:

```
> dentist tue 3pm
> buy milk
> sarah bday march 15
> call mom
```

**Verify:**
- [ ] All captured correctly
- [ ] No race conditions
- [ ] Session summary shows all 4
- [ ] Appropriate routing for each

### 2.2 Ambiguous Input

Test unclear captures:

| Input | Expected Handling |
|-------|-------------------|
| "meeting" | todo or ask for clarification |
| "tomorrow" | incomplete event (no title) |
| "important" | idea/unknown |
| "" (empty) | rejected |
| "!@#$%^" | rejected or unknown |

### 2.3 Date Edge Cases

| Input | Expected |
|-------|----------|
| "dentist feb 30" | AI should handle invalid date |
| "meeting yesterday" | Past date handling |
| "dinner in 2027" | Far future |
| "event on mon" | Next Monday |

### 2.4 Panel State Edge Cases

- [ ] All panels closed → calendar full width
- [ ] Resize window → panels adapt
- [ ] Refresh page → panel state restored
- [ ] Very narrow window → mobile layout kicks in

### 2.5 Offline/Error Handling

- [ ] Network error during capture → error message shown
- [ ] API timeout → graceful degradation
- [ ] Auth expired → redirect to login

---

## Task 3: Error Handling Improvements

**File:** `js/capture-processor.js` (update)

```javascript
async process(text) {
  if (!text?.trim()) {
    return { error: 'Empty capture', type: 'validation' };
  }

  try {
    showCaptureLoading();
    
    const classification = await this.classify(text);
    
    // Validate classification
    if (!classification || classification.error) {
      throw new Error(classification?.error || 'Classification failed');
    }

    const capture = await this.save(text, classification);
    const result = await this.route(capture, classification);

    addToCaptureSession({ raw_text: text, action: result.action, classification });
    
    return { capture, classification, result };

  } catch (error) {
    console.error('Capture processing failed:', error);
    
    // Still save the capture as "pending" for manual review
    try {
      const capture = await this.saveFailedCapture(text, error.message);
      return { 
        capture, 
        error: error.message, 
        type: 'processing',
        recoverable: true 
      };
    } catch (saveError) {
      return { 
        error: error.message, 
        type: 'critical',
        recoverable: false 
      };
    }
  } finally {
    hideCaptureLoading();
  }
}

async saveFailedCapture(text, errorMessage) {
  return fetch('/api/capture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthHeaders()
    },
    body: JSON.stringify({
      raw_text: text,
      capture_type: 'unknown',
      completeness: 'unknown',
      status: 'pending',
      parsed_data: { error: errorMessage }
    })
  }).then(r => r.json());
}
```

**File:** `app.js` (update feedback)

```javascript
function showCaptureFeedback(result) {
  if (result.error) {
    showToast(`Capture saved but needs review: ${result.error}`, 'warning');
    return;
  }

  switch (result.action) {
    case 'created_event':
      showToast('Added to calendar', 'success');
      break;
    case 'created_ghost':
      showToast('Saved — needs a time', 'info');
      // Auto-open triage panel
      PanelManager.open('triage');
      break;
    case 'created_annual':
      showToast('Annual event added', 'success');
      break;
    case 'added_to_backlog':
      showToast('Added to backlog', 'info');
      break;
    default:
      showToast('Captured', 'info');
  }
}
```

---

## Task 4: Mobile Optimization

**File:** `style.css` (update mobile styles)

```css
/* ============================================
   MOBILE: MILESTONE 9 SPECIFIC
   ============================================ */

@media (max-width: 768px) {
  /* Triage panel: full width slide-up */
  .panel-right {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: none;
    height: 60vh;
    border-radius: 16px 16px 0 0;
    border-left: none;
    border-top: 1px solid var(--border-color, #ddd);
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }

  .panel-right:not(.hidden) {
    transform: translateY(0);
  }

  /* Handle for dragging */
  .panel-right::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: var(--border-color, #ddd);
    border-radius: 2px;
  }

  /* Triage sections: more compact */
  .triage-section-header {
    font-size: 10px;
  }

  .triage-item-text {
    font-size: 13px;
  }

  /* Ghost resolver modal: full width */
  .ghost-resolver-content {
    width: 100%;
    max-width: none;
    margin: 0;
    border-radius: 16px 16px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }

  /* Admin panel: scrollable on mobile */
  .admin-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  /* Very small: triage takes more space */
  .panel-right {
    height: 75vh;
  }

  /* Simplify triage */
  .triage-resolve-btn {
    padding: 8px;
  }

  .triage-resolve-icon {
    width: 22px;
    height: 22px;
  }
}
```

---

## Task 5: Performance Optimization

### 5.1 Debounce Rapid Captures

**File:** `app.js`

```javascript
let captureTimeout = null;
const captureQueue = [];

function handleQuickCaptureInput(text) {
  captureQueue.push(text);
  
  // Debounce to batch rapid inputs
  if (captureTimeout) clearTimeout(captureTimeout);
  
  captureTimeout = setTimeout(async () => {
    const batch = [...captureQueue];
    captureQueue.length = 0;
    
    for (const t of batch) {
      await handleQuickCapture(t);
    }
  }, 300);
}
```

### 5.2 Lazy Load Admin Panel

Only load admin code when needed:

```javascript
async function openAdminPanel() {
  if (!window.AdminPanel) {
    const module = await import('./js/admin-panel.js');
    module.default.init();
  }
  window.AdminPanel.open();
}
```

### 5.3 Cache Triage Data

**File:** `js/triage-manager.js`

```javascript
const CACHE_TTL = 30000; // 30 seconds
let lastFetch = 0;
let cachedData = null;

async refresh(force = false) {
  const now = Date.now();
  
  if (!force && cachedData && (now - lastFetch) < CACHE_TTL) {
    return cachedData;
  }

  // ... fetch logic ...

  lastFetch = now;
  cachedData = this.data;
}
```

---

## Task 6: Final Polish

### 6.1 Loading States

Add loading indicators:

```javascript
// Quick capture
showCaptureLoading() {
  document.getElementById('quick-capture-btn').classList.add('loading');
}

hideCaptureLoading() {
  document.getElementById('quick-capture-btn').classList.remove('loading');
}
```

```css
.loading {
  pointer-events: none;
  opacity: 0.6;
}

.loading::after {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-left: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 6.2 Empty States

Ensure all panels have meaningful empty states:

```javascript
// Triage - no items
<div class="triage-empty">
  <p>All clear! Nothing needs your attention.</p>
</div>

// Coming up - no events
<div class="triage-empty">
  <p>No upcoming events</p>
</div>
```

### 6.3 Keyboard Shortcuts

Document and implement:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus quick capture |
| `Cmd/Ctrl + J` | Toggle chat panel |
| `Cmd/Ctrl + ;` | Toggle triage panel |
| `Cmd/Ctrl + Shift + A` | Toggle admin panel |
| `Esc` | Close modal/panel |

```javascript
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey) {
    switch (e.key) {
      case 'k':
        e.preventDefault();
        document.getElementById('quick-capture-input')?.focus();
        break;
      case 'j':
        e.preventDefault();
        PanelManager.toggle('chat');
        break;
      case ';':
        e.preventDefault();
        PanelManager.toggle('triage');
        break;
    }
  }
  
  if (e.key === 'Escape') {
    // Close modals
    GhostResolver.close();
    AdminPanel.close();
  }
});
```

---

## Task 7: Documentation Update

Update docs to reflect new features:

**File:** `docs/APP-OVERVIEW.md` (update)

Add to Feature Overview:

```markdown
#### 7. **Quick Capture Triage System** (Milestone 9)
- **Automatic Classification**: AI categorizes captures (events, todos, references)
- **Ghost Events**: Incomplete events shown as tentative on calendar
- **Triage Panel**: Organized view of upcoming, attention-needed, and backlog items
- **Decay System**: Stale items auto-expire to keep calendar fresh
- **Session Summaries**: "While You Were Away" shows capture results
```

---

## Final Checklist

### Functionality
- [ ] Complete events → calendar immediately
- [ ] Incomplete events → ghost events
- [ ] Todos → backlog
- [ ] References → annual events
- [ ] Ghost resolution works
- [ ] Decay processes correctly
- [ ] Admin panel shows all data

### UI/UX
- [ ] Three panels toggle correctly
- [ ] Calendar adapts to width
- [ ] Triage has text-first design
- [ ] Loading states visible
- [ ] Empty states meaningful
- [ ] Modals close on backdrop/escape

### Mobile
- [ ] Panels slide up from bottom
- [ ] Touch interactions work
- [ ] No horizontal scroll
- [ ] Forms usable on small screens

### Edge Cases
- [ ] Rapid captures handled
- [ ] Network errors graceful
- [ ] Invalid input rejected
- [ ] Auth expiration handled

### Performance
- [ ] No janky animations
- [ ] Triage loads quickly
- [ ] Admin loads lazily
- [ ] Captures process < 2s

---

## Commit

```bash
git add .
git commit -m "feat: milestone 9 polish (Sprint 9.6)

- End-to-end flow verification
- Error handling improvements  
- Mobile optimization (slide-up panels)
- Performance (debounce, cache, lazy load)
- Loading states and empty states
- Keyboard shortcuts
- Documentation updates

Milestone 9 complete! 🎉"
```

---

## Milestone 9 Complete! 🎉

You now have:

| Feature | Status |
|---------|--------|
| Three-panel layout | ✅ |
| Capture classification | ✅ |
| Ghost events | ✅ |
| Triage panel | ✅ |
| Decay system | ✅ |
| Admin view | ✅ |
| Mobile optimized | ✅ |
| Error handling | ✅ |

**What's Next (Milestone 10+):**
- Personality-based adaptation
- Location-aware nudges
- Smart grouping ("errands trip")
- External capture (SMS, voice)
- Enrichment prompts (location, duration)
