import { create } from 'zustand';
import { supabase } from '../supabaseClient';

// ─── Auth Store ───────────────────────────────────────────────────────────────
const useAuthStore = create((set) => ({
  user: null,
  session: null,
  initialized: false,

  // ── Initialize ──────────────────────────────────────────────────────────────
  initialize: () => {
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
        } else {
          // Profile row does not exist in the public.users table (e.g. registered but couldn't write due to unconfirmed email RLS restriction).
          // Let's create it automatically now that we are authenticated/authenticating.
          const newProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            email: authUser.email,
            phone: authUser.phone || '',
            role: 'both',
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
          } else {
            console.warn('Could not auto-create public user profile row:', insertError?.message);
          }
        }
      } catch (err) {
        console.warn('Error fetching or auto-creating public user profile:', err);
      }

      // Guarantee super admin rights for primary admin emails
      const userEmail = (authUser.email || profile.email || '').toLowerCase();
      if (
        userEmail === 'harshguptacls467@gmail.com' ||
        userEmail === 'harshguptcls467@gmail.com'
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

    // 2. Listen for auth state changes (including OAuth redirects)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[AuthStore] onAuthStateChange event: ${event}, session: ${!!newSession}`);

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        set({ session: null, user: null, initialized: true });
      } else {
        const authUser = newSession?.user;
        if (authUser) {
          // Auto-save profile ONLY for OAuth users (Google/Apple) on first sign-in
          const provider = authUser.app_metadata?.provider;
          if (event === 'SIGNED_IN' && provider && provider !== 'email') {
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
              ], { onConflict: 'id', ignoreDuplicates: true });
            } catch (err) {
              console.warn('OAuth profile save skipped:', err.message);
            }
          }
          const fullUser = await fetchPublicUser(authUser);
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

  // ── Logout ──────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore errors from invalid Supabase client
    }
    set({ session: null, user: null });
  },
}));

export default useAuthStore;
