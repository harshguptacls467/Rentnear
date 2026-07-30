import { Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Skeleton from './Skeleton';

/**
 * GuestRoute: Allows access to auth pages (/login, /register, /forgot-password)
 * without forcibly blocking or redirecting away authenticated users who want to switch accounts.
 */
const GuestRoute = () => {
  const { initialized } = useAuthStore();

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

  return <Outlet />;
};

export default GuestRoute;
