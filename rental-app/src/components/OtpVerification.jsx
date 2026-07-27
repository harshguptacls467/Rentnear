import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { ShieldCheck, RefreshCw, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const OtpVerification = ({
  email,
  onVerify,
  onResend,
  onChangeEmail,
  loading = false,
  externalError = '',
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const inputRefs = useRef([]);

  // Auto-focus first input on mount without scrolling the viewport
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 60-Second Countdown Timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Sync external error into local error
  useEffect(() => {
    if (externalError) {
      setLocalError(externalError);
    }
  }, [externalError]);

  const handleChange = (index, value) => {
    setLocalError('');
    setResendSuccess('');

    // Allow only digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];

    // Handle single character input
    if (value.length <= 1) {
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-advance to next input if digit entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus({ preventScroll: true });
      }
    }

    // Auto-trigger verification when all 6 digits are populated
    const filledCode = newOtp.join('');
    if (filledCode.length === 6 && !loading) {
      handleCompleteVerify(filledCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Backspace on empty field moves focus to previous input
        inputRefs.current[index - 1]?.focus({ preventScroll: true });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus({ preventScroll: true });
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus({ preventScroll: true });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setLocalError('');
    setResendSuccess('');
    const pastedData = e.clipboardData.getData('text').trim();

    // Extract first 6 numeric digits from pasted string
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus({ preventScroll: true });
      handleCompleteVerify(pastedData);
    } else if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, idx) => {
        if (idx < 6) newOtp[idx] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      inputRefs.current[nextFocus]?.focus({ preventScroll: true });

      if (digits.length >= 6) {
        handleCompleteVerify(digits.slice(0, 6).join(''));
      }
    }
  };

  const handleCompleteVerify = async (code) => {
    if (code.length !== 6) {
      setLocalError('Please enter all 6 digits.');
      return;
    }
    setLocalError('');
    try {
      await onVerify(code);
    } catch (err) {
      setLocalError(err.message || 'Invalid or expired verification code.');
    }
  };

  const handleResendClick = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setLocalError('');
    setResendSuccess('');
    try {
      await onResend();
      setResendTimer(60);
      setCanResend(false);
      setResendSuccess('A new 6-digit verification code has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus({ preventScroll: true });
    } catch (err) {
      setLocalError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto text-center"
    >
      {/* Icon Badge */}
      <div className="mx-auto w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 text-primary shadow-sm">
        <ShieldCheck className="w-8 h-8 text-primary" />
      </div>

      {/* Header */}
      <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
        Verify Your Email
      </h3>
      <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto mb-2">
        We sent a 6-digit verification code to
      </p>
      
      {/* Email Display with Change Email Button */}
      <div className="inline-flex items-center gap-2 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-800 mb-6">
        <span>{email}</span>
        {onChangeEmail && (
          <button
            type="button"
            onClick={onChangeEmail}
            disabled={loading}
            className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1 cursor-pointer"
            title="Change Email Address"
          >
            <Edit3 size={12} />
            <span className="underline text-[11px]">Edit</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {resendSuccess && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs text-left">
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          <span className="font-medium">{resendSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {localError && (
        <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-2xl flex items-center gap-2 text-red-700 text-xs text-left">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span className="font-medium">{localError}</span>
        </div>
      )}

      {/* 6 Digit Input Row */}
      <div className="flex justify-between items-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border transition-all outline-none bg-white shadow-sm ${
              digit
                ? 'border-primary ring-2 ring-primary/20 text-gray-900'
                : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-800'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        ))}
      </div>

      {/* Submit Button */}
      <Button
        type="button"
        onClick={() => handleCompleteVerify(otp.join(''))}
        disabled={loading || otp.join('').length !== 6}
        className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 mb-4"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Verifying Code...</span>
          </div>
        ) : (
          <span>Verify & Complete Registration</span>
        )}
      </Button>

      {/* Resend Code Footer */}
      <div className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5">
        <span>Didn't receive the code?</span>
        {canResend ? (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={resending || loading}
            className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            {resending ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : null}
            <span>Resend Code</span>
          </button>
        ) : (
          <span className="font-semibold text-gray-500">
            Resend in <span className="text-primary font-bold">{resendTimer}s</span>
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default OtpVerification;
