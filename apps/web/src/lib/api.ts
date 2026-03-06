import axios, { type InternalAxiosRequestConfig } from 'axios';
import { authStore } from '@/auth/authStore';

// Em produção (Amplify) defina VITE_API_URL nas variáveis de ambiente (ex.: https://dapotha14ic3h.cloudfront.net).
let baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : undefined);
if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && baseURL?.startsWith('http://')) {
  baseURL = baseURL.replace(/^http:\/\//i, 'https://');
}

export const api = axios.create({
  baseURL: baseURL || '',
  headers: { 'Content-Type': 'application/json' },
});

function getRefreshUrl(): string {
  const b = baseURL || '';
  if (b) return b.replace(/\/$/, '') + '/auth/refresh';
  return '/auth/refresh';
}

function isAuthRoute(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

// Anexa Authorization quando houver token. Sem token em rota não-auth rejeita (evita tempestade de requests sem sessão); ProtectedRoute já redireciona para /login.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!token && !isAuthRoute(config.url)) {
    return Promise.reject(new Error('NO_AUTH'));
  }
  return config;
});

// Refresh lock: uma única renovação por vez; requisições 401 aguardam e são refeitas com o novo token.
let refreshPromise: Promise<string | null> | null = null;

function doRefresh(): Promise<string | null> {
  const refresh = authStore.getRefreshToken();
  if (!refresh) return Promise.resolve(null);
  const url = getRefreshUrl();
  return axios
    .post<{ accessToken: string; refreshToken?: string }>(
      url,
      { refreshToken: refresh },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      },
    )
    .then(({ data }) => {
      authStore.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? refresh,
      });
      return data.accessToken;
    })
    .catch(() => null);
}

/** Chamado quando refresh falha: limpa sessão e redireciona com mensagem "Sessão expirada". */
function onSessionExpired(): void {
  authStore.clear();
  try {
    sessionStorage.setItem('sessionExpired', '1');
  } catch {
    // ignorar
  }
  window.location.href = '/login?sessionExpired=1';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig: RetryConfig = err.config;
    if (err.response?.status !== 401 || orig._retry) {
      return Promise.reject(err);
    }

    if (isAuthRoute(orig.url)) {
      return Promise.reject(err);
    }

    orig._retry = true;

    if (!refreshPromise) {
      refreshPromise = doRefresh();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      orig.headers.Authorization = `Bearer ${newToken}`;
      return api(orig);
    }

    onSessionExpired();
    const authErr = Object.assign(err, { __authRedirect: true } as { __authRedirect?: boolean });
    return Promise.reject(authErr);
  },
);

export default api;
