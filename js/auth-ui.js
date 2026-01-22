import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Get these from Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://tqezvppmechaczaulput.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZXp2cHBtZWNoYWN6YXVscHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTIzOTQsImV4cCI6MjA4NDE4ODM5NH0.L399MwLc7veJVJ3FFEO7zkwglk2QUOWS5_hWN8PtYlQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AuthUI = {
  user: null,

  async init() {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    this.user = session?.user || null;

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null;
      this.onAuthChange(event, session);
    });

    return this.user;
  },

  onAuthChange(event, session) {
    // Override this in your app
    console.log('Auth state changed:', event, session?.user?.email);
  },

  isLoggedIn() {
    return !!this.user;
  },

  getUser() {
    return this.user;
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    return data;
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

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  },

  // Get access token for API calls
  async getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }
};

export default AuthUI;
export { supabase };
