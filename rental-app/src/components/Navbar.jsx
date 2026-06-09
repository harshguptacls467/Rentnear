import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { session, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-navy text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="font-bold text-2xl tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-black leading-none">R</span>
          </div>
          <Link to="/">RentNear</Link>
        </div>
        
        {/* Hamburger Icon (Mobile Only) */}
        <button 
          className="md:hidden text-white focus:outline-none p-2"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={28} />
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          {session ? (
            <>
              {/* Authenticated Links */}
              <Link to="/home" className="text-gray-300 hover:text-white font-medium transition-colors">Dashboard</Link>
              <Link to="/products" className="text-gray-300 hover:text-white font-medium transition-colors">Discover</Link>
              <Link to="/map" className="text-gray-300 hover:text-white font-medium transition-colors border border-gray-600 px-3 py-1 rounded-full text-xs">Map View</Link>
              <Link to="/list-product" className="text-gray-300 hover:text-white font-medium transition-colors">List Item</Link>
              <Link to="/my-listings" className="text-gray-300 hover:text-white font-medium transition-colors">My Listings</Link>
              <Link to="/bookings" className="text-gray-300 hover:text-white font-medium transition-colors">Bookings</Link>
              
              <NotificationBell />
              
              <Link to="/profile" className="text-gray-300 hover:text-white font-medium transition-colors">Profile</Link>
              
              {/* Show Admin link only if user is an admin */}
              {user?.is_admin && (
                <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">Admin Panel</Link>
              )}
              
              <button 
                onClick={handleLogout}
                className="bg-red-500/10 text-red-400 border border-red-500/30 px-5 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all ml-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Public Links */}
              <Link to="/" className="text-gray-300 hover:text-white font-medium transition-colors">Home</Link>
              <Link to="/products" className="text-gray-300 hover:text-white font-medium transition-colors">Discover</Link>
              
              <div className="flex items-center gap-3 ml-2">
                <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors px-2">Login</Link>
                <Link to="/register" className="bg-primary text-white px-5 py-2 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-[0_0_15px_rgba(13,158,117,0.3)]">
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Overlay & Slide-in Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeMenu}
          ></motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            key="mobile-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            ref={menuRef} 
            className="fixed top-0 right-0 z-[101] w-72 bg-navy h-full shadow-2xl flex flex-col md:hidden"
          >
              <div className="flex justify-between items-center p-6 border-b border-gray-800">
                <span className="font-bold text-xl text-white">Menu</span>
                <div className="flex items-center gap-4">
                  {session && <NotificationBell />}
                  <button onClick={closeMenu} className="text-gray-400 hover:text-white p-1">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col p-6 space-y-6 overflow-y-auto h-full pb-20">
                {session ? (
                  <>
                    <Link to="/home" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">Dashboard</Link>
                    <Link to="/products" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">Discover</Link>
                    <Link to="/map" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">Map View</Link>
                    <Link to="/list-product" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">List Item</Link>
                    <Link to="/my-listings" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">My Listings</Link>
                    <Link to="/bookings" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">Bookings</Link>
                    <Link to="/profile" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">Profile</Link>
                    
                    {user?.is_admin && (
                      <Link to="/admin" onClick={closeMenu} className="text-yellow-400 hover:text-yellow-300 text-lg font-bold">Admin Panel</Link>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="mt-4 bg-red-500/10 text-red-400 border border-red-500/30 px-5 py-3 rounded-xl font-bold w-full text-center hover:bg-red-500 hover:text-white transition-all"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">Home</Link>
                    <Link to="/products" onClick={closeMenu} className="text-gray-300 hover:text-white text-lg font-medium">Discover</Link>
                    
                    <div className="pt-6 mt-6 border-t border-gray-800 flex flex-col gap-4">
                      <Link to="/login" onClick={closeMenu} className="text-center text-white font-bold border border-gray-600 px-5 py-3 rounded-xl">Login</Link>
                      <Link to="/register" onClick={closeMenu} className="text-center bg-primary text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-primary/30">
                        Sign Up
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
