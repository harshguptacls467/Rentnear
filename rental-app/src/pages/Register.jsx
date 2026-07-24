import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import FloatingInput from '../components/FloatingInput';
import PasswordStrength from '../components/PasswordStrength';
import { motion } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { session } = useAuthStore();

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNum, setPhoneNum] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'both',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Redirect if already logged in
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
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (phoneNum && !/^\d{10}$/.test(phoneNum.trim())) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const name = formData.name.trim();
    const fullPhone = phoneNum.trim() ? `${countryCode} ${phoneNum.trim()}` : '';

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
            phone: fullPhone,
            role: formData.role,
          }
        }
      });

      if (authError) throw new Error(authError.message);

      const user = authData?.user;
      if (!user) throw new Error('Account creation failed.');

      if (authData.session) {
        const fullUser = await useAuthStore.getState().fetchPublicUser(authData.user);
        useAuthStore.setState({
          session: authData.session,
          user: fullUser,
          initialized: true,
        });
        showToast(`Welcome to RentNear, ${name}!`, 'success');
        navigate('/home');
        return;
      }

      // Fallback: Check immediate sign-in (if verification emails are disabled/mocked in project configuration)
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInData?.session) {
        const fullUser = await useAuthStore.getState().fetchPublicUser(signInData.user);
        useAuthStore.setState({
          session: signInData.session,
          user: fullUser,
          initialized: true,
        });
        showToast(`Welcome to RentNear, ${name}!`, 'success');
        navigate('/home');
        return;
      }

      setSuccessMsg('Account created successfully! Please check your email to verify your account, then log in.');
      showToast('Registration successful! Check your email.', 'success');
      
      // Auto redirect to Login page after 4 seconds
      setTimeout(() => {
        navigate('/login', { state: { successMsg: 'Account created! Please sign in using your verified email.' } });
      }, 4500);

    } catch (error) {
      console.error('Registration error:', error);
      setErrorMsg(error.message || 'Registration failed. Please try again.');
      showToast(error.message || 'Registration failed.', 'error');
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
      {/* Dynamic colorful blobs */}
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Sign in here
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
          
          {/* Social Sign Up */}
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
              {oauthLoading === 'google' ? 'Connecting...' : 'Sign up with Google'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
              <span className="px-3 bg-white/70 backdrop-blur-sm text-gray-400">Or sign up with email</span>
            </div>
          </div>

          {successMsg && (
            <div className="mb-6 bg-green-50 border border-green-200/50 p-4 rounded-2xl flex items-start text-green-700 text-sm animate-fadeIn">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200/50 p-4 rounded-2xl flex items-start text-red-700 text-sm animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Full Name */}
            <FloatingInput
              label="Full Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              icon={User}
              error={validationErrors.name}
              disabled={loading}
            />

            {/* Email Address */}
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

            {/* Phone Input with Country Code Selector */}
            <div>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 border border-gray-200 rounded-xl bg-white/50 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-800 disabled:opacity-60 cursor-pointer"
                  disabled={loading}
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                </select>
                <div className="flex-1">
                  <FloatingInput
                    label="Mobile Number (Optional)"
                    type="tel"
                    name="phone"
                    value={phoneNum}
                    onChange={(e) => {
                      setPhoneNum(e.target.value);
                      if (validationErrors.phone) {
                        setValidationErrors({ ...validationErrors, phone: '' });
                      }
                    }}
                    icon={Smartphone}
                    error={validationErrors.phone}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Role Radio Picker cards */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
                Select Workspace Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'renter', title: 'Renter', desc: 'Rent products' },
                  { value: 'owner', title: 'Owner', desc: 'List assets' },
                  { value: 'both', title: 'Both', desc: 'Rent & list' },
                ].map((item) => {
                  const isSelected = formData.role === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={loading}
                      onClick={() => setFormData({ ...formData, role: item.value })}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer text-center relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-gray-150 bg-white/55 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-xs font-bold">{item.title}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 leading-none transition-colors group-hover:text-gray-500">
                        {item.desc}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password Field & Strength Indicator */}
            <div>
              <FloatingInput
                label="Create Password"
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                disabled={loading}
              />
              <PasswordStrength password={formData.password} />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
