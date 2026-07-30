import { create } from 'zustand';
import { supabase } from '../supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  initialized: false,

  // ── Profile Sync & Automatic Self-Healing ─────────────────────────────────
  fetchPublicUser: async (authUser) => {
    if (!authUser || !authUser.id) return null;
    let profile = { ...authUser };
    try {
      // 1. Query public.users table for existing profile row
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!dbError && data) {
        profile = { ...authUser, ...data };
      } else {
        // 2. Profile row missing — self-heal profile row in public.users
        const newProfile = {
          id: authUser.id, // REAL Supabase Auth UUID
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email,
          phone: authUser.user_metadata?.phone || authUser.phone || '',
          role: authUser.user_metadata?.role || 'both',
          email_verified: true,
          kyc_status: 'unverified',
          kyc_verified: false,
          is_admin: (authUser.email || '').toLowerCase().trim() === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim(),
          avatar_url: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('users')
          .upsert([newProfile], { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (!insertError && insertedData) {
          profile = { ...authUser, ...insertedData };
        } else {
          profile = { ...authUser, ...newProfile };
        }
      }
    } catch (err) {
      console.warn('Profile sync warning:', err.message);
    }

    // Guarantee admin rights if email matches VITE_ADMIN_EMAIL
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
      .then(async ({ data, error }) => {
        const session = data?.session || null;
        if (error || !session?.user) {
          set({ session: null, user: null, initialized: true });
          return;
        }
        // Set session and mark initialized immediately so routes render instantly
        set({ session, user: session.user, initialized: true });

        // Hydrate public user profile asynchronously without blocking initial render
        try {
          const fullUser = await get().fetchPublicUser(session.user);
          if (fullUser) set({ user: fullUser });
        } catch {
          // Keep base auth user if DB sync fails
        }
      })
      .catch(() => {
        set({ session: null, user: null, initialized: true });
      });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          set({ session, user: session.user, initialized: true });
          try {
            const fullUser = await get().fetchPublicUser(session.user);
            if (fullUser) set({ user: fullUser });
          } catch {
            // Keep base auth user
          }
        }
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
          phone: phone || '',
          role: role || 'both',
        },
      },
    });

    if (error) throw new Error(error.message);
    return {
      user: data?.user || null,
      session: data?.session || null,
    };
  },

  // ── OTP Verification Action ───────────────────────────────────────────────
  verifySignupOtp: async (email, token, password = null) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();

    if (!cleanToken || cleanToken.length < 6) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    // 1. Try verification with type: 'signup'
    let { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    // 2. Fallback to type: 'email'
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

    // 3. Fallback to type: 'magiclink'
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

    if (error || !data) throw new Error(error?.message || 'Invalid or expired verification code.');

    let authUser = data?.user;
    let activeSession = data?.session;

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

    if (activeSession) {
      const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
        access_token: activeSession.access_token,
        refresh_token: activeSession.refresh_token,
      });
      if (!setSessionErr && setSessionData?.session) {
        activeSession = setSessionData.session;
      }
    }

    if (authUser?.id) {
      await supabase.from('users').update({ email_verified: true }).eq('id', authUser.id).catch(() => {});
    }

    const fullUser = authUser ? await get().fetchPublicUser(authUser) : null;

    useAuthStore.setState({
      session: activeSession,
      user: fullUser,
      initialized: true,
    });

    return fullUser;
  },

  // ── Login Action (Direct Password Login for Verified Users) ───────────────
  loginUser: async ({ email, password, rememberMe = true }) => {
    const cleanEmail = email.trim().toLowerCase();

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('rentnear_remember_me', String(rememberMe !== false));
    }

    // Clear stale session
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

  // ── Update Profile Action ──────────────────────────────────────────────────
  updateUserProfile: async (updatedFields) => {
    const currentUser = get().user;
    if (!currentUser?.id) throw new Error('No authenticated user found.');

    await supabase.auth.updateUser({
      data: updatedFields,
    }).catch(() => {});

    const { data, error } = await supabase
      .from('users')
      .upsert([{ id: currentUser.id, ...updatedFields, updated_at: new Date().toISOString() }])
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);

    const mergedUser = { ...currentUser, ...updatedFields, ...data };
    set({ user: mergedUser });
    return mergedUser;
  },

  // ── Password Reset Actions ────────────────────────────────────────────────
  sendPasswordResetOtp: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw new Error(error.message);
    return true;
  },

  verifyPasswordResetOtp: async (email, token) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });
    if (error) throw new Error(error.message);
    return true;
  },

  updateUserPassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
    await supabase.auth.signOut().catch(() => {});
    set({ session: null, user: null, initialized: true });
    return true;
  },

  // ── Google OAuth Action ───────────────────────────────────────────────────
  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });
    if (error) throw new Error(error.message);
    return data;
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
  logout: async (options = { scope: 'local' }) => {
    try {
      await supabase.auth.signOut(options);
    } catch {
      // Fail silently
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rentnear_mock_session');
      localStorage.removeItem('rentnear_mock_session_email');
      localStorage.removeItem('rentnear_remember_me');
    }
    set({ session: null, user: null, isMock: false, initialized: true });
  },
}));

export default useAuthStore;
