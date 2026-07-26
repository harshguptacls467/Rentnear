import { create } from 'zustand';
import { supabase } from '../supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  initialized: false,

  // ── Profile Sync & Fallback Generator ─────────────────────────────────────
  fetchPublicUser: async (authUser) => {
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
      } else {
        // Fallback: If DB trigger hasn't created the user row, upsert directly from client
        const newProfile = {
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          email: authUser.email,
          phone: authUser.user_metadata?.phone || authUser.phone || '',
          role: authUser.user_metadata?.role || 'both',
          kyc_status: 'unverified',
          kyc_verified: false,
          is_admin: false,
        };
        
        const { data: insertedData, error: insertError } = await supabase
          .from('users')
          .upsert([newProfile], { onConflict: 'id' })
          .select()
          .single();

        if (!insertError && insertedData) {
          profile = { ...authUser, ...insertedData };
        }
      }
    } catch {
      // Fail silently in production
    }

    // Guarantee super admin rights for primary admin email
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
    const userEmail = (authUser.email || profile.email || '').toLowerCase().trim();
    if (adminEmail && userEmail === adminEmail) {
      profile.is_admin = true;
      profile.admin_status = 'approved';
    }

    return profile;
  },

  // ── App Startup Initialization ────────────────────────────────────────────
  initialize: () => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error || !session) {
          set({ session: null, user: null, initialized: true });
          return;
        }
        const fullUser = await get().fetchPublicUser(session.user);
        set({ session, user: fullUser, initialized: true });
      })
      .catch(() => {
        set({ session: null, user: null, initialized: true });
      });

    // Listen for auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const fullUser = session?.user ? await get().fetchPublicUser(session.user) : null;
        set({ session, user: fullUser, initialized: true });
      } else if (event === 'SIGNED_OUT') {
        set({ session: null, user: null, initialized: true });
      }
    });
  },

  // ── Signup Action ─────────────────────────────────────────────────────────
  signUpUser: async ({ email, password, name, phone, role }) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          full_name: name,
          phone,
          role: role || 'both',
        },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // ── OTP Verification Action ───────────────────────────────────────────────
  verifySignupOtp: async (email, token, password = null) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();

    // 1. Try verification with type: 'signup'
    let { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    // 2. Fallback to type: 'email' if signup type token was not issued
    if (error) {
      const fallback1 = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });
      if (fallback1 && !fallback1.error) {
        data = fallback1.data;
        error = null;
      }
    }

    // 3. Fallback to type: 'magiclink' if magiclink type token was issued
    if (error) {
      const fallback2 = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'magiclink',
      });
      if (fallback2 && !fallback2.error) {
        data = fallback2.data;
        error = null;
      }
    }

    if (error) throw new Error(error.message || 'Invalid or expired verification code.');

    let authUser = data?.user;
    let activeSession = data?.session;

    // If verification succeeded but Supabase didn't auto-issue a session, sign in with password
    if (!activeSession && password) {
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInData?.session) {
          activeSession = signInData.session;
          if (signInData.user) authUser = signInData.user;
        }
      } catch {
        // Silent fallback
      }
    }

    // Explicitly set session in Supabase Auth client to persist tokens in localStorage
    if (activeSession) {
      const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
        access_token: activeSession.access_token,
        refresh_token: activeSession.refresh_token,
      });
      if (!setSessionErr && setSessionData?.session) {
        activeSession = setSessionData.session;
      }
    }

    const fullUser = authUser ? await get().fetchPublicUser(authUser) : null;

    useAuthStore.setState({
      session: activeSession,
      user: fullUser,
      initialized: true,
    });
    return fullUser;
  },

  // ── Login Action (NO OTP FOR VERIFIED USERS) ──────────────────────────────
  loginUser: async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    // Clear stale state first
    await supabase.auth.signOut().catch(() => {});

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw new Error(error.message);

    const authUser = data?.user;
    const session = data?.session;
    if (!authUser || !session) {
      throw new Error('Login succeeded but no valid session was returned.');
    }

    const fullUser = await get().fetchPublicUser(authUser);

    useAuthStore.setState({
      session,
      user: fullUser,
      initialized: true,
    });

    return fullUser;
  },

  // ── Resend Signup OTP Action ──────────────────────────────────────────────
  resendSignupOtp: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });
    if (error) throw new Error(error.message);
  },

  // ── Logout Action ─────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Fail silently
    }
    set({ session: null, user: null, initialized: true });
  },
}));

export default useAuthStore;
