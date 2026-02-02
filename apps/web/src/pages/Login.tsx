import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('admin@sigeo.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      if (res?.status === 401) {
        setError(res?.data?.message ?? 'E-mail ou senha incorretos.');
      } else {
        setError(res?.data?.message ?? 'Erro ao conectar. Verifique a rede e tente novamente.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">SIGEO</h1>
        <p className="text-slate-500 text-sm mb-6">Gestão Operacional</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
