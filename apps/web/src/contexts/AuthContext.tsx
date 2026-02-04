import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import { authStore, type StoredUser } from '@/auth/authStore';

export type User = StoredUser;

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  /** true enquanto verifica o token ao carregar (evita 401 em cascata) */
  isVerifying: boolean;
  /** true quando há accessToken (e opcionalmente user em memória) */
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    authStore.isAuthenticated() ? authStore.getUser() : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(() => authStore.isAuthenticated());

  // Só chama /auth/me quando existir token. 401 = token expirado/inválido (limpa storage e redireciona para login).
  useEffect(() => {
    if (!authStore.isAuthenticated() || !isVerifying) return;
    api
      .get<User>('/auth/me')
      .then(({ data }) => {
        setUser(data);
        authStore.setUser(data);
        setIsVerifying(false);
      })
      .catch((err) => {
        // 401 é esperado quando o token expirou ou é inválido; limpa sem logar erro.
        if (err?.response?.status === 401) {
          authStore.clear();
          setUser(null);
        }
        setIsVerifying(false);
      });
  }, [isVerifying]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', { email, password });
      authStore.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      authStore.setUser(data.user);
      setUser(data.user);
      setIsVerifying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authStore.clear();
    setUser(null);
  }, []);

  const isAuthenticated = authStore.isAuthenticated() && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isVerifying,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
