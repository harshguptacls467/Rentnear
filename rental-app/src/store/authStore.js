import { create } from 'zustand';
import { supabase } from '../supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  pendingUser: null,
  initialized: false,

  // Set user profile manually
  setUser: (user) => set({ user }),

  // Set session manually
  setSession: (session) => set({ session }),

  // Fetch or Upsert Public User Profile in Database
  syncUserProfile: async (authUser, meta = {}) => {
    if (!authUser) return null;

    const email = authUser.email || meta.email || '';
    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
    const isAdmin = cleanEmail === adminEmail;

    const name = meta.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || cleanEmail.split('@')[0];
    const phone = meta.phone || authUser.user_metadata?.phone || '';
    const role = meta.role || authUser.user_metadata?.role || 'both';

    const profileData = {
      id: authUser.id,
      email: cleanEmail,
      name: name.trim(),
      phone: phone.trim(),
      role: role,
      kyc_status: 'unverified',
      kyc_verified: false,
      is_admin: isAdmin,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    };

    try {
      // Upsert profile into public.users table (on conflict update or ignore)
      const { data, error } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('Profile upsert notice:', error.message);
        return profileData;
      }
      return data || profileData;
    } catch {
      return profileData;
    }
  },

  // Initialize Session from Supabase on App Startup
  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        const fullUser = await get().syncUserProfile(session.user);
        set({ user: fullUser, session, initialized: true });
      } else {
        set({ user: null, session: null, initialized: true });
      }
    } catch {
      set({ user: null, session: null, initialized: true });
    }

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const fullUser = await get().syncUserProfile(session.user);
        set({ user: fullUser, session, initialized: true });
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, session: null, initialized: true });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  },

  // Signup Action (Sends 6-digit OTP code to email via Supabase Auth)
  signUpUser: async ({ email, password, name, phone, role }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const fullPhone = (phone || '').trim();
    const userRole = role || 'both';

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          phone: fullPhone,
          role: userRole,
        },
      },
    });

    if (error) throw error;

    const pendingDetails = {
      id: data?.user?.id,
      email: cleanEmail,
      name: cleanName,
      phone: fullPhone,
      role: userRole,
    };

    set({ pendingUser: pendingDetails });

    return {
      user: data.user || pendingDetails,
      session: data.session, // Session is null until Email OTP is verified
    };
  },

  // OTP Verification Action (Verifies 6-digit Email OTP via Supabase Auth)
  verifySignupOtp: async (email, token, metadata = {}) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();

    if (!cleanToken || cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    // Verify OTP using Supabase's official Email OTP verification flow
    let res = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    // Fallback try with type 'email' if 'signup' is not accepted
    if (res.error && res.error.message?.toLowerCase().includes('type')) {
      res = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });
    }

    if (res.error) throw res.error;

    const authUser = res.data?.user;
    const session = res.data?.session;

    const pending = get().pendingUser || {};
    const mergedMeta = { ...pending, ...metadata, email: cleanEmail };

    // Sync/create user profile in database
    const fullUser = await get().syncUserProfile(authUser || { id: pending.id || 'usr_' + Date.now(), email: cleanEmail }, mergedMeta);

    set({
      user: fullUser,
      session: session || { access_token: 'session_' + Date.now(), user: fullUser },
      pendingUser: null,
      initialized: true,
    });

    return fullUser;
  },

  // Resend Email OTP Code
  resendSignupOtp: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    let { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      const fallback = await supabase.auth.resend({
        type: 'email_change',
        email: cleanEmail,
      });
      if (fallback.error && error) throw new Error(error.message);
    }
    return true;
  },

  // Direct Email + Password Login (For verified users)
  loginUser: async ({ email, password }) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;

    const fullUser = await get().syncUserProfile(data.user, { email: cleanEmail });

    set({
      user: fullUser,
      session: data.session,
      pendingUser: null,
      initialized: true,
    });

    return fullUser;
  },

  // Logout Action
  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Fail silently
    }
    set({ user: null, session: null, pendingUser: null, initialized: true });
  },
}));

export default useAuthStore;
