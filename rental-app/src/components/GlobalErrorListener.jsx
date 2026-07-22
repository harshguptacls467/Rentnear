import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const GlobalErrorListener = () => {
  const { showToast } = useToast();

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('[Global Promise Rejection Alert]', event.reason);
      
      // Extract a user-friendly error message
      const errorObj = event.reason;
      let message = 'An unexpected promise rejection occurred.';
      
      if (errorObj) {
        if (typeof errorObj === 'string') {
          message = errorObj;
        } else if (errorObj.message) {
          message = errorObj.message;
        }
      }

      showToast(`⚠️ Promise failure: ${message}`, 'error');
    };

    const handleGlobalError = (event) => {
      console.error('[Global Syntax/Runtime Error Alert]', event.error || event.message);
      
      // Skip extensions/chrome internals
      if (event.filename && (event.filename.includes('extension') || event.filename.includes('chrome-extension'))) {
        return;
      }
      
      const message = event.error?.message || event.message || 'An unexpected error occurred.';
      showToast(`❌ System error: ${message}`, 'error');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [showToast]);

  return null;
};

export default GlobalErrorListener;
