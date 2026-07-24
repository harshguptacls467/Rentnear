import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import FloatingInput from '../components/FloatingInput';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const signupSuccessMsg = location.state?.successMsg || '';
  const { session, logout } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Already logged in → redirect
  useEffect(() => {
    if (session) {
      navigate('/home', { replace: true });
    }
  }, [session, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setErrorMsg('');

    // Clear any stale session first
    await logout();

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    try {
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

      // Re-use store synchronizer to obtain clean public user profiles
      const fullUser = await useAuthStore.getState().fetchPublicUser(authData.user);

      useAuthStore.setState({
        session: authData.session,
        user: fullUser,
        initialized: true,
      });

      showToast(`Welcome back, ${fullUser?.name || 'User'}!`, 'success');
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg(error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const [oauthLoading, setOauthLoading] = useState('');

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(provider);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setOauthLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blur effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <span className="text-white text-2xl font-black leading-none">R</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="bg-white/85 backdrop-blur-md py-8 px-4 border border-white/20 shadow-2xl rounded-3xl sm:px-10">
          
          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={!!oauthLoading || loading}
              className="w-full py-3 px-4 bg-white text-gray-700 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center justify-center gap-3 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {oauthLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
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
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
              <span className="px-3 bg-white/70 backdrop-blur-sm text-gray-400">Or sign in with email</span>
            </div>
          </div>

          {/* Signup Success Message */}
          {signupSuccessMsg && (
            <div className="mb-6 bg-green-50 border border-green-200/50 p-4 rounded-2xl flex items-start text-green-700 text-sm animate-fadeIn">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{signupSuccessMsg}</p>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200/50 p-4 rounded-2xl flex items-start text-red-700 text-sm animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Email */}
            <FloatingInput
              label="Email Address"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              icon={Mail}
              error={validationErrors.email}
              disabled={loading}
            />

            {/* Password & Forgot link */}
            <div>
              <FloatingInput
                label="Password"
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                error={validationErrors.password}
                disabled={loading}
              />
              <div className="flex justify-end mt-1 px-1">
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link
              to="/admin-login"
              className="text-xs text-gray-400 hover:text-primary transition-colors font-medium flex items-center justify-center gap-1.5"
            >
              🔒 Platform Administrator Portal
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
