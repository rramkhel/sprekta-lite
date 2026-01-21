/**
 * Profile UI - Profile Management Page
 */

const ProfileUI = {
  container: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Profile container not found:', containerId);
      return;
    }
  },

  open() {
    this.container.classList.remove('hidden');
    document.querySelector('.app-container')?.classList.add('hidden');
    this.render();
  },

  close() {
    this.container.classList.add('hidden');
    document.querySelector('.app-container')?.classList.remove('hidden');
  },

  render() {
    const profile = localStorage.getItem('userProfile') || '';

    this.container.innerHTML = `
      <div class="profile-page">
        <div class="profile-header">
          <button class="profile-back">← Back</button>
          <h2>My Profile</h2>
          <div class="profile-actions-header">
            ${profile ? '<button id="delete-profile-btn" class="profile-btn-danger">Delete</button>' : ''}
          </div>
        </div>

        <div class="profile-content">
          <div class="profile-intro">
            <p>Your profile helps the AI give you personalized planning help.
               Include your schedule, patterns, key people, and any tendencies.</p>
          </div>

          <textarea
            id="profile-textarea"
            class="profile-textarea"
            placeholder="# My Profile

**Location:** Edmonton, Alberta
**Work Hours:** 8AM-1PM

## Patterns
- I avoid serious work at home
- I tend to be optimistic about timing
- I need recovery time after deadlines

## Key People
- Mom: Primary transportation
- Conner: Boyfriend, evening calls

## Red Flags
- Multiple deadlines same day = stress
- Sprekta keeps getting squeezed out"
          >${this.escapeHtml(profile)}</textarea>

          <div class="profile-actions">
            <button id="save-profile-btn" class="profile-btn-primary">Save Profile</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Back button
    this.container.querySelector('.profile-back')?.addEventListener('click', () => this.close());

    // Save button
    this.container.querySelector('#save-profile-btn')?.addEventListener('click', () => this.saveProfile());

    // Delete button
    this.container.querySelector('#delete-profile-btn')?.addEventListener('click', () => this.deleteProfile());
  },

  saveProfile() {
    const textarea = document.getElementById('profile-textarea');
    const profileText = textarea.value.trim();

    if (profileText) {
      localStorage.setItem('userProfile', profileText);
      this.showToast('Profile saved!');
    } else {
      localStorage.removeItem('userProfile');
      this.showToast('Profile cleared');
    }

    this.render();
  },

  deleteProfile() {
    if (confirm('Are you sure you want to delete your profile?')) {
      localStorage.removeItem('userProfile');
      this.showToast('Profile deleted');
      this.render();
    }
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'profile-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

export default ProfileUI;
