import { create } from 'zustand';
import { supabase } from '../supabaseClient';

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  initialized: false,

  // Synchronous function that returns a cleanup function for React useEffect
  initialize: () => {
    // 1. Safely check current session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth session error:", error.message);
        set({ session: null, user: null, initialized: true });
        return;
      }
      set({ session, user: session?.user || null, initialized: true });
    }).catch((err) => {
      console.error("Critical auth error:", err);
      set({ session: null, user: null, initialized: true });
    });

    // 2. Set up listener for token refresh, logout, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // Aggressively clear state on logout to prevent ghost sessions
        set({ session: null, user: null });
      } else {
        // Handles SIGNED_IN, TOKEN_REFRESHED, etc.
        set({ session: newSession, user: newSession?.user || null });
      }
    });

    // 3. Return the exact cleanup function to prevent memory leaks in React 18
    return () => {
      subscription?.unsubscribe();
    };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    }
    set({ session: null, user: null });
  }
}));

export default useAuthStore;
