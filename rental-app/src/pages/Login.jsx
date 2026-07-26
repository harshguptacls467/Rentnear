import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Mail, Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import FloatingInput from '../components/FloatingInput';
import OtpVerification from '../components/OtpVerification';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const signupSuccessMsg = location.state?.successMsg || '';
  const { session, logout, resendSignupOtp, verifySignupOtp } = useAuthStore();

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
      // Sign in with email/password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // User exists but hasn't verified their email yet — redirect to OTP screen.
        if (
          signInError.message?.toLowerCase().includes('email not confirmed') ||
          signInError.message?.toLowerCase().includes('not confirmed')
        ) {
          setPendingEmail(email);
          setOtpStep(true);
          showToast('Please verify your email first.', 'info');
          try {
            await resendSignupOtp(email);
          } catch (resendError) {
            console.error('Auto OTP resend failed:', resendError);
          }
          setLoading(false);
          return;
        }
        throw new Error(signInError.message);
      }

      // Retrieve the latest session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(sessionError.message);
      }

      const authUser = signInData.user;
      if (!authUser) {
        throw new Error('Authentication succeeded but no user object returned.');
      }

      // Fetch (or auto‑create) the public user profile
      const fullUser = await useAuthStore.getState().fetchPublicUser(authUser);

      // Update the auth store with the fresh session and user profile
      useAuthStore.setState({
        session: sessionData.session,
        user: fullUser,
        initialized: true,
      });

      showToast(`Welcome back, ${fullUser?.name || 'User'}!`, 'success');
      navigate('/home');
    } catch (error) {
      setErrorMsg(error.message || 'Invalid email or password.');
      showToast(error.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers (for login-flow email re-verification) ──────────────────
  const handleVerifyOtp = async (token) => {
    setVerifying(true);
    try {
      const fullUser = await verifySignupOtp(pendingEmail, token);
      showToast(`Welcome to RentNear, ${fullUser?.name || 'User'}!`, 'success');
      navigate('/home');
    } catch (err) {
      throw err;
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    await resendSignupOtp(pendingEmail);
    showToast('A new verification code has been sent.', 'info');
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
      showToast(error.message, 'error');
    } finally {
      setOauthLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Panel: Visual Branding (Cohesive with Register page, hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy justify-center items-center overflow-hidden">
        {/* Cover image background */}
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('/signup_cover.png')" }} />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        
        {/* Glassmorphic card overlay */}
        <div className="relative z-10 p-12 max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2.5rem] shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-xl font-black">R</span>
            </div>
            <span className="text-white text-lg font-bold">RentNear</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Rent items locally <br />
            with absolute confidence.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-8">
            Access thousands of certified rental products within your neighborhood. Create listings, rent gear safely, and scale the community sharing economy.
          </p>
          <div className="space-y-4">
            {[
              "100% verified neighborhood profiles",
              "Instant secure checkout & deposit escrow",
              "Local peer-to-peer delivery or meetup coordinates"
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white/95 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  ✓
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md z-10"
        >
          {/* Card Container */}
          <div className="bg-white/90 backdrop-blur-md border border-white/40 shadow-2xl rounded-[2rem] p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {otpStep ? (
                <OtpVerification
                  key="otp"
                  email={pendingEmail}
                  onVerify={handleVerifyOtp}
                  onResend={handleResendOtp}
                  onBack={() => setOtpStep(false)}
                  loading={verifying}
                />
              ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3 lg:hidden">
                <span className="text-white text-xl font-black">R</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                  Sign up for free
                </Link>
              </p>
            </div>

            {/* Signup Success Alert */}
            {signupSuccessMsg && (
              <div className="mb-4 bg-green-50 border border-green-200/50 p-4 rounded-2xl flex items-start text-green-700 text-xs animate-fadeIn">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="font-medium">{signupSuccessMsg}</p>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-4 bg-red-50 border border-red-200/50 p-4 rounded-2xl flex items-start text-red-700 text-xs animate-fadeIn">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleLogin}>
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

              {/* Password */}
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
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs px-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer text-gray-500 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer accent-primary"
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight size={16} />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            {/* Social Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                <span className="px-3 bg-white/70 backdrop-blur-sm text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={!!oauthLoading || loading}
                className="w-full py-3 px-4 bg-white text-gray-700 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-xs flex items-center justify-center gap-3 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {oauthLoading === 'google' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                ) : (
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            </div>

            {/* Admin Portal Portal Access link */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link
                to="/admin-login"
                className="text-[10px] text-gray-400 hover:text-primary transition-colors font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
              >
                🔒 Administrator Access Portal
              </Link>
            </div>
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
