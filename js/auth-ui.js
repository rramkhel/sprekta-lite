import AuthState from './auth-state.js';

const AuthUI = {
  modalContainer: null,
  headerContainer: null,
  mode: 'signin', // 'signin' | 'signup' | 'forgot'
  isLoading: false,
  error: null,

  init(modalContainerId, headerContainerId) {
    this.modalContainer = document.getElementById(modalContainerId);
    this.headerContainer = document.getElementById(headerContainerId);

    // Show loading initially
    if (this.headerContainer) {
      this.headerContainer.innerHTML = `<div class="auth-loading"></div>`;
    }

    // Check for password reset callback
    this.handleResetCallback();

    // Update header on auth changes
    AuthState.onAuthChange((event, user) => {
      this.renderHeader();

      // Close modal on sign in
      if (event === 'SIGNED_IN') {
        this.closeModal();
      }
    });

    // Initial render (after auth init)
    this.renderHeader();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  },

  handleResetCallback() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('reset') === 'true') {
      // User came from password reset email
      // Supabase has already set the session
      // Show the change password form

      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);

      // Wait for auth to initialize, then open Settings to Account tab
      setTimeout(() => {
        if (AuthState.isLoggedIn()) {
          window.SettingsUI?.open('account');
          this.showToast('Enter your new password below');
        }
      }, 500);
    }
  },

  // ==================
  // HEADER
  // ==================

  renderHeader() {
    if (!this.headerContainer) return;

    if (AuthState.isLoggedIn()) {
      const email = AuthState.getEmail();
      const initial = email?.charAt(0).toUpperCase() || '?';

      this.headerContainer.innerHTML = `
        <div class="auth-user-menu">
          <button class="auth-user-trigger" id="auth-user-trigger">
            <span class="auth-avatar">${initial}</span>
            <span class="auth-email">${email}</span>
            <span class="auth-caret">▼</span>
          </button>
          <div class="auth-dropdown hidden" id="auth-dropdown">
            <button class="auth-dropdown-item" data-action="account">
              👤 Account
            </button>
            <div class="auth-dropdown-divider"></div>
            <button class="auth-dropdown-item auth-dropdown-signout" data-action="signout">
              🚪 Sign Out
            </button>
          </div>
        </div>
      `;

      this.bindHeaderEvents();
    } else {
      this.headerContainer.innerHTML = `
        <button class="auth-signin-btn" id="auth-signin-btn">Sign In</button>
      `;

      document.getElementById('auth-signin-btn')?.addEventListener('click', () => {
        this.openModal('signin');
      });
    }
  },

  bindHeaderEvents() {
    const trigger = document.getElementById('auth-user-trigger');
    const dropdown = document.getElementById('auth-dropdown');

    // Toggle dropdown
    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('hidden');
    });

    // Close on outside click
    document.addEventListener('click', () => {
      dropdown?.classList.add('hidden');
    });

    // Dropdown actions
    dropdown?.querySelectorAll('.auth-dropdown-item').forEach(item => {
      item.addEventListener('click', async () => {
        dropdown.classList.add('hidden');
        const action = item.dataset.action;

        if (action === 'account') {
          window.SettingsUI?.open('account');
        } else if (action === 'signout') {
          await this.handleSignOut();
        }
      });
    });
  },

  // ==================
  // SIGN IN / SIGN UP MODAL
  // ==================

  openModal(mode = 'signin') {
    this.mode = mode;
    this.error = null;
    this.isLoading = false;
    this.renderModal();
    this.modalContainer?.classList.remove('hidden');

    setTimeout(() => {
      this.modalContainer?.querySelector('input')?.focus();
    }, 100);
  },

  closeModal() {
    this.modalContainer?.classList.add('hidden');
  },

  renderModal() {
    if (!this.modalContainer) return;

    const content = this.mode === 'signup'
      ? this.renderSignUpForm()
      : this.mode === 'forgot'
        ? this.renderForgotForm()
        : this.renderSignInForm();

    this.modalContainer.innerHTML = `
      <div class="auth-backdrop" id="auth-backdrop"></div>
      <div class="auth-modal">
        <button class="auth-close" id="auth-close">×</button>
        ${content}
      </div>
    `;

    this.bindModalEvents();
  },

  renderSignInForm() {
    return `
      <div class="auth-header">
        <h2>Welcome back</h2>
        <p>Sign in to your account</p>
      </div>

      ${this.error ? `<div class="auth-error">${this.error}</div>` : ''}

      <form id="auth-form" class="auth-form">
        <div class="auth-field">
          <label for="auth-email">Email</label>
          <input type="email" id="auth-email" required autocomplete="email" />
        </div>

        <div class="auth-field">
          <label for="auth-password">Password</label>
          <input type="password" id="auth-password" required autocomplete="current-password" />
        </div>

        <button type="submit" class="auth-submit" ${this.isLoading ? 'disabled' : ''}>
          ${this.isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div class="auth-links">
        <a href="#" id="auth-forgot-link">Forgot password?</a>
      </div>

      <div class="auth-footer">
        Don't have an account? <a href="#" id="auth-signup-link">Sign up</a>
      </div>
    `;
  },

  renderSignUpForm() {
    return `
      <div class="auth-header">
        <h2>Create account</h2>
        <p>Get started with Sprekta</p>
      </div>

      ${this.error ? `<div class="auth-error">${this.error}</div>` : ''}

      <form id="auth-form" class="auth-form">
        <div class="auth-field">
          <label for="auth-email">Email</label>
          <input type="email" id="auth-email" required autocomplete="email" />
        </div>

        <div class="auth-field">
          <label for="auth-password">Password</label>
          <input type="password" id="auth-password" required minlength="8" autocomplete="new-password" />
          <span class="auth-hint">At least 8 characters</span>
        </div>

        <div class="auth-field">
          <label for="auth-password-confirm">Confirm password</label>
          <input type="password" id="auth-password-confirm" required autocomplete="new-password" />
        </div>

        <button type="submit" class="auth-submit" ${this.isLoading ? 'disabled' : ''}>
          ${this.isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div class="auth-footer">
        Already have an account? <a href="#" id="auth-signin-link">Sign in</a>
      </div>
    `;
  },

  renderForgotForm() {
    return `
      <div class="auth-header">
        <h2>Reset password</h2>
        <p>We'll email you a reset link</p>
      </div>

      ${this.error ? `<div class="auth-error">${this.error}</div>` : ''}

      <form id="auth-form" class="auth-form">
        <div class="auth-field">
          <label for="auth-email">Email</label>
          <input type="email" id="auth-email" required autocomplete="email" />
        </div>

        <button type="submit" class="auth-submit" ${this.isLoading ? 'disabled' : ''}>
          ${this.isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div class="auth-footer">
        <a href="#" id="auth-signin-link">Back to sign in</a>
      </div>
    `;
  },

  bindModalEvents() {
    // Close
    document.getElementById('auth-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('auth-backdrop')?.addEventListener('click', () => this.closeModal());

    // Form submit
    document.getElementById('auth-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Mode switches
    document.getElementById('auth-signup-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openModal('signup');
    });

    document.getElementById('auth-signin-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openModal('signin');
    });

    document.getElementById('auth-forgot-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openModal('forgot');
    });
  },

  async handleSubmit() {
    if (this.isLoading) return;

    const email = document.getElementById('auth-email')?.value?.trim();
    const password = document.getElementById('auth-password')?.value;
    const passwordConfirm = document.getElementById('auth-password-confirm')?.value;

    this.error = null;
    this.isLoading = true;
    this.renderModal();

    try {
      if (this.mode === 'signup') {
        if (password !== passwordConfirm) {
          throw new Error('Passwords do not match');
        }
        const result = await AuthState.signUp(email, password);
        if (result.needsConfirmation) {
          this.showSuccess('Check your email to confirm your account');
        }

      } else if (this.mode === 'forgot') {
        await AuthState.resetPassword(email);
        this.showSuccess('Check your email for the reset link');

      } else {
        await AuthState.signIn(email, password);
        // Modal closes automatically via auth listener
      }

    } catch (error) {
      this.error = this.friendlyError(error.message);
      this.isLoading = false;
      this.renderModal();
    }
  },

  showSuccess(message) {
    this.modalContainer.querySelector('.auth-modal').innerHTML = `
      <button class="auth-close" id="auth-close">×</button>
      <div class="auth-success">
        <div class="auth-success-icon">✓</div>
        <h2>Success</h2>
        <p>${message}</p>
        <button class="auth-submit" id="auth-success-close">Got it</button>
      </div>
    `;

    document.getElementById('auth-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('auth-success-close')?.addEventListener('click', () => this.closeModal());
  },

  friendlyError(message) {
    if (message.includes('Invalid login')) return 'Invalid email or password';
    if (message.includes('already registered')) return 'An account with this email already exists';
    if (message.includes('not confirmed')) return 'Please confirm your email first';
    return message;
  },

  // Toast notifications
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

  async handleSignOut() {
    try {
      await AuthState.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
};

export default AuthUI;
