import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authStore } from '@/auth/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isVerifying } = useAuth();
  const location = useLocation();
  const hasToken = authStore.isAuthenticated();

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!user || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Verificando sessão...</p>
      </div>
    );
  }
  return <>{children}</>;
}
