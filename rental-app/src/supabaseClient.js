import { createClient } from '@supabase/supabase-js'

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL env variable');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY env variable');
}
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Dynamic Auth Storage Adapter:
 * Toggles between localStorage (rememberMe = true) and sessionStorage (rememberMe = false).
 */
const dynamicAuthStorage = {
  getItem: (key) => {
    try {
      const isRemembered = localStorage.getItem('rentnear_remember_me') !== 'false';
      return isRemembered
        ? localStorage.getItem(key)
        : (sessionStorage.getItem(key) || localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      const isRemembered = localStorage.getItem('rentnear_remember_me') !== 'false';
      if (isRemembered) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      // Fail silently
    }
  },
  removeItem: (key) => {
    try {
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
