import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../context/ToastContext';
import FloatingInput from '../components/FloatingInput';
import PasswordStrength from '../components/PasswordStrength';
import OtpVerification from '../components/OtpVerification';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { sendPasswordResetOtp, verifyPasswordResetOtp, updateUserPassword } = useAuthStore();

  // Step state: 'email' | 'otp' | 'new_password' | 'success'
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Step 1: Send Password Reset OTP
  const handleSendEmail = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setValidationErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setValidationErrors({});

    try {
      await sendPasswordResetOtp(cleanEmail);
      showToast('A 6-digit password reset code has been sent to your email.', 'info');
      setStep('otp');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset code. Please try again.');
      showToast(err.message || 'Failed to send reset code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (token) => {
    setLoading(true);
    setErrorMsg('');

    try {
      await verifyPasswordResetOtp(email, token);
      showToast('Code verified! Please set your new password.', 'success');
      setStep('new_password');
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Resend: Resend OTP
  const handleResendOtp = async () => {
    await sendPasswordResetOtp(email);
    showToast('A new 6-digit code has been sent to your email.', 'info');
  };

  // Step 3: Save New Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setValidationErrors({});

    try {
      await updateUserPassword(newPassword);
      setStep('success');
      showToast('Password updated successfully!', 'success');

      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { successMsg: 'Password updated successfully. Please sign in with your new password.' },
        });
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Panel: Visual Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy justify-center items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('/signup_cover.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        
        <div className="relative z-10 p-12 max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2.5rem] shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-xl font-black">R</span>
            </div>
            <span className="text-white text-lg font-bold">RentNear</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Secure Account Recovery.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-8">
            Reset your password quickly and securely with one-time verification. Your account data remains fully protected.
          </p>
          <div className="space-y-4">
            {[
              "Encrypted email OTP verification",
              "Instant password updates",
              "Automated secure session termination"
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

      {/* Right Panel: Forgot Password Steps */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md z-10"
        >
          <div className="bg-white/90 backdrop-blur-md border border-white/40 shadow-2xl rounded-[2rem] p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: ENTER EMAIL */}
              {step === 'email' && (
                <motion.div
                  key="step-email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3">
                      <KeyRound size={24} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Forgot Password?
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      No worries! Enter your registered email address and we'll send you a 6-digit verification code.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="mb-4 bg-red-50 border border-red-200/50 p-4 rounded-2xl flex items-start text-red-700 text-xs animate-fadeIn">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSendEmail}>
                    <FloatingInput
                      label="Email Address"
                      type="email"
                      name="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) setValidationErrors({});
                      }}
                      icon={Mail}
                      error={validationErrors.email}
                      disabled={loading}
                    />

                    <div className="pt-2">
                      <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending Verification Code...</span>
                          </div>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Send Reset Code
                            <ArrowRight size={16} />
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                    <Link to="/login" className="text-xs text-gray-500 hover:text-primary transition-colors font-bold inline-flex items-center gap-1.5">
                      <ArrowLeft size={14} />
                      Back to Sign In
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: VERIFY OTP */}
              {step === 'otp' && (
                <motion.div
                  key="step-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <OtpVerification
                    email={email}
                    onVerify={handleVerifyOtp}
                    onResend={handleResendOtp}
                    onChangeEmail={() => {
                      setStep('email');
                      setErrorMsg('');
                    }}
                    loading={loading}
                  />
                </motion.div>
              )}

              {/* STEP 3: CREATE NEW PASSWORD */}
              {step === 'new_password' && (
                <motion.div
                  key="step-new-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 mb-3">
                      <ShieldCheck size={24} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Set New Password
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      Your identity has been verified. Please enter your new secure password.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="mb-4 bg-red-50 border border-red-200/50 p-4 rounded-2xl flex items-start text-red-700 text-xs animate-fadeIn">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleUpdatePassword}>
                    <FloatingInput
                      label="New Password"
                      type="password"
                      name="newPassword"
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (validationErrors.newPassword) setValidationErrors({ ...validationErrors, newPassword: '' });
                      }}
                      icon={Lock}
                      error={validationErrors.newPassword}
                      disabled={loading}
                    />

                    <FloatingInput
                      label="Confirm New Password"
                      type="password"
                      name="confirmPassword"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (validationErrors.confirmPassword) setValidationErrors({ ...validationErrors, confirmPassword: '' });
                      }}
                      icon={Lock}
                      error={validationErrors.confirmPassword}
                      disabled={loading}
                    />

                    <PasswordStrength password={newPassword} />

                    <div className="pt-2">
                      <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Updating Password...</span>
                          </div>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Update Password
                            <ArrowRight size={16} />
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 'success' && (
                <motion.div
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
                    <CheckCircle size={36} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                    Password Reset Complete!
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                    Your password has been successfully updated. Redirecting you to the sign-in page...
                  </p>
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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

export default ForgotPassword;
