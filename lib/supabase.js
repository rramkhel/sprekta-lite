/**
 * Supabase Client
 *
 * Initializes the Supabase client for database operations
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing credentials!');
  console.error('URL:', supabaseUrl ? 'present' : 'MISSING');
  console.error('Key:', supabaseKey ? 'present' : 'MISSING');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // We're not using auth yet
  }
});

console.log('[Supabase] Client initialized');
