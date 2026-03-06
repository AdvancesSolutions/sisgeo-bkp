/**
 * Armazenamento centralizado de tokens (MVP: localStorage com prefixo por ambiente).
 * Nunca logar tokens no console. Limpar em 401 de refresh.
 */
const ENV_PREFIX = import.meta.env.VITE_AUTH_KEY_PREFIX ?? 'sigeo';

const KEY_ACCESS = `${ENV_PREFIX}_accessToken`;
const KEY_REFRESH = `${ENV_PREFIX}_refreshToken`;
const KEY_USER = `${ENV_PREFIX}_user`;

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  setor_id?: string;
  ativo?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const authStore = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(KEY_ACCESS);
    } catch {
      return null;
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(KEY_REFRESH);
    } catch {
      return null;
    }
  },

  setTokens(pair: TokenPair): void {
    try {
      localStorage.setItem(KEY_ACCESS, pair.accessToken);
      localStorage.setItem(KEY_REFRESH, pair.refreshToken);
    } catch {
      // quota ou privado; não logar
    }
  },

  setUser(user: StoredUser): void {
    try {
      localStorage.setItem(KEY_USER, JSON.stringify(user));
    } catch {
      // não logar
    }
  },

  getUser(): StoredUser | null {
    try {
      const raw = localStorage.getItem(KEY_USER);
      if (!raw) return null;
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY_ACCESS);
      localStorage.removeItem(KEY_REFRESH);
      localStorage.removeItem(KEY_USER);
    } catch {
      // não logar
    }
  },

  /** Remove só o accessToken (para simular expiração e forçar refresh na próxima request). */
  clearAccessTokenOnly(): void {
    try {
      localStorage.removeItem(KEY_ACCESS);
    } catch {
      // não logar
    }
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
