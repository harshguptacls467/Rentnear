import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Skeleton from './Skeleton';

/**
 * GuestRoute: Restricts access to public-only auth routes (/login, /register, /forgot-password).
 * Authenticated users are automatically redirected to /home (or previous target page).
 */
const GuestRoute = () => {
  const { session, initialized } = useAuthStore();
  const location = useLocation();

  // 1. Show skeleton loader while session is re-hydrating on page startup
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // 2. Authenticated -> Redirect away from auth pages to /home (or previous destination)
  if (session) {
    const targetPath = location.state?.from?.pathname || '/home';
    return <Navigate to={targetPath} replace />;
  }

  // 3. Unauthenticated -> Render guest route content (/login, /register, /forgot-password)
  return <Outlet />;
};

export default GuestRoute;
