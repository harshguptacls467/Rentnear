import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/auth/useCurrentUser";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    // simple loading state while we check auth
    return <div>Loading...</div>;
  }

  if (!user || isError) {
    // no authenticated user – redirect to login page
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
