 Sprint 8.1 code implementation is now complete! All the authentication foundation has been implemented:

  ✅ Supabase auth state management with listeners✅ Sign in/up modal with three modes (signin, signup, forgot)✅ User
  menu dropdown with account and sign out actions✅ Complete auth styling with mobile responsive design

  Ready for Testing

  Now we need to test the authentication flows. Here's what to verify:

  Test Sign Up Flow:

  1. Open http://localhost:3000 in your browser
  2. Click the "Sign In" button in the header
  3. Click "Sign up" link at the bottom of the modal
  4. Enter an email and password (at least 8 characters)
  5. Confirm password matches
  6. Click "Create Account"
  7. Check for success message or email confirmation requirement
  8. Verify user menu appears in header with your email

  Test Sign In Flow:

  1. If logged in, sign out first
  2. Click "Sign In" button
  3. Enter your email and password
  4. Click "Sign In"
  5. Verify user menu appears with avatar (first letter of email)
  6. Click on user menu to see dropdown
  7. Test sign out

  Things to Check:

  - ✅ Modal opens and closes correctly
  - ✅ Form validation works (required fields, password length)
  - ✅ Error messages display for invalid credentials
  - ✅ Success states show for email confirmation
  - ✅ User menu dropdown works
  - ✅ Mobile responsive (test on narrow screen)

  Would you like me to proceed with Sprint 8.2 (Account Modal + Password Management) or would you like to test this first
   and report any issues? 


---


# Sprint 8.1: Auth State + Sign In/Up

## Goal

Auth state manager and the sign in / sign up modal. User can create account and log in.

---

## Files to Create

```
js/
  auth-state.js       ← Supabase auth wrapper
  auth-ui.js          ← Modal + header rendering

index.html            ← Auth containers
style.css             ← Auth styles
```

---

## Task 1: Configure Supabase Auth

**Supabase Dashboard:**

1. **Authentication** → **Providers** → Ensure **Email** is enabled
2. **Authentication** → **Settings**:
   - Site URL: `https://sprekta-lite.vercel.app` (or your domain)
   - Redirect URLs: Add `https://sprekta-lite.vercel.app`
3. **For faster testing** (optional): Disable "Confirm email" temporarily

---

## Task 2: Auth State Manager

**File:** `js/auth-state.js` (NEW)

```javascript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Public credentials - safe for frontend
// TODO: Replace with your project's values
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AuthState = {
  user: null,
  session: null,
  initialized: false,
  listeners: [],

  /**
   * Initialize - call once on app start
   */
  async init() {
    if (this.initialized) return this.user;

    try {
      // Get existing session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Session error:', error);
      } else if (session) {
        this.session = session;
        this.user = session.user;
      }

      // Listen for changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('[Auth]', event, session?.user?.email || 'no user');

        const previousUser = this.user;
        this.session = session;
        this.user = session?.user || null;

        // Notify listeners
        this.listeners.forEach(cb => cb(event, this.user, previousUser));
      });

    } catch (error) {
      console.error('[Auth] Init failed:', error);
    }

    this.initialized = true;
    return this.user;
  },

  /**
   * Subscribe to auth changes
   */
  onAuthChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  // Getters
  isLoggedIn() {
    return !!this.user;
  },

  getUser() {
    return this.user;
  },

  getEmail() {
    return this.user?.email || null;
  },

  getUserId() {
    return this.user?.id || null;
  },

  async getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  },

  getClient() {
    return supabase;
  },

  // Auth actions
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    return {
      user: data.user,
      needsConfirmation: data.user && !data.session
    };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?reset=true`
    });

    if (error) throw error;
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }
};

export default AuthState;
```

---

## Task 3: Auth UI

**File:** `js/auth-ui.js` (NEW)

Create the complete auth UI file with sign in/up modal, user menu, and account modal placeholder.

[See full implementation in the overview document]

---

## Task 4: Update HTML

**File:** `index.html`

Add auth containers and initialize:

```html
<!-- In header -->
<header class="app-header">
  <div class="header-left">
    <h1 class="app-title">Sprekta</h1>
  </div>
  <div class="header-right" id="auth-header">
    <!-- Auth UI renders here -->
  </div>
</header>

<!-- Auth modal (outside main content) -->
<div id="auth-modal" class="hidden"></div>

<!-- Initialize -->
<script type="module">
  import AuthState from './js/auth-state.js';
  import AuthUI from './js/auth-ui.js';

  // Init auth first
  await AuthState.init();
  AuthUI.init('auth-modal', 'auth-header');

  // ... rest of app init
</script>
```

---

## Task 5: Auth Styles

**File:** `style.css`

Add comprehensive auth styles for header, modal, forms, dropdown, and mobile responsive design.

[See full styles in the overview document]

---

## Checklist

- [ ] Supabase Auth configured
- [ ] `js/auth-state.js` created
- [ ] `js/auth-ui.js` created
- [ ] Sign in form works
- [ ] Sign up form works
- [ ] Password validation (8+ chars, match)
- [ ] User menu shows when logged in
- [ ] Sign out works
- [ ] Modal closes on backdrop click
- [ ] Error messages display

---

## Commit

```bash
git add js/auth-state.js js/auth-ui.js index.html style.css
git commit -m "feat: auth foundation + sign in/up (Sprint 8.1)

- Supabase auth state manager
- Sign in / sign up modal
- User menu dropdown
- Form validation and errors"
```
