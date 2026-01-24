import AuthState from './auth-state.js';

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
    if (!AuthState.isLoggedIn()) {
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
      const token = await AuthState.getAccessToken();

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
      const token = await AuthState.getAccessToken();
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
