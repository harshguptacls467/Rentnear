import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail fast at startup rather than making silent broken API calls.
// If either variable is missing, surface a visible error immediately.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Config] VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY must be set in your .env file. ' +
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
      // Read the rememberMe preference. Login page must set 'rentnear_remember_me'
      // to 'true' in localStorage when the user checks "Remember me".
      // If not set (or false), use sessionStorage only — session ends on tab close.
      const rememberMe = localStorage.getItem('rentnear_remember_me') === 'true';
      if (rememberMe) {
        localStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
      }
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

// Guard removeChannel globally to prevent uncaught promise rejections during async channel cleanup
const originalRemoveChannel = supabase.removeChannel.bind(supabase);
supabase.removeChannel = async (channel) => {
  try {
    if (!channel) return;
    return await originalRemoveChannel(channel);
  } catch (err) {
    console.debug('[Supabase] Channel cleanup handled safely:', err.message);
  }
};
