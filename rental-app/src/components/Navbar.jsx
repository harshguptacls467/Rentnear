import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Navbar = () => {
  const { session, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-navy text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="font-bold text-2xl tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-black leading-none">R</span>
          </div>
          <Link to="/">RentNear</Link>
        </div>
        
        <div className="flex space-x-6 items-center">
          {session ? (
            <>
              {/* Authenticated Links */}
              <Link to="/home" className="text-gray-300 hover:text-white font-medium transition-colors">Dashboard</Link>
              <Link to="/products" className="text-gray-300 hover:text-white font-medium transition-colors">Discover</Link>
              <Link to="/list-product" className="text-gray-300 hover:text-white font-medium transition-colors">List Item</Link>
              <Link to="/bookings" className="text-gray-300 hover:text-white font-medium transition-colors">Bookings</Link>
              <Link to="/profile" className="text-gray-300 hover:text-white font-medium transition-colors">Profile</Link>
              
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
    </nav>
  );
};

export default Navbar;
