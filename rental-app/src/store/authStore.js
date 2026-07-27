import { create } from 'zustand';

const MOCK_USER_STORAGE_KEY = 'rentnear_auth_user';
const MOCK_SESSION_STORAGE_KEY = 'rentnear_auth_session';

const safeGetStorage = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Fail silently
  }
  return null;
};

const safeSetStorage = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.setItem) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Fail silently
  }
};

const safeRemoveStorage = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.removeItem) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Fail silently
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  pendingUser: null,
  initialized: false,

  // Profile Sync
  fetchPublicUser: async (authUser) => {
    return authUser;
  },

  // Initialize Session from localStorage on Startup
  initialize: () => {
    try {
      const storedUser = safeGetStorage(MOCK_USER_STORAGE_KEY);
      const storedSession = safeGetStorage(MOCK_SESSION_STORAGE_KEY);
      if (storedUser && storedSession) {
        set({
          user: JSON.parse(storedUser),
          session: JSON.parse(storedSession),
          initialized: true,
        });
        return;
      }
    } catch {
      // Fail silently if invalid JSON
    }
    set({ user: null, session: null, initialized: true });
  },

  // Signup Action
  signUpUser: async ({ email, password, name, phone, role }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    
    const pendingUser = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      name: cleanName,
      phone: phone || '',
      role: role || 'both',
      kyc_status: 'unverified',
      kyc_verified: false,
      is_admin: cleanEmail === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim(),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    };

    set({ pendingUser });

    return {
      user: pendingUser,
      session: null, // Triggers OTP verification screen on frontend
    };
  },

  // OTP Verification Action (Accepts valid 6-digit OTP code)
  verifySignupOtp: async (email, token, password = null) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanEmail = (email || 'user@rentnear.app').trim().toLowerCase();
    const cleanToken = (token || '').trim();

    if (!cleanToken || cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    const pending = get().pendingUser;
    const mockUser = (pending && pending.email === cleanEmail)
      ? { ...pending }
      : {
          id: 'usr_' + Math.random().toString(36).substr(2, 9),
          email: cleanEmail,
          name: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          phone: '',
          role: 'both',
          kyc_status: 'unverified',
          kyc_verified: false,
          is_admin: cleanEmail === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim(),
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        };

    const mockSession = {
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      user: mockUser,
    };

    safeSetStorage(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
    safeSetStorage(MOCK_SESSION_STORAGE_KEY, JSON.stringify(mockSession));

    set({
      user: mockUser,
      session: mockSession,
      pendingUser: null,
      initialized: true,
    });

    return mockUser;
  },

  // Login Action (Email + Password Direct Login - NO OTP)
  loginUser: async ({ email, password }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanEmail = email.trim().toLowerCase();
    const displayName = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');

    const mockUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email: cleanEmail,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      role: 'both',
      kyc_status: 'unverified',
      kyc_verified: false,
      is_admin: cleanEmail === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim(),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    };

    const mockSession = {
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      user: mockUser,
    };

    safeSetStorage(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
    safeSetStorage(MOCK_SESSION_STORAGE_KEY, JSON.stringify(mockSession));

    set({
      user: mockUser,
      session: mockSession,
      pendingUser: null,
      initialized: true,
    });

    return mockUser;
  },

  // Resend Signup OTP Action
  resendSignupOtp: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  },

  // Logout Action
  logout: async () => {
    safeRemoveStorage(MOCK_USER_STORAGE_KEY);
    safeRemoveStorage(MOCK_SESSION_STORAGE_KEY);
    set({ user: null, session: null, pendingUser: null, initialized: true });
  },
}));

export default useAuthStore;
