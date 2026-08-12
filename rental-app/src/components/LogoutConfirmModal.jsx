import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const LogoutConfirmModal = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoggingOut) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoggingOut, onClose]);

  if (!isOpen) return null;

  const handleConfirmLogout = () => {
    try {
      logout();
      onClose();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 z-10 overflow-hidden"
        >
          {/* Close X Button */}
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            aria-label="Close confirmation dialog"
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
              <LogOut size={22} className="ml-0.5" />
            </div>
            
            <h3 id="logout-dialog-title" className="text-xl font-extrabold text-gray-900">
              Log Out
            </h3>
            
            <p id="logout-dialog-description" className="text-sm font-medium text-gray-600 px-2 leading-relaxed">
              Are you sure you want to log out?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoggingOut}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary transition-all text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold shadow-md shadow-red-500/20 focus-visible:ring-2 focus-visible:ring-red-400 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LogoutConfirmModal;
