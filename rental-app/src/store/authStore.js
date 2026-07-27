import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  initialized: true,

  // Set user profile manually
  setUser: (user) => set({ user }),

  // Set session manually
  setSession: (session) => set({ session }),

  // Signup Action (Updates store state directly)
  signUpUser: async ({ email, password, name, phone, role }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

    const newUser = {
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

    const newSession = {
      access_token: 'session_' + Date.now(),
      user: newUser,
    };

    set({ user: newUser, session: newSession, initialized: true });
    return { user: newUser, session: newSession };
  },

  // Login Action (Updates store state directly)
  loginUser: async ({ email, password }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const displayName = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');

    const existingUser = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      role: 'both',
      kyc_status: 'unverified',
      kyc_verified: false,
      is_admin: cleanEmail === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim(),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    };

    const newSession = {
      access_token: 'session_' + Date.now(),
      user: existingUser,
    };

    set({ user: existingUser, session: newSession, initialized: true });
    return existingUser;
  },

  // Initialize
  initialize: () => {
    set({ initialized: true });
  },

  // Logout Action
  logout: async () => {
    set({ user: null, session: null, initialized: true });
  },
}));

export default useAuthStore;
