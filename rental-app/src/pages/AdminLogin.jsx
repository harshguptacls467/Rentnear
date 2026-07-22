import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

const ADMIN_CREDENTIALS = [
  { email: 'admin@rentnear.app', password: 'admin123' },
  { email: 'harshguptacls467@gmail.com', password: 'Harsh@130724' },
  { email: 'harshguptcls467@gmail.com', password: 'Harsh@130724' },
];

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { session, user, mockLogin, logout } = useAuthStore();

  const [formData, setFormData] = useState({
    email: 'admin@rentnear.app',
    password: 'admin123',
  });

  // If already logged in as admin → auto-redirect to admin panel
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

  const executeAdminLogin = async (email, password) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      // Check against allowed admin credentials or general admin email format
      const validCred = ADMIN_CREDENTIALS.find(
        (c) => c.email.toLowerCase() === cleanEmail && c.password === cleanPassword
      );

      // Try Supabase auth first if available
      const isSupabaseValid =
        supabase &&
        import.meta.env.VITE_SUPABASE_URL &&
        !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-ref');

      let authSuccess = false;

      if (isSupabaseValid) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`,
            {
              method: 'POST',
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
            }
          );
          const resJson = await res.json();
          if (res.ok && resJson.access_token) {
            authSuccess = true;
            await supabase.auth.setSession({
              access_token: resJson.access_token,
              refresh_token: resJson.refresh_token,
            });
            
            const adminUser = {
              ...resJson.user,
              name: resJson.user?.user_metadata?.name || 'Harsh Gupta (Admin)',
              email: cleanEmail,
              is_admin: true,
              admin_status: 'approved',
              kyc_verified: true,
            };

            useAuthStore.setState({
              session: resJson,
              user: adminUser,
              isMock: false,
              initialized: true,
            });
          }
        } catch {
          // Fallback to local admin login
        }
      }

      // If Supabase direct login wasn't used or failed, validate local credentials
      if (!authSuccess) {
        if (!validCred && !cleanEmail.includes('admin')) {
          throw new Error('Invalid Admin Credentials. Please use admin@rentnear.app / admin123');
        }

        await logout();
        mockLogin(cleanEmail, {
          name: 'Super Admin',
          is_admin: true,
          admin_status: 'approved',
          kyc_verified: true,
        });

        // Force super admin properties in store
        const state = useAuthStore.getState();
        const updatedUser = {
          ...state.user,
          email: cleanEmail,
          is_admin: true,
          admin_status: 'approved',
        };
        useAuthStore.setState({ user: updatedUser });
      }

      showToast('Welcome to RentNear Admin Panel!', 'success');
      navigate('/admin');
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeAdminLogin(formData.email, formData.password);
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
          RentNear Platform Administration & Control Panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl py-8 px-6 shadow-2xl border border-slate-800 rounded-3xl sm:px-10 space-y-6">

          {/* Quick Demo Login Box */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" /> Instant Admin Login
              </span>
              <span className="text-amber-400/80 font-mono">Auto-Filled</span>
            </div>
            <button
              type="button"
              onClick={() => executeAdminLogin('admin@rentnear.app', 'admin123')}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <CheckCircle size={16} /> 1-Click Admin Login
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                  className="pl-10 block w-full border border-slate-800 rounded-xl py-3 bg-slate-950/60 text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all font-medium"
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
                  className="pl-10 block w-full border border-slate-800 rounded-xl py-3 bg-slate-950/60 text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Admin Credentials Info Box */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">🔑 Default Admin Credentials:</p>
              <p className="font-mono text-slate-400">Email: <span className="text-amber-400">admin@rentnear.app</span> | Password: <span className="text-amber-400">admin123</span></p>
              <p className="font-mono text-slate-400">Email: <span className="text-amber-400">harshguptacls467@gmail.com</span> | Password: <span className="text-amber-400">Harsh@130724</span></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Shield size={18} className="text-amber-400" />
                  Sign In to Admin Panel
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
              ← Back to Renter / Owner Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
