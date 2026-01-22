# Sprint 7.4: Integration Polish

## Goal

Connect everything together. Auto-load profile into planning, generate conversation titles, polish mobile experience.

**Time Estimate:** ~1.5 hours

---

## Task 1: Auto-Generate Conversation Titles

**File:** `api/conversation/[id]/message.js`

After saving the first user message, generate a title. Add this code after saving the user message:

```javascript
// After saving user message, check if this is the first message
if (!existingMessages || existingMessages.length === 0) {
  // Generate title from first message
  const title = generateTitle(content);

  await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id);
}

// Add this helper function at the bottom of the file (outside the handler)
function generateTitle(content) {
  // Simple extraction: first 50 chars, clean up
  let title = content
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50);

  // Try to break at word boundary
  if (title.length === 50) {
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 30) {
      title = title.substring(0, lastSpace);
    }
    title += '...';
  }

  return title;
}
```

---

## Task 2: Profile Indicator in Chat Header

**File:** `js/triage-ui.js`

Update the `render()` method to show profile status. Replace the header section:

```javascript
render() {
  const messages = TriageState.getMessages();
  const hasProfile = !!TriageState.getProfile();

  this.panel.innerHTML = `
    <div class="chat-panel-header">
      <h3>Planning</h3>
      <div class="chat-header-actions">
        ${hasProfile ? `
          <span class="profile-badge" title="Using your profile">✓ Profile</span>
        ` : `
          <button class="chat-add-profile" title="Add profile for better help">+ Profile</button>
        `}
        <button class="chat-history" title="Past conversations">☰</button>
        <button class="chat-new" title="New conversation">+ New</button>
      </div>
      <button id="chat-panel-close" class="chat-panel-close">×</button>
    </div>

    <div class="chat-panel-messages" id="chat-messages">
      ${this.renderMessages(messages)}
    </div>

    <div class="chat-panel-input">
      <textarea
        id="chat-input"
        placeholder="What's on your mind?"
        rows="2"
      ></textarea>
      <button id="chat-send" class="chat-send-btn">Send</button>
    </div>
  `;

  this.bindEvents();
  this.scrollToBottom();
},
```

Then update `bindEvents()` to handle the new buttons:

```javascript
bindEvents() {
  // Close button
  document.getElementById('chat-panel-close')?.addEventListener('click', () => {
    this.close();
  });

  // Add profile button
  this.panel.querySelector('.chat-add-profile')?.addEventListener('click', async () => {
    const { default: ProfileUI } = await import('./profile-ui.js');
    ProfileUI.open();
  });

  // History button
  this.panel.querySelector('.chat-history')?.addEventListener('click', async () => {
    const { default: HistoryUI } = await import('./history-ui.js');
    HistoryUI.open();
  });

  // New conversation button
  this.panel.querySelector('.chat-new')?.addEventListener('click', async () => {
    if (confirm('Start a new conversation? Current conversation will be saved.')) {
      await TriageState.newConversation();
      this.render();
    }
  });

  // Send button
  document.getElementById('chat-send')?.addEventListener('click', () => {
    this.handleSend();
  });

  // Enter to send (shift+enter for newline)
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  });
},
```

---

## Task 3: Profile Setup Suggestion for New Users

**File:** `js/triage-ui.js`

Add this method to show a profile setup suggestion:

```javascript
showProfileSuggestion() {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  messagesContainer.insertAdjacentHTML('beforeend', `
    <div class="chat-profile-suggestion">
      <p>💡 <strong>Tip:</strong> Set up your profile for personalized planning help.</p>
      <button class="suggestion-setup-btn">Set Up Profile</button>
      <button class="suggestion-dismiss-btn">Maybe later</button>
    </div>
  `);

  messagesContainer.querySelector('.suggestion-setup-btn')?.addEventListener('click', async () => {
    const { default: ProfileUI } = await import('./profile-ui.js');
    ProfileUI.open();
    messagesContainer.querySelector('.chat-profile-suggestion')?.remove();
  });

  messagesContainer.querySelector('.suggestion-dismiss-btn')?.addEventListener('click', () => {
    messagesContainer.querySelector('.chat-profile-suggestion')?.remove();
  });
},
```

Then call it in the `open()` method after starting a conversation:

```javascript
async open() {
  // ... existing code ...

  try {
    // Start or resume conversation
    const data = await TriageState.start();
    this.render();

    // If logged in, no profile, and new conversation, suggest profile
    const { default: AuthUI } = await import('./auth-ui.js');
    if (AuthUI.isLoggedIn() && !TriageState.getProfile() && data.isNew) {
      this.showProfileSuggestion();
    }
  } catch (error) {
    this.renderError('Failed to load conversation');
  }
},
```

---

## Task 4: Add Chat Header Styles

**File:** `style.css`

Update chat header styles to support the new buttons:

```css
/* Update existing .chat-panel-header */
.chat-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
  gap: 12px;
}

.chat-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-badge {
  font-size: 11px;
  color: #34C759;
  background: #E8F9ED;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.chat-add-profile,
.chat-history,
.chat-new {
  font-size: 12px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #666;
}

.chat-add-profile:hover,
.chat-history:hover,
.chat-new:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

/* Profile suggestion */
.chat-profile-suggestion {
  background: #eef2ff;
  border: 1px solid #6366f1;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px;
}

.chat-profile-suggestion p {
  margin: 0 0 12px;
  font-size: 14px;
}

.suggestion-setup-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 8px;
  font-size: 14px;
}

.suggestion-setup-btn:hover {
  background: #5558e3;
}

.suggestion-dismiss-btn {
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  font-size: 14px;
}

.suggestion-dismiss-btn:hover {
  color: #333;
}
```

---

## Task 5: Mobile Improvements

**File:** `style.css`

Add/update mobile styles:

```css
/* ============================================
   MOBILE POLISH
   ============================================ */

@media (max-width: 640px) {
  /* Chat header compact */
  .chat-panel-header {
    padding: 12px 16px;
  }

  .chat-panel-header h3 {
    font-size: 15px;
  }

  .chat-header-actions {
    gap: 4px;
  }

  .profile-badge,
  .chat-add-profile,
  .chat-history,
  .chat-new {
    font-size: 11px;
    padding: 4px 8px;
  }

  /* Chat new button text hidden on mobile */
  .chat-new {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Profile suggestion */
  .chat-profile-suggestion {
    margin: 12px;
    padding: 12px;
  }

  .chat-profile-suggestion p {
    font-size: 13px;
  }

  .suggestion-setup-btn,
  .suggestion-dismiss-btn {
    font-size: 13px;
  }
}
```

---

## Task 6: Test the Complete Flow

Run through this complete user journey:

1. **First time user (anonymous)**
   - Opens chat → empty state
   - Sends first message → title auto-generated
   - Close and reopen → conversation resumes
   - Refresh page → new session (messages gone)

2. **Logged in user (no profile)**
   - Opens chat → profile suggestion appears
   - Clicks "Set Up Profile" → profile modal opens
   - Fills in profile → saves
   - Sends message → AI uses profile context
   - Profile badge shows in header

3. **Logged in user (with profile)**
   - Opens chat → profile badge visible
   - Clicks history → sees past conversations
   - Resumes old conversation → messages load
   - Archives conversation → moves to "Past"
   - Starts new conversation → clean slate

---

## Checklist

- [ ] Conversation titles auto-generated from first message
- [ ] Profile indicator shows in chat header
- [ ] "Add profile" button when no profile
- [ ] History button opens history panel
- [ ] "New" button starts fresh conversation
- [ ] Profile setup suggestion for new logged-in users
- [ ] Can dismiss profile suggestion
- [ ] Mobile styles work well
- [ ] Everything connects smoothly

---

## Testing Checklist

Test these scenarios:

**Anonymous User:**
- [ ] Can chat without account
- [ ] Conversation persists in same tab
- [ ] Refresh creates new session
- [ ] Title generated from first message

**Logged-In User (No Profile):**
- [ ] Profile suggestion appears
- [ ] Can set up profile
- [ ] Profile loads in AI context
- [ ] Profile badge appears after setup

**Logged-In User (With Profile):**
- [ ] Profile badge shows immediately
- [ ] Can view history
- [ ] Can resume past conversations
- [ ] Can archive conversations
- [ ] Can start new conversation

**Mobile:**
- [ ] All buttons accessible
- [ ] Forms work well
- [ ] History scrolls properly
- [ ] No layout breaks

---

## Commit

```bash
git add api/conversation/ js/triage-ui.js style.css
git commit -m "feat: integration polish (Sprint 7.4)

- Auto-generate conversation titles from first message
- Profile indicator badge in chat header
- History and new conversation buttons
- Profile setup suggestion for new users
- Mobile responsive improvements
- Complete user flow testing"
```

---

## Milestone 7 Complete! 🎉

You now have:
- ✅ Structured user profiles
- ✅ Profile editing UI
- ✅ Conversation history with resume
- ✅ Auto-generated titles
- ✅ Profile integration with AI
- ✅ Polished mobile experience

**What's next:**
- Milestone 8: Advanced features (search, sharing, analytics)
- Or: Focus on deployment and user testing
- Or: Build login/signup UI for Sprint 6.4

Great work!
