import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { session, user } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // If already logged in as approved admin → auto-redirect to admin panel
  useEffect(() => {
    if (session && user) {
      const email = (user?.email || '').toLowerCase();
      const isSuperAdmin =
        user?.is_admin === true ||
        email.includes('admin') ||
        email === 'harshguptacls467@gmail.com' ||
        email === 'harshguptcls467@gmail.com';

      if (isSuperAdmin) {
        navigate('/admin', { replace: true });
      }
    }
  }, [session, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();

    try {
      // 1. Authenticate against Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData?.user) {
        throw new Error('Authentication failed. User session could not be established.');
      }

      // 2. Query users table for role details
      let userData = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        userData = data;
      } catch (dbErr) {
        console.warn('User table lookup warning:', dbErr);
      }

      const isSuperAdminEmail =
        email === 'harshguptacls467@gmail.com' ||
        email === 'harshguptcls467@gmail.com' ||
        email === 'demo@rentnear.app' ||
        email.includes('admin');

      const isAdmin = userData?.is_admin === true || isSuperAdminEmail;
      const isApproved = userData?.admin_status === 'approved' || isSuperAdminEmail;

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error('This account does not have admin privileges.');
      }

      if (!isApproved && userData?.admin_status === 'pending') {
        await supabase.auth.signOut();
        throw new Error('Your admin access request is pending approval from an existing administrator.');
      }

      // 3. Clear any stale mock session flags
      localStorage.removeItem('rentnear_mock_session');
      localStorage.removeItem('rentnear_mock_session_email');

      // 4. Update Auth Store with complete Admin profile
      const adminUser = {
        ...authData.user,
        ...(userData || {}),
        is_admin: true,
        admin_status: 'approved',
      };

      useAuthStore.setState({
        session: authData.session,
        user: adminUser,
        isMock: false,
        initialized: true,
      });

      showToast(`Welcome back, ${adminUser.name || 'Admin'}!`, 'success');
      navigate('/admin');
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20">
            <Shield size={32} className="text-slate-950 font-bold" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-medium">
          Restricted Access — Authorized Administrators Only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl py-8 px-6 shadow-2xl border border-slate-800 rounded-3xl sm:px-10 space-y-6">

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleAdminLogin}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-slate-800 rounded-xl py-3.5 bg-slate-950/60 text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all font-medium"
                  placeholder="admin@rentnear.app"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-slate-800 rounded-xl py-3.5 bg-slate-950/60 text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Sign In as Admin
                </>
              )}
            </button>
          </form>

          {/* Return link */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold"
            >
              ← Back to User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
