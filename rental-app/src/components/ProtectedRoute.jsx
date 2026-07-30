import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Skeleton from './Skeleton';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { session, user, initialized } = useAuthStore();
  const location = useLocation();

  // 1. Show skeleton loader while verifying session on startup
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to login (preserving target path)
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Admin-only route guard (resilient against hydration timing)
  const isAdmin = user?.is_admin || (session?.user?.email || '').toLowerCase().trim() === (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // 4. Authorized -> Render child routes
  return <Outlet />;
};

export default ProtectedRoute;
