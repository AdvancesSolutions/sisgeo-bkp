import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  /** true enquanto verifica o token ao carregar (evita 401 em cascata no dashboard) */
  isVerifying: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem('accessToken');
    const u = localStorage.getItem('user');
    if (t && u) try { return JSON.parse(u) as User; } catch { return null; }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(() => {
    const t = localStorage.getItem('accessToken');
    const u = localStorage.getItem('user');
    return !!(t && u);
  });

  // Ao carregar, se há token/user no localStorage, verifica com a API antes de mostrar o app (evita 401 em cascata).
  useEffect(() => {
    if (!user || !isVerifying) return;
    api
      .get('/auth/me')
      .then(() => setIsVerifying(false))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsVerifying(false);
      });
  }, [user, isVerifying]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isVerifying }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
