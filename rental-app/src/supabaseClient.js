import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail fast at startup rather than making silent broken API calls.
// If either variable is missing, surface a visible error immediately.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Config] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file. ' +
    'Copy .env.example to .env and fill in your Supabase project credentials.'
  );
}

/**
 * Dynamic Auth Storage Adapter:
 * Toggles between localStorage (rememberMe = true) and sessionStorage (rememberMe = false).
 */
const dynamicAuthStorage = {
  getItem: (key) => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    } catch {
      // Fail silently
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // Fail silently
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: dynamicAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
});
