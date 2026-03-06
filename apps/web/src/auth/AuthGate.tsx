import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authStore } from '@/auth/authStore';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * Protege rotas: só renderiza children quando há token válido e /auth/me confirmou.
 * Se não houver token ou usuário, redireciona para /login.
 * Enquanto verifica sessão, exibe loading.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { user, isVerifying } = useAuth();
  const location = useLocation();
  const hasToken = authStore.isAuthenticated();

  if (!hasToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Verificando sessão...</p>
      </div>
    );
  }

  return <>{children}</>;
}
