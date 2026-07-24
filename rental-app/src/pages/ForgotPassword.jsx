import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import FloatingInput from '../components/FloatingInput';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const redirectToUrl = `${window.location.origin}/auth/callback?type=recovery`;
      console.log('Sending reset email with redirect to:', redirectToUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectToUrl,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('If this email is registered, we have sent instructions to reset your password. Please check your inbox.');
      showToast('Instructions sent successfully!', 'success');
      setEmail('');
    } catch (err) {
      console.error('Reset request error:', err);
      setErrorMsg(err.message || 'Failed to send password reset email. Please try again.');
      showToast(err.message || 'Reset request failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow effects */}
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
            Reset password
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Enter your email below and we'll send reset instructions.
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

          <form className="space-y-6" onSubmit={handleResetRequest}>
            <FloatingInput
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              disabled={loading}
            />

            <div>
              <Button type="submit" className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending instructions...</span>
                  </div>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center">
            <Link
              to="/login"
              className="text-xs text-gray-500 hover:text-primary transition-colors font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft size={14} strokeWidth={2.5} /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
