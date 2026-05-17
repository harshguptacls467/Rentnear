import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = () => {
  const { session, initialized } = useAuthStore();

  // If Supabase hasn't finished checking the session yet, show a loading spinner
  // This prevents the screen from "flickering" to the login page on a hard refresh
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If checking is done and there is NO active session, redirect to Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If there IS a session, render the child routes (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
