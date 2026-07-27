import { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

/**
 * OtpVerification
 * ─────────────────
 * Props:
 *   email      {string}   – The address the OTP was sent to (display only).
 *   onVerify   {fn(token: string) => Promise<void>}  – Called when user submits valid 6-digit code.
 *   onResend   {fn() => Promise<void>}               – Called when user requests a new code.
 *   onBack     {fn()}                                – Called when user taps "← Back".
 *   loading    {boolean}                             – External loading flag (during verify).
 */
const OtpVerification = ({ email, onVerify, onResend, onBack, loading: externalLoading = false }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Start resend countdown timer
  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount without page scrolling
  useEffect(() => {
    inputRefs.current[0]?.focus({ preventScroll: true });
  }, []);

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    setError('');

    // Handle full paste or multi-character input
    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH);
      const newDigits = Array(OTP_LENGTH).fill('');
      const startIdx = clean.length === OTP_LENGTH ? 0 : index;
      pasted.split('').forEach((ch, i) => {
        if (startIdx + i < OTP_LENGTH) {
          newDigits[startIdx + i] = ch;
        }
      });
      setDigits(newDigits);
      const nextIndex = Math.min(startIdx + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus({ preventScroll: true });
      return;
    }

    // Single digit input (or replacement of existing character)
    const digit = clean.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus({ preventScroll: true });
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = '';
        setDigits(newDigits);
        setError('');
      } else if (index > 0) {
        newDigits[index - 1] = '';
        setDigits(newDigits);
        setError('');
        inputRefs.current[index - 1]?.focus({ preventScroll: true });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus({ preventScroll: true });
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus({ preventScroll: true });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
    setDigits(newDigits);
    setError('');
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus({ preventScroll: true });
  };

  const handleVerify = async () => {
    const token = digits.join('');
    if (token.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    try {
      await onVerify(token);
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus({ preventScroll: true }), 50);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await onResend();
      startCooldown();
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus({ preventScroll: true }), 50);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every(Boolean);
  const loading = externalLoading || resending;

  // Auto verify when all 6 digits are populated
  useEffect(() => {
    if (isComplete && !loading && !error) {
      handleVerify();
    }
  }, [isComplete]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Verify your email
        </h2>
        <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="font-bold text-gray-600">{email}</span>
        </p>

        {/* Demo Helper Badge */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold rounded-xl">
            <span>💡 Demo Mode:</span>
            <button
              type="button"
              onClick={() => {
                const demoDigits = ['1', '2', '3', '4', '5', '6'];
                setDigits(demoDigits);
                setError('');
              }}
              className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
            >
              Auto-fill 123456
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200/50 p-3.5 rounded-2xl flex items-start text-red-700 text-xs">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
        {/* OTP Digit Inputs */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 bg-white/80
                ${digit ? 'border-primary text-primary shadow-sm shadow-primary/10' : 'border-gray-200 text-gray-800'}
                ${error ? 'border-red-400' : ''}
                focus:border-primary focus:ring-2 focus:ring-primary/20
                disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          className="w-full py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 mb-4"
          disabled={!isComplete || loading}
        >
          {externalLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            'Verify & Continue'
          )}
        </Button>
      </form>

      {/* Resend Row */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="text-gray-400 font-medium">Didn't receive it?</span>
        {cooldown > 0 ? (
          <span className="text-gray-400 font-semibold">
            Resend in {cooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="flex items-center gap-1.5 font-bold text-primary hover:text-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        )}
      </div>

      {/* Back link */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="mt-5 flex items-center justify-center gap-1.5 w-full text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to sign up
        </button>
      )}
    </div>
  );
};

export default OtpVerification;
