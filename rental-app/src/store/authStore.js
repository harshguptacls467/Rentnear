import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { MOCK_USER } from '../data/mockData';

// ─── Mock Session ────────────────────────────────────────────────────────────
// Used when Supabase is not configured / key is invalid
const MOCK_SESSION = {
  access_token: 'mock-token-demo',
  user: MOCK_USER,
};

const MOCK_SESSION_KEY = 'rentnear_mock_session';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const saveMockSession = () => localStorage.setItem(MOCK_SESSION_KEY, 'true');
const clearMockSession = () => localStorage.removeItem(MOCK_SESSION_KEY);
const hasMockSession = () => localStorage.getItem(MOCK_SESSION_KEY) === 'true';

// ─── Auth Store ───────────────────────────────────────────────────────────────
const useAuthStore = create((set) => ({
  user: null,
  session: null,
  initialized: false,

  // ── Mock Login ──────────────────────────────────────────────────────────────
  mockLogin: () => {
    saveMockSession();
    set({ session: MOCK_SESSION, user: { ...MOCK_USER }, initialized: true });
  },

  // ── Initialize ──────────────────────────────────────────────────────────────
  initialize: () => {
    // If a mock session was saved (from a previous demo login), restore it
    if (hasMockSession()) {
      set({ session: MOCK_SESSION, user: { ...MOCK_USER }, initialized: true });
      return () => {};
    }

    // Helper to fetch real public profile from DB
    const fetchPublicUser = async (authUser) => {
      if (!authUser) return null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (error) return authUser;
        return { ...authUser, ...data };
      } catch {
        return authUser;
      }
    };

    // 1. Check existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.warn('Auth session error — continuing as guest:', error.message);
          set({ session: null, user: null, initialized: true });
          return;
        }
        const fullUser = session?.user ? await fetchPublicUser(session.user) : null;
        set({ session, user: fullUser, initialized: true });
      })
      .catch((err) => {
        console.warn('Critical auth error — continuing as guest:', err);
        set({ session: null, user: null, initialized: true });
      });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        set({ session: null, user: null });
      } else {
        const fullUser = newSession?.user ? await fetchPublicUser(newSession.user) : null;
        set({ session: newSession, user: fullUser });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  },

  // ── Logout ──────────────────────────────────────────────────────────────────
  logout: async () => {
    // Clear mock session first
    clearMockSession();

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore errors from invalid Supabase client
    }

    set({ session: null, user: null });
  },
}));

export default useAuthStore;
