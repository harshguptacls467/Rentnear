import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { session, initialized, user } = useAuthStore();

  console.log('ProtectedRoute Auth State:', { session, initialized, user, isMockSession: session?.access_token === 'mock-token-demo' });

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
  // Allow both real Supabase sessions and mock demo sessions
  const isMockSession = session?.access_token === 'mock-token-demo';
  if (!session && !isMockSession) {
    console.log('ProtectedRoute: No session found, redirecting to login page');
    return <Navigate to={adminOnly ? "/admin-login" : "/login"} replace />;
  }

  // If session exists but user object is still being fetched from database, show loading spinner
  if (session && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the route requires admin privileges, check the user object
  if (adminOnly) {
    const userEmail = (user?.email || '').toLowerCase();
    const isSuperAdminEmail =
      userEmail.includes('admin') ||
      userEmail === 'harshguptacls467@gmail.com' ||
      userEmail === 'harshguptcls467@gmail.com' ||
      userEmail === 'demo@rentnear.app';
    const hasAdminRights = user?.is_admin === true || isSuperAdminEmail;

    if (!hasAdminRights) {
      console.log('ProtectedRoute: Admin access denied, redirecting to /admin-login', user);
      return <Navigate to="/admin-login" replace />;
    }
  }

  // If there IS a session, render the child routes (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
