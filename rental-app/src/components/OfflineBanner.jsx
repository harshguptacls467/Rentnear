import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Crash-Resistant Offline Banner
 * Detects network disconnects and notifies the user with a non-intrusive warning
 * while enabling graceful degradation to local/cached state.
 */
const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 z-[9999] shadow-md animate-slide-down">
      <WifiOff size={14} />
      <span>You are currently offline. Working with local cached data.</span>
      <button 
        onClick={() => setIsOffline(!navigator.onLine)}
        className="ml-2 px-2 py-0.5 bg-amber-700 hover:bg-amber-800 rounded text-[11px] font-bold flex items-center gap-1 transition-all"
      >
        <RefreshCw size={10} /> Check Connection
      </button>
    </div>
  );
};

export default OfflineBanner;
