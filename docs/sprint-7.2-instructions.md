# Sprint 7.2: Profile UI

## Goal

Create the profile editing interface. Users can set up their profile through a guided form or free-form text.

**Time Estimate:** ~2 hours

---

## Files to Create/Modify

```
js/
  profile-ui.js       ← NEW: Profile editing component

index.html            ← Add profile modal container
style.css             ← Profile form styles
```

---

## Task 1: Profile UI Component

**File:** `js/profile-ui.js` (REPLACE existing if present)

```javascript
import AuthUI from './auth-ui.js';

const API_BASE = '/api/profile';

const ProfileUI = {
  container: null,
  profile: null,
  isOpen: false,
  mode: 'view', // 'view' | 'edit'

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  async open() {
    if (!AuthUI.isLoggedIn()) {
      alert('Please sign in to manage your profile');
      return;
    }

    this.isOpen = true;
    this.container.classList.remove('hidden');

    await this.loadProfile();
    this.render();
  },

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  },

  async loadProfile() {
    try {
      const token = await AuthUI.getAccessToken();

      const response = await fetch(API_BASE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();
      this.profile = data.profile;

    } catch (error) {
      console.error('Failed to load profile:', error);
      this.profile = null;
    }
  },

  async saveProfile(profileData) {
    try {
      const token = await AuthUI.getAccessToken();
      const method = this.profile ? 'PUT' : 'POST';

      const response = await fetch(API_BASE, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error('Failed to save profile');

      const data = await response.json();
      this.profile = data.profile;
      this.mode = 'view';
      this.render();

      return true;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return false;
    }
  },

  render() {
    if (this.mode === 'edit') {
      this.renderEditForm();
    } else {
      this.renderView();
    }
    this.bindEvents();
  },

  renderView() {
    const p = this.profile;

    this.container.innerHTML = `
      <div class="profile-modal">
        <div class="profile-modal-content">
          <div class="profile-header">
            <h2>Your Profile</h2>
            <button class="profile-close">×</button>
          </div>

          ${p ? `
            <div class="profile-view">
              ${p.name ? `<h3 class="profile-name">${this.escapeHtml(p.name)}</h3>` : ''}

              ${p.patterns?.length ? `
                <div class="profile-section">
                  <h4>Patterns & Preferences</h4>
                  <ul>${p.patterns.map(x => `<li>${this.escapeHtml(x)}</li>`).join('')}</ul>
                </div>
              ` : ''}

              ${p.red_flags?.length ? `
                <div class="profile-section">
                  <h4>Red Flags</h4>
                  <ul>${p.red_flags.map(x => `<li>⚠️ ${this.escapeHtml(x)}</li>`).join('')}</ul>
                </div>
              ` : ''}

              ${p.key_people?.length ? `
                <div class="profile-section">
                  <h4>Key People</h4>
                  <ul>${p.key_people.map(x => `
                    <li>${this.escapeHtml(x.name)}${x.relationship ? ` (${this.escapeHtml(x.relationship)})` : ''}</li>
                  `).join('')}</ul>
                </div>
              ` : ''}

              ${p.priorities?.length ? `
                <div class="profile-section">
                  <h4>Priorities</h4>
                  <ol>${p.priorities.map(x => `<li>${this.escapeHtml(x)}</li>`).join('')}</ol>
                </div>
              ` : ''}

              ${p.notes ? `
                <div class="profile-section">
                  <h4>Notes</h4>
                  <p class="profile-notes">${this.escapeHtml(p.notes)}</p>
                </div>
              ` : ''}

              <button class="profile-edit-btn">Edit Profile</button>
            </div>
          ` : `
            <div class="profile-empty">
              <p>You haven't set up your profile yet.</p>
              <p>Your profile helps the AI give you personalized planning advice.</p>
              <button class="profile-create-btn">Create Profile</button>
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderEditForm() {
    const p = this.profile || {};

    this.container.innerHTML = `
      <div class="profile-modal">
        <div class="profile-modal-content">
          <div class="profile-header">
            <h2>${this.profile ? 'Edit' : 'Create'} Profile</h2>
            <button class="profile-close">×</button>
          </div>

          <form id="profile-form" class="profile-form">
            <div class="form-group">
              <label for="profile-name">Name</label>
              <input type="text" id="profile-name" value="${this.escapeHtml(p.name || '')}" placeholder="What should I call you?" />
            </div>

            <div class="form-group">
              <label for="profile-patterns">Patterns & Preferences</label>
              <p class="form-hint">One per line. E.g., "Morning person", "Need buffer time between meetings"</p>
              <textarea id="profile-patterns" rows="4" placeholder="Morning person&#10;Need 15min buffer between meetings&#10;Work best with music">${(p.patterns || []).join('\n')}</textarea>
            </div>

            <div class="form-group">
              <label for="profile-red-flags">Red Flags</label>
              <p class="form-hint">Things you tend to mess up or forget. I'll watch out for these.</p>
              <textarea id="profile-red-flags" rows="4" placeholder="Forget to eat when busy&#10;Overcommit to deadlines&#10;Underestimate travel time">${(p.red_flags || []).join('\n')}</textarea>
            </div>

            <div class="form-group">
              <label for="profile-people">Key People</label>
              <p class="form-hint">One per line. Format: "Name (relationship)" - e.g., "Sarah (partner)"</p>
              <textarea id="profile-people" rows="4" placeholder="Sarah (partner)&#10;Mom&#10;Alex (manager)">${(p.key_people || []).map(x => x.name + (x.relationship ? ` (${x.relationship})` : '')).join('\n')}</textarea>
            </div>

            <div class="form-group">
              <label for="profile-priorities">Priorities</label>
              <p class="form-hint">In order of importance. I'll protect these when scheduling.</p>
              <textarea id="profile-priorities" rows="4" placeholder="Family time&#10;Exercise&#10;Deep work in the morning">${(p.priorities || []).join('\n')}</textarea>
            </div>

            <div class="form-group">
              <label for="profile-notes">Additional Notes</label>
              <p class="form-hint">Anything else I should know about you.</p>
              <textarea id="profile-notes" rows="4" placeholder="Commute is 30 minutes. Kids have soccer practice Tuesdays...">${this.escapeHtml(p.notes || '')}</textarea>
            </div>

            <div class="profile-actions">
              <button type="button" class="profile-cancel-btn">Cancel</button>
              <button type="submit" class="profile-save-btn">Save Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Close button
    this.container.querySelector('.profile-close')?.addEventListener('click', () => this.close());

    // Edit button
    this.container.querySelector('.profile-edit-btn')?.addEventListener('click', () => {
      this.mode = 'edit';
      this.render();
    });

    // Create button
    this.container.querySelector('.profile-create-btn')?.addEventListener('click', () => {
      this.mode = 'edit';
      this.render();
    });

    // Cancel button
    this.container.querySelector('.profile-cancel-btn')?.addEventListener('click', () => {
      this.mode = 'view';
      this.render();
    });

    // Form submit
    this.container.querySelector('#profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSave();
    });
  },

  async handleSave() {
    const name = document.getElementById('profile-name').value.trim();
    const patterns = this.textareaToArray('profile-patterns');
    const redFlags = this.textareaToArray('profile-red-flags');
    const keyPeople = this.parseKeyPeople('profile-people');
    const priorities = this.textareaToArray('profile-priorities');
    const notes = document.getElementById('profile-notes').value.trim();

    const profileData = {
      name: name || null,
      patterns,
      redFlags,
      keyPeople,
      priorities,
      notes: notes || null
    };

    const saveBtn = this.container.querySelector('.profile-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const success = await this.saveProfile(profileData);

    if (!success) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Profile';
      alert('Failed to save profile. Please try again.');
    }
  },

  textareaToArray(id) {
    const value = document.getElementById(id).value;
    return value.split('\n').map(l => l.trim()).filter(Boolean);
  },

  parseKeyPeople(id) {
    const lines = this.textareaToArray(id);
    return lines.map(line => {
      const match = line.match(/^([^(]+)(?:\(([^)]+)\))?/);
      if (match) {
        return {
          name: match[1].trim(),
          relationship: match[2]?.trim() || null
        };
      }
      return { name: line, relationship: null };
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

export default ProfileUI;
```

---

## Task 2: Update index.html

Wire up the profile button (if not already done):

```html
<!-- Profile modal container (add if not present) -->
<div id="profile-container" class="hidden"></div>

<!-- In script section, update ProfileUI initialization -->
<script type="module">
  import ProfileUI from './js/profile-ui.js';

  ProfileUI.init('profile-container');

  // Profile button click
  document.getElementById('profile-btn')?.addEventListener('click', () => {
    ProfileUI.open();
  });
</script>
```

---

## Task 3: Profile Styles

**File:** `style.css`

Add these styles:

```css
/* ============================================
   PROFILE MODAL
   ============================================ */

.profile-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.profile-modal-content {
  background: #fff;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.profile-header h2 {
  margin: 0;
  font-size: 20px;
}

.profile-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
}

.profile-close:hover {
  color: #333;
}

/* Profile View */
.profile-view,
.profile-empty {
  padding: 24px;
}

.profile-name {
  margin: 0 0 20px;
  font-size: 24px;
}

.profile-section {
  margin-bottom: 20px;
}

.profile-section h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-section ul,
.profile-section ol {
  margin: 0;
  padding-left: 20px;
}

.profile-section li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.profile-notes {
  white-space: pre-wrap;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  margin: 0;
}

.profile-edit-btn,
.profile-create-btn {
  width: 100%;
  padding: 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

.profile-edit-btn:hover,
.profile-create-btn:hover {
  background: #5558e3;
}

/* Profile Empty State */
.profile-empty {
  text-align: center;
  padding: 40px 24px;
}

.profile-empty p {
  margin: 0 0 12px;
  color: #666;
}

/* Profile Form */
.profile-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.form-hint {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.profile-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.profile-cancel-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.profile-cancel-btn:hover {
  background: #f5f5f5;
}

.profile-save-btn {
  flex: 2;
  padding: 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.profile-save-btn:hover {
  background: #5558e3;
}

.profile-save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .profile-modal-content {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .profile-form .form-group label {
    font-size: 14px;
  }

  .profile-form .form-hint {
    font-size: 12px;
  }

  .profile-form input,
  .profile-form textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
```

---

## Checklist

- [ ] `js/profile-ui.js` created
- [ ] Profile button wired up in index.html
- [ ] Profile modal opens when clicked
- [ ] View mode shows profile data
- [ ] Edit mode shows form with all fields
- [ ] Form validates and saves to API
- [ ] Empty state shows "Create Profile" button
- [ ] Cancel returns to view mode
- [ ] Styles look good on desktop
- [ ] Mobile responsive

---

## Testing

1. Click "Profile" button → modal opens
2. If no profile → see "Create Profile" button
3. Click "Create Profile" → form appears
4. Fill in some fields → click "Save Profile"
5. Profile saves → view mode shows your data
6. Click "Edit Profile" → form appears with your data
7. Change something → click "Save Profile"
8. Profile updates → view mode shows changes
9. Click × to close modal

---

## Commit

```bash
git add js/profile-ui.js index.html style.css
git commit -m "feat: profile UI (Sprint 7.2)

- Profile view modal with structured display
- Profile edit form with guided fields
- Patterns, red flags, key people, priorities, notes
- Create and update flows
- Mobile responsive design"
```

---

Ready for Sprint 7.3 (Conversation History)!
