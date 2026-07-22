import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Mail, Lock, User, AlertCircle, Shield, ShieldCheck, Clock, UserPlus } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { getLocalUsers, saveLocalUsers } from '../utils/localDb';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const { session, user, mockLogin, logout } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // If already logged in as approved admin → redirect to admin panel
  useEffect(() => {
    if (session && user?.is_admin && user?.admin_status === 'approved') {
      navigate('/admin', { replace: true });
    }
  }, [session, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Admin Login ─────────────────────────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    try {
      // Check if Supabase is configured
      const isSupabaseValid = supabase && import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-ref');

      if (isSupabaseValid) {
        // Real Supabase login
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        const isSuperAdminEmail = email === 'harshguptacls467@gmail.com' || email === 'demo@rentnear.app';

        // Fetch public user record to verify admin status
        let userData = null;
        try {
          const { data } = await supabase
            .from('users')
            .select('is_admin, admin_status, kyc_verified, name')
            .eq('id', authData.user.id)
            .single();
          userData = data;
        } catch (dbErr) {
          console.warn('DB lookup warning during admin login:', dbErr);
        }

        if (!isSuperAdminEmail) {
          if (!userData) {
            await supabase.auth.signOut();
            throw new Error('Failed to verify admin status. User record not found.');
          }

          if (!userData.is_admin) {
            await supabase.auth.signOut();
            throw new Error('This account does not have admin privileges.');
          }

          if (userData.admin_status === 'pending') {
            await supabase.auth.signOut();
            throw new Error('Your admin access request is pending approval. Please contact an existing administrator.');
          }

          if (userData.admin_status === 'rejected') {
            await supabase.auth.signOut();
            throw new Error('Your admin access request has been rejected.');
          }
        }

        // Clear mock session to switch to real Supabase session
        localStorage.removeItem('rentnear_mock_session');
        localStorage.removeItem('rentnear_mock_session_email');

        const adminUserData = {
          ...authData.user,
          ...(userData || {}),
          is_admin: true,
          admin_status: 'approved',
        };

        // Immediately populate AuthStore so ProtectedRoute allows /admin route access
        useAuthStore.setState({
          session: authData.session,
          user: adminUserData,
          isMock: false,
          initialized: true,
        });

        showToast(`Welcome back, ${adminUserData.name || userData?.name || 'Admin'}!`, 'success');
        navigate('/admin');
      } else {
        // Mock login — check localStorage for admin users
        const localUsers = getLocalUsers();
        const existingUser = localUsers[email];

        if (!existingUser) {
          throw new Error('No admin account found with this email. Please register first.');
        }

        if (!existingUser.is_admin && existingUser.admin_status !== 'pending') {
          throw new Error('This account does not have admin privileges.');
        }

        if (existingUser.admin_status === 'pending') {
          throw new Error('Your admin access request is pending approval. Please wait for an existing administrator to approve your request.');
        }

        if (existingUser.admin_status === 'rejected') {
          throw new Error('Your admin access request has been rejected.');
        }

        if (!existingUser.is_admin || existingUser.admin_status !== 'approved') {
          throw new Error('Admin access denied.');
        }

        // Approved admin — log in
        await logout();
        mockLogin(email);
        showToast('Welcome back, Admin!', 'success');
        navigate('/admin');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrorMsg(error.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Admin Register ──────────────────────────────────────────────────────────
  const handleAdminRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const name = formData.name.trim();

    if (!name) {
      setErrorMsg('Name is required.');
      setLoading(false);
      return;
    }

    try {
      const isSupabaseValid = supabase && import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-ref');

      if (isSupabaseValid) {
        // Real Supabase registration
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw new Error(authError.message);

        const userId = authData?.user?.id;
        if (!userId) throw new Error('Registration failed.');

        // Check if any admins exist
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('is_admin', true)
          .eq('admin_status', 'approved');

        const isFirstAdmin = (count || 0) === 0;

        // Save admin profile
        await supabase.from('users').upsert([{
          id: userId,
          name,
          email,
          role: 'both',
          is_admin: isFirstAdmin,
          admin_status: isFirstAdmin ? 'approved' : 'pending'
        }], { onConflict: 'id' });

        if (isFirstAdmin) {
          setSuccessMsg('🎉 You are the first admin! Your account has been auto-approved. You can now log in.');
        } else {
          setSuccessMsg('✅ Admin registration submitted! Your request is pending approval from an existing administrator. You will be notified once approved.');
        }

        setMode('login');
      } else {
        // Mock registration
        const localUsers = getLocalUsers();

        if (localUsers[email]) {
          throw new Error('An account with this email already exists.');
        }

        await logout();
        mockLogin(email, {
          name,
          isAdminRegister: true
        });

        // Read back the user to check status
        const updatedUsers = getLocalUsers();
        const newUser = updatedUsers[email];

        if (newUser?.is_admin && newUser?.admin_status === 'approved') {
          setSuccessMsg('🎉 You are the first admin! Your account has been auto-approved. You can now log in.');
          // Log out so they use the login flow
          await logout();
        } else {
          setSuccessMsg('✅ Admin registration submitted! Your request is pending approval from an existing administrator.');
          await logout();
        }

        setMode('login');
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      setErrorMsg(error.message || 'Admin registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[200px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Admin Badge */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Shield size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white">
          {mode === 'login' ? 'Admin Portal' : 'Admin Registration'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          {mode === 'login'
            ? 'Restricted access — authorized personnel only'
            : 'Register for admin access — requires approval'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow-2xl border border-white/10 sm:rounded-2xl sm:px-10">

          {/* Demo Admin Login Banner (Always active in dev/mock fallback mode) */}
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-sm text-yellow-300 mb-3 font-medium flex items-center gap-2">
              ⚡ Sandbox Mode:
            </p>
            <button
              onClick={async () => {
                setLoading(true);
                setErrorMsg('');
                try {
                  await logout();
                  mockLogin('demo@rentnear.app');
                  showToast('Welcome back, Admin (Demo Mode)!', 'success');
                  navigate('/admin');
                } catch (e) {
                  setErrorMsg(e.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              <ShieldCheck size={16} />
              Login as Demo Admin
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex mb-6 bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield size={16} />
              Login
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus size={16} />
              Register
            </button>
          </div>

          {/* First Admin Notice */}
          {mode === 'register' && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-200 font-bold">First Admin = Auto-Approved</p>
                  <p className="text-xs text-amber-300/70 mt-1">
                    If no admin exists, you'll be auto-approved. Otherwise, an existing admin must approve your request.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-300">{successMsg}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{errorMsg}</p>
            </div>
          )}

          {/* Pending Status Alert */}
          {errorMsg.includes('pending') && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm text-yellow-200 font-bold">Request Pending</p>
                <p className="text-xs text-yellow-300/70 mt-1">
                  An existing admin needs to approve your access from the Admin Panel → Users tab.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={mode === 'login' ? handleAdminLogin : handleAdminRegister}>
            {/* Name (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 block w-full border-0 rounded-xl py-3 bg-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 sm:text-sm transition-all"
                    placeholder="Your full name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 block w-full border-0 rounded-xl py-3 bg-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 sm:text-sm transition-all"
                  placeholder="admin@rentnear.app"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 block w-full border-0 rounded-xl py-3 bg-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Authenticating...' : 'Registering...'}
                </>
              ) : (
                <>
                  <Shield size={18} />
                  {mode === 'login' ? 'Sign In as Admin' : 'Register Admin Account'}
                </>
              )}
            </button>
          </form>

          {/* Back to user login */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
            >
              ← Back to User Login
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-xs text-gray-500">
          🔒 Admin access is monitored and logged. Unauthorized access attempts will be flagged.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
