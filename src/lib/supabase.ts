import { createClient } from '@supabase/supabase-js';

// Safe environment variable resolution with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
);

/**
 * Public Supabase client using Anon Key.
 * Row Level Security (RLS) is enforced on all operations.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
