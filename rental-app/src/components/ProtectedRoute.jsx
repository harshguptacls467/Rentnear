import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { session, initialized, user } = useAuthStore();

  // If Supabase hasn't finished checking the session yet, show a loading spinner
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If checking is done and there is NO active session, redirect to Login
  if (!session) {
    return <Navigate to={adminOnly ? "/admin-login" : "/login"} replace />;
  }

  // If session exists but user object is still being fetched from database, show loading spinner
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the route requires admin privileges, check the user object
  if (adminOnly) {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
    const userEmail = (user?.email || '').toLowerCase().trim();
    const hasAdminRights = user?.is_admin === true && userEmail === adminEmail;

    if (!hasAdminRights) {
      return <Navigate to="/admin-login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
