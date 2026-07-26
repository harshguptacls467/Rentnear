import { create } from 'zustand';
import { supabase } from '../supabaseClient';

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  initialized: false,

  // Reusable profile synchronizer and auto-creator
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
        // Profile row does not exist in the public.users table (trigger fallback).
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

  // Initialize Session & Real-time Sync
  initialize: () => {
    // 1. Check existing session on startup
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          set({ session: null, user: null, initialized: true });
          return;
        }
        const fullUser = session?.user ? await get().fetchPublicUser(session.user) : null;
        set({ session, user: fullUser, initialized: true });
      })
      .catch(() => {
        set({ session: null, user: null, initialized: true });
      });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        set({ session: null, user: null, initialized: true });
      } else {
        const authUser = newSession?.user;
        if (authUser) {
          const fullUser = await get().fetchPublicUser(authUser);
          set({ session: newSession, user: fullUser, initialized: true });
        } else {
          set({ session: null, user: null, initialized: true });
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  },

  // ── OTP helpers ──────────────────────────────────────────────────────────
  // Re-send the signup verification OTP to the given email address.
  resendSignupOtp: async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw new Error(error.message);
  },

  // Verify the 6-digit OTP, then sync the public profile and persist the session.
  verifySignupOtp: async (email, token, password = null) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();

    let { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    // Fallback 1 to type: 'email' if type: 'signup' returns an error
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

    // Fallback 2 to type: 'magiclink' if type: 'email' returns an error
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

    // If verification succeeded but Supabase didn't issue a session, auto-login with password
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
        // Signin attempt fallback silent
      }
    }

    // Explicitly persist session into Supabase Auth Client & localStorage
    if (activeSession) {
      const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
        access_token: activeSession.access_token,
        refresh_token: activeSession.refresh_token,
      });
      if (!setSessionErr && setSessionData?.session) {
        activeSession = setSessionData.session;
      }
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      activeSession = sessionData?.session || null;
    }

    const fullUser = authUser ? await get().fetchPublicUser(authUser) : null;

    useAuthStore.setState({
      session: activeSession,
      user: fullUser,
      initialized: true,
    });
    return fullUser;
  },

  // Sign out cleanly
  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Fail silently
    }
    set({ session: null, user: null });
  },
}));

export default useAuthStore;
