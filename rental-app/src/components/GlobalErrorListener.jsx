import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const GlobalErrorListener = () => {
  const { showToast } = useToast();

  useEffect(() => {
    const sanitizeMessage = (msg) => {
      if (!msg) return 'An unexpected background action failed.';
      const str = String(msg);
      // Mask stack traces, SQL, Supabase internal URLs, or object details
      if (str.includes('PGRST') || str.includes('postgres') || str.includes('http') || str.includes('Error:') || str.length > 120) {
        return 'Network or database action temporarily unavailable.';
      }
      return str;
    };

    const handleUnhandledRejection = (event) => {
      console.error('[Global Promise Rejection Alert]', event.reason);
      
      const errorObj = event.reason;
      let rawMsg = 'An unexpected background action failed.';
      
      if (errorObj) {
        if (typeof errorObj === 'string') {
          rawMsg = errorObj;
        } else if (errorObj.message) {
          rawMsg = errorObj.message;
        }
      }

      showToast(`⚠️ Operation failed: ${sanitizeMessage(rawMsg)}`, 'error');
    };

    const handleGlobalError = (event) => {
      console.error('[Global Syntax/Runtime Error Alert]', event.error || event.message);
      
      // Skip extensions/chrome internals
      if (event.filename && (event.filename.includes('extension') || event.filename.includes('chrome-extension'))) {
        return;
      }
      
      const rawMsg = event.error?.message || event.message || 'An unexpected error occurred.';
      showToast(`❌ System alert: ${sanitizeMessage(rawMsg)}`, 'error');
    };

    const handleOnline = () => {
      showToast('⚡ Internet connection restored! Syncing data...', 'success');
    };

    const handleOffline = () => {
      showToast('📶 You are currently offline. Local cache database will be used.', 'warning');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  return null;
};

export default GlobalErrorListener;
