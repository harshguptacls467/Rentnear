import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { MOCK_USER } from '../data/mockData';
import { getLocalUsers, saveLocalUsers } from '../utils/localDb';

const MOCK_SESSION_KEY = 'rentnear_mock_session';

const getOrCreateMockUser = (email, extraData = {}) => {
  const localUsers = getLocalUsers();
  if (localUsers[email]) {
    if (email === 'demo@rentnear.app' || email === 'harshguptacls467@gmail.com') {
      localUsers[email].is_admin = true;
      localUsers[email].admin_status = 'approved';
    }
    if (Object.keys(extraData).length > 0) {
      localUsers[email] = { ...localUsers[email], ...extraData };
    }
    saveLocalUsers(localUsers);
    return localUsers[email];
  }
  
  if (email === 'demo@rentnear.app' || email === 'harshguptacls467@gmail.com') {
    localUsers[email] = {
      ...MOCK_USER,
      email: email,
      name: email === 'demo@rentnear.app' ? 'Super Admin' : 'Harsh Gupta',
      is_admin: true,
      admin_status: 'approved',
      kyc_verified: true,
      kyc_status: 'verified',
      email_verified: true,
      location: 'New Delhi, India',
      upi_id: 'demo@upi',
      bio: 'Hi neighbors! I love sharing tools and camera gear. Let us build a sustainable community.',
      emergency_contact: 'Family (+91 99999 88888)',
      aadhar_number: 'XXXX XXXX 1234'
    };
    saveLocalUsers(localUsers);
    return localUsers[email];
  }

  const name = extraData.name || email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  // Count how many admins exist in localUsers
  const existingAdmins = Object.values(localUsers).filter(u => u.is_admin === true);
  
  let finalIsAdmin = false;
  let finalAdminStatus = 'none';

  if (extraData.isAdminRegister) {
    if (existingAdmins.length === 0) {
      finalIsAdmin = true;
      finalAdminStatus = 'approved';
    } else {
      finalIsAdmin = false;
      finalAdminStatus = 'pending';
    }
  }

  const newUser = {
    id: 'mock-user-id-' + Math.random().toString(36).substring(2, 11),
    email: email,
    name: name || 'Demo User',
    phone: extraData.phone || '+91 98765 43210',
    role: extraData.role || 'both',
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    kyc_verified: false,
    kyc_status: 'unverified',
    email_verified: false,
    rating_average: 5.0,
    rating_count: 0,
    created_at: new Date().toISOString(),
    location: '',
    upi_id: '',
    bio: 'Hi neighbors! I believe in the power of sharing rather than hoarding.',
    emergency_contact: '',
    aadhar_number: '',
    is_admin: finalIsAdmin,
    admin_status: finalAdminStatus
  };
  
  localUsers[email] = newUser;
  saveLocalUsers(localUsers);
  return newUser;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const saveMockSession = (email) => {
  localStorage.setItem(MOCK_SESSION_KEY, 'true');
  localStorage.setItem('rentnear_mock_session_email', email);
};
const clearMockSession = () => {
  localStorage.removeItem(MOCK_SESSION_KEY);
  localStorage.removeItem('rentnear_mock_session_email');
};
const hasMockSession = () => localStorage.getItem(MOCK_SESSION_KEY) === 'true';

// ─── Auth Store ───────────────────────────────────────────────────────────────
const useAuthStore = create((set) => ({
  user: null,
  session: null,
  initialized: false,
  isMock: false,

  // ── Mock Login ──────────────────────────────────────────────────────────────
  mockLogin: (email, extraData = {}) => {
    const cleanEmail = email || 'demo@rentnear.app';
    saveMockSession(cleanEmail);
    const mockUser = getOrCreateMockUser(cleanEmail, extraData);
    set({
      session: {
        access_token: 'mock-token-demo',
        user: mockUser,
      },
      user: mockUser,
      initialized: true,
      isMock: true,
    });
  },

  // ── Mock Social Login ───────────────────────────────────────────────────────
  mockSocialLogin: (provider) => {
    const cleanEmail = `${provider}@rentnear.app`;
    saveMockSession(cleanEmail);
    const mockUser = getOrCreateMockUser(cleanEmail);
    set({ 
      session: {
        access_token: 'mock-token-demo',
        user: mockUser,
      }, 
      user: mockUser, 
      initialized: true,
      isMock: true
    });
  },

  // ── Initialize ──────────────────────────────────────────────────────────────
  initialize: () => {
    // If a mock session was saved (from a previous demo login), restore it
    if (hasMockSession()) {
      const savedEmail = localStorage.getItem('rentnear_mock_session_email') || 'demo@rentnear.app';
      const mockUser = getOrCreateMockUser(savedEmail);
      set({
        session: {
          access_token: 'mock-token-demo',
          user: mockUser,
        },
        user: mockUser,
        initialized: true,
        isMock: true
      });
      return () => {};
    }

    // Helper to fetch real public profile from DB
    const fetchPublicUser = async (authUser) => {
      if (!authUser) return null;
      let profile = { ...authUser };
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (!error && data) {
          profile = { ...authUser, ...data };
        }
      } catch {
        // use default profile
      }

      // Guarantee super admin rights for primary admin email
      if (
        authUser.email?.toLowerCase() === 'harshguptacls467@gmail.com' ||
        authUser.email?.toLowerCase() === 'demo@rentnear.app'
      ) {
        profile.is_admin = true;
        profile.admin_status = 'approved';
      }

      return profile;
    };

    // 1. Check existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (hasMockSession()) return;
        if (error) {
          console.warn('Auth session error — continuing as guest:', error.message);
          set({ session: null, user: null, initialized: true });
          return;
        }
        const fullUser = session?.user ? await fetchPublicUser(session.user) : null;
        set({ session, user: fullUser, initialized: true });
      })
      .catch((err) => {
        if (hasMockSession()) return;
        console.warn('Critical auth error — continuing as guest:', err);
        set({ session: null, user: null, initialized: true });
      });

    // 2. Listen for auth state changes (including OAuth redirects)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (hasMockSession()) {
        return;
      }
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        set({ session: null, user: null });
      } else {
        const authUser = newSession?.user;
        if (authUser) {
          // Auto-save profile for OAuth users (Google/Apple) on first sign-in
          if (event === 'SIGNED_IN') {
            try {
              const meta = authUser.user_metadata || {};
              await supabase.from('users').upsert([
                {
                  id: authUser.id,
                  name: meta.full_name || meta.name || '',
                  email: authUser.email || '',
                  avatar_url: meta.avatar_url || meta.picture || '',
                  role: 'both',
                },
              ], { onConflict: 'id', ignoreDuplicates: false });
            } catch (err) {
              console.warn('OAuth profile save skipped:', err.message);
            }
          }
          const fullUser = await fetchPublicUser(authUser);
          set({ session: newSession, user: fullUser });
        } else {
          set({ session: newSession, user: null });
        }
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
