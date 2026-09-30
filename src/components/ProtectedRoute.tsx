import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Spinner } from './ui';

export function ProtectedRoute() {
  const status = useAuth((s) => s.status);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;
}
