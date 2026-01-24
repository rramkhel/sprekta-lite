Perfect! Sprint 8.2 is complete! 🎉

  What we implemented:

  ✅ Account Modal - Shows user email and member since date✅ Change Password - Form to update password with validation✅
   Delete Account - Permanent deletion with "DELETE" confirmation✅ Toast Notifications - Success and error messages with
   auto-dismiss✅ API Endpoint - /api/account/delete.js for secure account deletion✅ Styles - Complete styling for
  account modal and toast notifications

  Ready for Testing

  The dev server is still running at http://localhost:3000. Here's what you can test:

  Account Modal:

  1. Sign in to your account
  2. Click your user menu in the header
  3. Click "👤 Account"
  4. Verify you see:
    - Your email address
    - Member since date
    - Change password form
    - Delete account button in danger zone

  Change Password:

  1. In the account modal, enter a new password (8+ chars)
  2. Confirm the password
  3. Click "Update Password"
  4. You should see a green success toast: "Password updated"
  5. Sign out and sign back in with your new password

  Delete Account:

  1. In the account modal, click "Delete Account"
  2. Type "DELETE" in the prompt (exact case)
  3. Account should be deleted, you'll be signed out
  4. You should see a success toast

  Toast Notifications:

  - Appear in top-right corner
  - Auto-dismiss after 4 seconds
  - Can be manually closed with × button
  - Green for success, red for errors



---


# Sprint 8.2: Account Modal + Password

## Goal

Account modal with info display, change password, and delete account.

---

## Task 1: Account Modal

**File:** `js/auth-ui.js`

Add the account modal methods to the existing AuthUI object:

```javascript
// Add to AuthUI object:

openAccountModal() {
  if (!AuthState.isLoggedIn()) return;

  this.renderAccountModal();
  this.modalContainer?.classList.remove('hidden');
},

renderAccountModal() {
  const user = AuthState.getUser();
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  this.modalContainer.innerHTML = `
    <div class="auth-backdrop" id="auth-backdrop"></div>
    <div class="auth-modal auth-account-modal">
      <button class="auth-close" id="auth-close">×</button>

      <div class="auth-header">
        <h2>Account</h2>
      </div>

      <div class="account-section">
        <div class="account-field">
          <label>Email</label>
          <div class="account-value">${user?.email || 'Unknown'}</div>
        </div>

        <div class="account-field">
          <label>Member since</label>
          <div class="account-value">${createdAt}</div>
        </div>
      </div>

      <div class="account-section">
        <h3>Change Password</h3>
        <form id="password-form" class="auth-form">
          <div class="auth-field">
            <label for="new-password">New password</label>
            <input type="password" id="new-password" minlength="8" required />
            <span class="auth-hint">At least 8 characters</span>
          </div>
          <div class="auth-field">
            <label for="confirm-password">Confirm password</label>
            <input type="password" id="confirm-password" required />
          </div>
          <button type="submit" class="auth-submit auth-submit-secondary">
            Update Password
          </button>
        </form>
      </div>

      <div class="account-section account-danger">
        <h3>Danger Zone</h3>
        <p>Permanently delete your account and all data.</p>
        <button class="auth-submit auth-submit-danger" id="delete-account-btn">
          Delete Account
        </button>
      </div>
    </div>
  `;

  this.bindAccountEvents();
},

bindAccountEvents() {
  // Close
  document.getElementById('auth-close')?.addEventListener('click', () => this.closeModal());
  document.getElementById('auth-backdrop')?.addEventListener('click', () => this.closeModal());

  // Password form
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await this.handlePasswordChange();
  });

  // Delete account
  document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
    await this.handleDeleteAccount();
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
    this.showToast('Password updated');
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
    this.closeModal();
    this.showToast('Account deleted');

  } catch (error) {
    this.showToast(error.message || 'Failed to delete account', 'error');
  }
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
}
```

---

## Task 2: Delete Account API

**File:** `api/account/delete.js` (NEW)

```javascript
import { createServiceClient } from '../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];

    // Verify user
    const supabaseAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const supabase = createServiceClient();

    // Delete user data (messages cascade from conversations)
    await supabase.from('conversations').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('user_id', user.id);

    // Delete auth user (requires service role)
    await supabase.auth.admin.deleteUser(user.id);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
```

---

## Task 3: Account Modal Styles

**File:** `style.css`

```css
/* ============================================
   ACCOUNT MODAL
   ============================================ */

.auth-account-modal {
  max-width: 420px;
}

.account-section {
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color, #e5e5e5);
}

.account-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.account-section h3 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}

.account-field {
  margin-bottom: 12px;
}

.account-field label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #666);
  margin-bottom: 4px;
}

.account-value {
  font-size: 15px;
}

.auth-submit-secondary {
  background: transparent;
  color: var(--accent, #6366f1);
  border: 1px solid var(--accent, #6366f1);
}

.auth-submit-secondary:hover {
  background: var(--accent-light, #eef2ff);
}

.account-danger {
  background: #fef2f2;
  margin: 20px -32px -32px;
  padding: 20px 32px 32px;
  border-radius: 0 0 12px 12px;
}

.account-danger h3 {
  color: var(--danger, #dc2626);
}

.account-danger p {
  font-size: 14px;
  color: var(--text-secondary, #666);
  margin: 0 0 12px;
}

.auth-submit-danger {
  background: var(--danger, #dc2626);
}

.auth-submit-danger:hover {
  background: #b91c1c;
}

/* ============================================
   TOAST
   ============================================ */

.auth-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 3000;
  animation: toast-slide 0.3s ease;
}

@keyframes toast-slide {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.auth-toast-success {
  background: #dcfce7;
  color: #166534;
}

.auth-toast-error {
  background: #fef2f2;
  color: #dc2626;
}

.auth-toast-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.6;
}

.auth-toast-close:hover {
  opacity: 1;
}
```

---

## Checklist

- [ ] Account modal opens from dropdown
- [ ] Shows email and member since
- [ ] Change password form works
- [ ] Delete account with DELETE confirmation
- [ ] `api/account/delete.js` deletes all data
- [ ] Toast notifications appear
- [ ] Toasts auto-dismiss

---

## Commit

```bash
git add js/auth-ui.js api/account/delete.js style.css
git commit -m "feat: account modal + password + delete (Sprint 8.2)

- Account modal with user info
- Change password form
- Delete account with confirmation
- Toast notifications"
```
