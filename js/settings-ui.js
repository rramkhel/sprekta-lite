import AuthState from './auth-state.js';

const API_BASE = '/api/profile';

const SettingsUI = {
  container: null,
  profile: null,
  currentTab: 'account', // 'account' | 'profile'

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  async open(tab = 'account') {
    if (!AuthState.isLoggedIn()) {
      alert('Please sign in to access settings');
      return;
    }

    this.currentTab = tab;
    this.container.classList.remove('hidden');

    // Load profile data
    await this.loadProfile();
    this.render();
  },

  close() {
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
      this.showToast('Profile saved successfully');

      return true;
    } catch (error) {
      console.error('Failed to save profile:', error);
      this.showToast('Failed to save profile', 'error');
      return false;
    }
  },

  render() {
    const user = AuthState.getUser();
    const p = this.profile || {};

    this.container.innerHTML = `
      <div class="settings-page">
        <div class="settings-header">
          <button class="settings-back">← Back</button>
          <h2>Settings</h2>
        </div>

        <div class="settings-tabs">
          <button class="settings-tab ${this.currentTab === 'account' ? 'active' : ''}" data-tab="account">
            Account
          </button>
          <button class="settings-tab ${this.currentTab === 'profile' ? 'active' : ''}" data-tab="profile">
            Profile
          </button>
        </div>

        <div class="settings-content">
          ${this.currentTab === 'account' ? this.renderAccountTab(user) : this.renderProfileTab(p)}
        </div>
      </div>
    `;

    this.bindEvents();
  },

  renderAccountTab(user) {
    const createdAt = user?.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Unknown';

    return `
      <div class="settings-section">
        <h3>Account Information</h3>
        <div class="settings-field">
          <label>Email</label>
          <div class="settings-value">${user?.email || 'Unknown'}</div>
        </div>
        <div class="settings-field">
          <label>Member since</label>
          <div class="settings-value">${createdAt}</div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Change Password</h3>
        <form id="password-form" class="settings-form">
          <div class="form-group">
            <label for="new-password">New password</label>
            <input type="password" id="new-password" minlength="8" required placeholder="At least 8 characters" />
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm password</label>
            <input type="password" id="confirm-password" required />
          </div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>

      <div class="settings-section settings-danger">
        <h3>Danger Zone</h3>
        <p>Permanently delete your account and all data.</p>
        <button class="btn btn-danger" id="delete-account-btn">Delete Account</button>
      </div>
    `;
  },

  renderProfileTab(p) {
    return `
      <div class="settings-section">
        <h3>Your Profile</h3>
        <p class="settings-hint">Help the AI give you personalized planning advice by sharing your preferences and patterns.</p>
      </div>

      <form id="profile-form" class="settings-form">
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

        <button type="submit" class="btn btn-primary">Save Profile</button>
      </form>
    `;
  },

  bindEvents() {
    // Back button
    this.container.querySelector('.settings-back')?.addEventListener('click', () => this.close());

    // Tab buttons
    this.container.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.tab;
        this.render();
      });
    });

    // Password form
    this.container.querySelector('#password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handlePasswordChange();
    });

    // Delete account
    this.container.querySelector('#delete-account-btn')?.addEventListener('click', async () => {
      await this.handleDeleteAccount();
    });

    // Profile form
    this.container.querySelector('#profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleProfileSave();
    });
  },

  async handlePasswordChange() {
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;

    if (newPassword !== confirmPassword) {
      this.showToast('Passwords do not match', 'error');
      return;
    }

    try {
      await AuthState.updatePassword(newPassword);
      this.showToast('Password updated successfully');
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
    } catch (error) {
      this.showToast(error.message || 'Failed to update password', 'error');
    }
  },

  async handleDeleteAccount() {
    const confirmed = prompt('Type DELETE to permanently delete your account:');

    if (confirmed !== 'DELETE') {
      return;
    }

    try {
      const token = await AuthState.getAccessToken();

      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      await AuthState.signOut();
      this.close();
      this.showToast('Account deleted');

    } catch (error) {
      this.showToast(error.message || 'Failed to delete account', 'error');
    }
  },

  async handleProfileSave() {
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

    const saveBtn = this.container.querySelector('#profile-form button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const success = await this.saveProfile(profileData);

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Profile';
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

  showToast(message, type = 'success') {
    // Remove existing
    document.querySelector('.auth-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = `auth-toast auth-toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="auth-toast-close">×</button>
    `;

    document.body.appendChild(toast);

    // Auto dismiss
    setTimeout(() => toast.remove(), 4000);

    // Manual dismiss
    toast.querySelector('.auth-toast-close').addEventListener('click', () => toast.remove());
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

export default SettingsUI;
