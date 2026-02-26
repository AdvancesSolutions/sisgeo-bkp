import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** RBAC: ADMIN, SUPER_ADMIN, SUPERVISOR ou GESTOR acessam; demais veem 403. */
export function AdminOrSupervisorOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;

  const role = String(user.role ?? '').toUpperCase().replace(/\s/g, '_');
  const hasAccess =
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'SUPERVISOR' ||
    role === 'GESTOR' ||
    role.includes('ADMIN') ||
    role.includes('SUPERVISOR') ||
    role.includes('GESTOR');

  if (!hasAccess) {
    const noRole = !role || role.length === 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
        <ShieldX className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-semibold text-slate-800">Acesso negado (403)</h2>
        <p className="text-slate-600 text-center max-w-md">
          {noRole
            ? 'Seu usuário não possui perfil de administrador/supervisor. Faça logout e entre com uma conta que tenha permissão (ex.: admin@empresa.com), ou contate o administrador.'
            : 'Esta área é restrita a administradores e supervisores.'}
        </p>
        <Link
          to="/dashboard"
          className="mt-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          Voltar ao painel
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
