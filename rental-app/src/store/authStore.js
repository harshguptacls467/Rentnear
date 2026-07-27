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
    const avatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`;

    const profileData = {
      id: authUser.id,
      email: cleanEmail,
      name: name.trim(),
      phone: phone.trim(),
      role: role,
      kyc_status: 'unverified',
      kyc_verified: false,
      is_admin: isAdmin,
      avatar_url: avatar,
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

  // Google OAuth Login / Signup Action
  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw new Error(error.message || 'Google authentication failed.');
    return data;
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
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        const fullUser = await get().syncUserProfile(session.user);
        set({ user: fullUser, session, initialized: true });
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, session: null, pendingUser: null, initialized: true });
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
  loginUser: async ({ email, password, rememberMe = true }) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // Store Remember Me preference for dynamic storage adapter
    try {
      localStorage.setItem('rentnear_remember_me', rememberMe ? 'true' : 'false');
    } catch {
      // Fail silently
    }

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

  // Send Password Reset OTP Email
  sendPasswordResetOtp: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw new Error(error.message || 'Failed to send password reset code.');
    return true;
  },

  // Verify Password Reset OTP Token
  verifyPasswordResetOtp: async (email, token) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();

    if (!cleanToken || cleanToken.length !== 6) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });

    if (error) {
      throw new Error(error.message || 'Invalid or expired verification code. Please request a new code.');
    }

    set({ session: data.session });
    return true;
  },

  // Update User Password (After OTP verification)
  updateUserPassword: async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message || 'Failed to update password.');
    }

    // Sign out active recovery session so user logs in with new password
    await get().logout();
    return true;
  },

  // Update User Profile (Name, Phone, Avatar)
  updateUserProfile: async ({ name, phone, avatar_url }) => {
    const currentUser = get().user;
    if (!currentUser?.id) throw new Error('User is not authenticated.');

    const cleanName = (name !== undefined ? name : currentUser.name || '').trim();
    const cleanPhone = (phone !== undefined ? phone : currentUser.phone || '').trim();
    const cleanAvatar = (avatar_url !== undefined ? avatar_url : currentUser.avatar_url || '').trim();

    // 1. Update Auth Metadata
    try {
      await supabase.auth.updateUser({
        data: {
          name: cleanName,
          phone: cleanPhone,
          avatar_url: cleanAvatar,
        },
      });
    } catch (err) {
      console.warn('Auth metadata update notice:', err.message);
    }

    // 2. Update Database Record in public.users
    const updatedData = {
      name: cleanName,
      phone: cleanPhone,
      avatar_url: cleanAvatar,
    };

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', currentUser.id)
        .select()
        .single();

      const newProfile = data || { ...currentUser, ...updatedData };
      set({ user: newProfile });
      return newProfile;
    } catch {
      const newProfile = { ...currentUser, ...updatedData };
      set({ user: newProfile });
      return newProfile;
    }
  },

  // Refresh Session Manually
  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session?.user) {
        const fullUser = await get().syncUserProfile(session.user);
        set({ user: fullUser, session, initialized: true });
        return session;
      }
    } catch (err) {
      console.warn('Session refresh notice:', err.message);
    }
    return null;
  },

  // Logout Action (Supports scope: 'local' | 'global')
  logout: async (options = {}) => {
    const scope = options?.scope || 'local';
    try {
      await supabase.auth.signOut({ scope });
    } catch {
      // Fail silently
    }
    set({ user: null, session: null, pendingUser: null, initialized: true });
  },
}));

export default useAuthStore;
