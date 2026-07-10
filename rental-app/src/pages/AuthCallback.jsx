import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL hash/query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Supabase can send token in different formats:
        // 1. Magic link / OTP: ?token_hash=...&type=email (or signup, recovery, etc.)
        // 2. OAuth: #access_token=...&refresh_token=...
        // 3. PKCE: ?code=...

        const tokenHash = queryParams.get('token_hash');
        const type = queryParams.get('type');
        const code = queryParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = queryParams.get('error') || hashParams.get('error');
        const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');

        // Handle explicit errors from Supabase redirect
        if (errorParam) {
          setStatus('error');
          setErrorMsg(errorDescription || errorParam);
          setTimeout(() => navigate('/login'), 4000);
          return;
        }

        // Case 1: token_hash present (email confirmation / OTP verification)
        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          });

          if (error) {
            console.error('OTP verification error:', error);
            setStatus('error');
            setErrorMsg(error.message);
            setTimeout(() => navigate('/login'), 4000);
            return;
          }

          if (data?.session) {
            setStatus('success');
            setTimeout(() => navigate('/home'), 1500);
            return;
          }
        }

        // Case 2: OAuth code (PKCE flow)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Code exchange error:', error);
            setStatus('error');
            setErrorMsg(error.message);
            setTimeout(() => navigate('/login'), 4000);
            return;
          }

          if (data?.session) {
            setStatus('success');
            setTimeout(() => navigate('/home'), 1500);
            return;
          }
        }

        // Case 3: Access token directly in hash (implicit flow)
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Set session error:', error);
            setStatus('error');
            setErrorMsg(error.message);
            setTimeout(() => navigate('/login'), 4000);
            return;
          }

          if (data?.session) {
            setStatus('success');
            setTimeout(() => navigate('/home'), 1500);
            return;
          }
        }

        // If nothing matched, redirect to login
        setStatus('error');
        setErrorMsg('Verification link is invalid or has expired. Please try again.');
        setTimeout(() => navigate('/login'), 4000);

      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setErrorMsg('Something went wrong. Please try logging in again.');
        setTimeout(() => navigate('/login'), 4000);
      }
    };

    handleCallback();
  }, [navigate, initialize]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">

        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h2>
            <p className="text-gray-500 text-sm">Please wait while we confirm your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified! ✅</h2>
            <p className="text-gray-500 text-sm">Your account has been confirmed. Redirecting you to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-sm text-red-600 mb-4 bg-red-50 px-4 py-3 rounded-lg">{errorMsg}</p>
            <p className="text-gray-400 text-xs">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
