import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Public credentials - safe for frontend
const SUPABASE_URL = 'https://tqezvppmechaczaulput.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZXp2cHBtZWNoYWN6YXVscHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTIzOTQsImV4cCI6MjA4NDE4ODM5NH0.L399MwLc7veJVJ3FFEO7zkwglk2QUOWS5_hWN8PtYlQ';

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
