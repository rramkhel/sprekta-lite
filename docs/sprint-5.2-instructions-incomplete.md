# Sprint 5.2: New Conversation Button

## Goal

Add a "New conversation" button to the chat panel header. Clears localStorage and resets the chat while keeping persistence for normal use.

---

## Files to Modify

```
js/triage-ui.js    ← Add button to header, add clear handler
style.css          ← Button styling (minimal)
```

---

## Task 1: Add Button to Header

**File:** `js/triage-ui.js`

Find the chat header render (likely in `render()` or similar). Add a "New" button:

```javascript
// Find the header section, should look something like:
<div class="chat-header">
  <button class="chat-close">×</button>
  <h2>Planning</h2>
</div>

// Change to:
<div class="chat-header">
  <button class="chat-close" title="Close">×</button>
  <h2>Planning</h2>
  <button class="chat-new" title="New conversation">+ New</button>
</div>
```

---

## Task 2: Add Click Handler

**File:** `js/triage-ui.js`

In `bindEvents()` or wherever click handlers are attached:

```javascript
// Add handler for new conversation button
this.container.querySelector('.chat-new')?.addEventListener('click', () => {
  this.clearConversation();
});
```

Add the `clearConversation` method:

```javascript
clearConversation() {
  // Clear localStorage
  localStorage.removeItem('sprekta-chat-messages');
  localStorage.removeItem('sprekta-chat-profile');
  // Or whatever keys are used - check current implementation

  // Reset state
  TriageState.clear();
  TriageState.start();

  // Re-render empty chat
  this.render();
}
```

---

## Task 3: Style the Button

**File:** `style.css`

```css
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  /* ... existing styles ... */
}

.chat-header h2 {
  flex: 1; /* Push button to the right */
}

.chat-new {
  background: transparent;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chat-new:hover {
  background: var(--bg-hover, #f5f5f5);
  border-color: var(--border-hover, #ccc);
  color: var(--text-primary, #333);
}
```

---

## Testing Checklist

- [ ] "New" button visible in chat header
- [ ] Clicking "New" clears the conversation
- [ ] Chat shows empty state after clear
- [ ] localStorage is actually cleared (check DevTools)
- [ ] New messages after clear work normally
- [ ] Closing and reopening panel shows empty state (not old messages)

---

## Commit

```bash
git add js/triage-ui.js style.css
git commit -m "feat: add New Conversation button (Sprint 5.2)

- Clear button in chat header
- Clears localStorage and resets state
- Re-renders empty chat"
```
