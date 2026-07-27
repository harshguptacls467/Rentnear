import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { Mail, Lock, User, Smartphone, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import FloatingInput from '../components/FloatingInput';
import PasswordStrength from '../components/PasswordStrength';
import OtpVerification from '../components/OtpVerification';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { session, signUpUser, verifySignupOtp, resendSignupOtp } = useAuthStore();

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNum, setPhoneNum] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    if (phoneNum && !/^\d{10}$/.test(phoneNum.trim())) {
      errors.phone = 'Please enter a valid 10-digit number.';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!agreeTerms) {
      errors.terms = 'You must agree to the Terms and Conditions.';
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
      const authResult = await signUpUser({
        email,
        password,
        name,
        phone: fullPhone,
        role: formData.role,
      });

      // If Supabase already issued a session (auto-confirmation enabled), log in directly.
      if (authResult?.session) {
        showToast(`Welcome to RentNear, ${name}!`, 'success');
        navigate('/home', { replace: true });
        return;
      }

      // Email OTP verification required — show OTP screen
      setPendingEmail(email);
      setOtpStep(true);
      showToast('We sent a 6-digit verification code to your email.', 'info');
    } catch (error) {
      setErrorMsg(error.message || 'Registration failed. Please try again.');
      showToast(error.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Handlers
  const handleVerifyOtp = async (token) => {
    setVerifying(true);
    try {
      const fullUser = await verifySignupOtp(pendingEmail, token, {
        name: formData.name.trim(),
        phone: phoneNum.trim() ? `${countryCode} ${phoneNum.trim()}` : '',
        role: formData.role,
      });
      showToast(`Email verified! Welcome to RentNear, ${fullUser?.name || 'User'}!`, 'success');
      navigate('/home', { replace: true });
    } catch (err) {
      setVerifying(false);
      throw err;
    }
  };

  const handleResendOtp = async () => {
    await resendSignupOtp(pendingEmail);
    showToast('A new 6-digit code has been sent to your email.', 'info');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Panel: Visual Branding (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy justify-center items-center overflow-hidden">
        {/* Cover image background */}
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('/signup_cover.png')" }} />
        {/* Colorful gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        
        {/* Floating Glassmorphic Branding Card */}
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

      {/* Right Panel: Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-y-auto">
        {/* Ambient background glow */}
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
            {otpStep ? (
              <OtpVerification
                key="otp"
                email={pendingEmail}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onChangeEmail={() => setOtpStep(false)}
                loading={verifying}
              />
            ) : (
              <div>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="mx-auto w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3 lg:hidden">
                    <span className="text-white text-xl font-black">R</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Create Account
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>

                {/* Success Alert */}
                {successMsg && (
                  <div className="mb-4 bg-green-50 border border-green-200/50 p-4 rounded-2xl flex items-start text-green-700 text-xs animate-fadeIn">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="font-medium">{successMsg}</p>
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
                <form className="space-y-3" onSubmit={handleRegister}>
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

                  {/* Phone Number Selector Row */}
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-2.5 border border-gray-200 rounded-xl bg-white/50 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-800 cursor-pointer h-[50px]"
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

                  {/* Password */}
                  <FloatingInput
                    label="Create Password"
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    icon={Lock}
                    error={validationErrors.password}
                    disabled={loading}
                  />

                  {/* Confirm Password */}
                  <FloatingInput
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    icon={Lock}
                    error={validationErrors.confirmPassword}
                    disabled={loading}
                  />

                  {/* Password Strength Checklist */}
                  <PasswordStrength password={formData.password} />

                  {/* Role Toggle Selector (Low Profile) */}
                  <div className="flex items-center justify-between bg-gray-50/70 border border-gray-100 p-2 rounded-xl text-xs mt-1">
                    <span className="text-gray-500 font-semibold pl-1 uppercase tracking-wider text-[10px]">Workspace Role</span>
                    <div className="flex gap-1.5">
                      {[
                        { value: 'renter', label: 'Renter' },
                        { value: 'owner', label: 'Owner' },
                        { value: 'both', label: 'Both' }
                      ].map((roleItem) => (
                        <button
                          key={roleItem.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: roleItem.value })}
                          disabled={loading}
                          className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                            formData.role === roleItem.value
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-white text-gray-500 border border-gray-150 hover:bg-gray-100'
                          }`}
                        >
                          {roleItem.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          if (validationErrors.terms) {
                            setValidationErrors({ ...validationErrors, terms: '' });
                          }
                        }}
                        disabled={loading}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer mt-0.5 accent-primary"
                      />
                      <span className="text-gray-500 leading-tight">
                        I agree to the{' '}
                        <a href="/support#terms" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/support#privacy" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                          Privacy Policy
                        </a>.
                      </span>
                    </label>
                    {validationErrors.terms && (
                      <span className="text-[10px] text-red-500 font-semibold pl-1 mt-1 block">
                        {validationErrors.terms}
                      </span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Create Account
                          <ArrowRight size={16} />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
