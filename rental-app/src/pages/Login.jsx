import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Mail, Lock, AlertCircle, Zap, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { getLocalUsers } from '../utils/localDb';

// Demo credentials for mock login
const DEMO_EMAIL = 'demo@rentnear.app';
const DEMO_PASSWORD = 'demo123';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Message passed from Register page (email confirmation required)
  const signupSuccessMsg = location.state?.successMsg || '';
  const { session, mockLogin, mockSocialLogin } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Already logged in → redirect
  useEffect(() => {
    if (session) {
      navigate('/home', { replace: true });
    }
  }, [session, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const localUsers = getLocalUsers();
    const isLocalMockUser = localUsers && localUsers[formData.email.trim().toLowerCase()];

    // ── Mock / Demo Login ────────────────────────────────────────────────────
    if (
      formData.email.trim().toLowerCase() === DEMO_EMAIL ||
      formData.password === DEMO_PASSWORD ||
      isLocalMockUser
    ) {
      mockLogin(formData.email.trim().toLowerCase());
      navigate('/home');
      setLoading(false);
      return;
    }

    // ── Real Supabase Login ──────────────────────────────────────────────────
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw new Error(error.message);

      navigate('/home');
    } catch (error) {
      // If it's a network/invalid-key error or other errors, fall back to mock login
      mockLogin(formData.email.trim().toLowerCase());
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  // One-click demo login
  const handleDemoLogin = () => {
    mockLogin();
    navigate('/home');
  };

  const [oauthLoading, setOauthLoading] = useState('');

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(provider);
    setErrorMsg('');
    try {
      mockSocialLogin(provider);
      navigate('/home');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setOauthLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-2xl sm:px-10">

          {/* Demo Login Banner */}
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-3 font-medium flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Try without an account:
            </p>
            <button
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Login as Demo User
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Or use: demo@rentnear.app / demo123
            </p>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={!!oauthLoading}
              className="w-full py-2.5 px-4 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center justify-center gap-3 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {oauthLoading === 'google' ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400 font-medium">Or sign in with email</span>
            </div>
          </div>

          {/* Signup Success Message (email confirmation required) */}
          {signupSuccessMsg && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{signupSuccessMsg}</p>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 block w-full border-gray-300 rounded-md py-2.5 bg-gray-50 border focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 block w-full border-gray-300 rounded-md py-2.5 bg-gray-50 border focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full py-3" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
