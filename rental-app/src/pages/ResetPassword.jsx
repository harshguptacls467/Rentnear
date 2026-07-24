import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import useAuthStore from '../store/authStore';
import FloatingInput from '../components/FloatingInput';
import PasswordStrength from '../components/PasswordStrength';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { logout } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [validationErrors, setValidationErrors] = useState({});

  // Safeguard: Ensure there is an active session (which is set by clicking the email reset link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (!activeSession) {
        console.warn('ResetPassword page accessed without an active reset token session. Redirecting to login.');
        showToast('Password reset link is invalid or expired.', 'error');
        navigate('/login', { replace: true });
      }
    };
    checkSession();
  }, [navigate, showToast]);

  const validate = () => {
    const errors = {};
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Your password has been reset successfully. Redirecting you to the login page...');
      showToast('Password updated successfully!', 'success');
      
      // Clean up session and state
      setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      console.error('Password reset update error:', err);
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
      showToast(err.message || 'Password update failed.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial blurs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <span className="text-white text-2xl font-black leading-none">R</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create new password
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Please enter your secure new password details below.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="bg-white/85 backdrop-blur-md py-8 px-4 border border-white/20 shadow-2xl rounded-3xl sm:px-10">

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

          <form className="space-y-5" onSubmit={handlePasswordReset}>
            {/* New Password */}
            <div>
              <FloatingInput
                label="New Password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors({ ...validationErrors, password: '' });
                  }
                }}
                icon={Lock}
                error={validationErrors.password}
                disabled={loading}
              />
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <FloatingInput
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword) {
                  setValidationErrors({ ...validationErrors, confirmPassword: '' });
                }
              }}
              icon={Lock}
              error={validationErrors.confirmPassword}
              disabled={loading}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating password...</span>
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
