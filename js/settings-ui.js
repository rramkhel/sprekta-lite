import AuthState from './auth-state.js';

const API_BASE = '/api/profile';

const SettingsUI = {
  container: null,
  profile: null,
  currentTab: 'account', // 'account' | 'profile' | 'projects'
  editingProfile: false,
  editingProjects: false,

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
          <button class="settings-tab ${this.currentTab === 'projects' ? 'active' : ''}" data-tab="projects">
            Projects
          </button>
        </div>

        <div class="settings-content">
          ${this.currentTab === 'account' ? this.renderAccountTab(user) :
            this.currentTab === 'profile' ? this.renderProfileTab(p) : this.renderProjectsTab(p)}
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
    const content = p.about_me || '';
    const isEmpty = !content.trim();

    if (this.editingProfile) {
      return `
        <div class="settings-section">
          <div class="settings-section-header">
            <h3>Your Profile</h3>
            <div class="settings-actions">
              <button class="btn btn-secondary" id="cancel-profile-btn">Cancel</button>
              <button class="btn btn-primary" id="save-profile-btn">Save</button>
            </div>
          </div>
          <p class="settings-hint">Use markdown to format your profile. Include your preferences, patterns, priorities, and anything else the AI should know about you.</p>
        </div>
        <textarea id="profile-editor" class="markdown-editor" placeholder="# About Me&#10;&#10;## Patterns & Preferences&#10;- Morning person&#10;- Need 15min buffer between meetings&#10;&#10;## Priorities&#10;1. Family time&#10;2. Exercise&#10;&#10;## Red Flags&#10;Things I tend to mess up or forget...">${this.escapeHtml(content)}</textarea>
      `;
    } else {
      return `
        <div class="settings-section">
          <div class="settings-section-header">
            <h3>Your Profile</h3>
            <button class="btn btn-primary" id="edit-profile-btn">Edit</button>
          </div>
        </div>
        <div class="markdown-view" id="profile-view">
          ${isEmpty ? '<p class="text-muted">No profile yet. Click Edit to add your preferences, patterns, and priorities.</p>' : marked.parse(content)}
        </div>
      `;
    }
  },

  renderProjectsTab(p) {
    const content = p.projects || '';
    const isEmpty = !content.trim();

    if (this.editingProjects) {
      return `
        <div class="settings-section">
          <div class="settings-section-header">
            <h3>Projects</h3>
            <div class="settings-actions">
              <button class="btn btn-secondary" id="cancel-projects-btn">Cancel</button>
              <button class="btn btn-primary" id="save-projects-btn">Save</button>
            </div>
          </div>
          <p class="settings-hint">Use markdown to track your active projects and goals.</p>
        </div>
        <textarea id="projects-editor" class="markdown-editor" placeholder="# Active Projects&#10;&#10;## Project Name&#10;- Goal or objective&#10;- Current status&#10;- Next steps&#10;&#10;## Another Project&#10;- Description...">${this.escapeHtml(content)}</textarea>
      `;
    } else {
      return `
        <div class="settings-section">
          <div class="settings-section-header">
            <h3>Projects</h3>
            <button class="btn btn-primary" id="edit-projects-btn">Edit</button>
          </div>
        </div>
        <div class="markdown-view" id="projects-view">
          ${isEmpty ? '<p class="text-muted">No projects yet. Click Edit to add your active projects and goals.</p>' : marked.parse(content)}
        </div>
      `;
    }
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

    // Profile edit/save/cancel
    this.container.querySelector('#edit-profile-btn')?.addEventListener('click', () => {
      this.editingProfile = true;
      this.render();
    });

    this.container.querySelector('#save-profile-btn')?.addEventListener('click', async () => {
      await this.handleProfileSave();
    });

    this.container.querySelector('#cancel-profile-btn')?.addEventListener('click', () => {
      this.editingProfile = false;
      this.render();
    });

    // Projects edit/save/cancel
    this.container.querySelector('#edit-projects-btn')?.addEventListener('click', () => {
      this.editingProjects = true;
      this.render();
    });

    this.container.querySelector('#save-projects-btn')?.addEventListener('click', async () => {
      await this.handleProjectsSave();
    });

    this.container.querySelector('#cancel-projects-btn')?.addEventListener('click', () => {
      this.editingProjects = false;
      this.render();
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
    const content = document.getElementById('profile-editor').value;

    const saveBtn = this.container.querySelector('#save-profile-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const success = await this.saveProfile({ about_me: content });

    if (success) {
      this.editingProfile = false;
      this.render();
    } else {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  },

  async handleProjectsSave() {
    const content = document.getElementById('projects-editor').value;

    const saveBtn = this.container.querySelector('#save-projects-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const success = await this.saveProfile({ projects: content });

    if (success) {
      this.editingProjects = false;
      this.render();
    } else {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
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
