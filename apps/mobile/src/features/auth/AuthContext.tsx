import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '../../services/authService';
import * as authService from '../../services/authService';
import { setAuthFailureCallback } from '../../services/apiClient';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  const doLogout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    setAuthFailureCallback(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasToken = await authService.hasStoredToken();
      if (!hasToken) {
        if (!cancelled) setIsRestoring(false);
        return;
      }
      const u = await authService.getStoredUser();
      if (!cancelled) {
        setUser(u);
      }
      setIsRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password });
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
  }, [doLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isRestoring,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
