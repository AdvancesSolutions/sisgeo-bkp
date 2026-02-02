import axios, { type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/env';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

let onAuthFailure: (() => void) | null = null;
export function setAuthFailureCallback(cb: () => void) {
  onAuthFailure = cb;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData: não enviar Content-Type para o axios definir multipart/form-data com boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (err) => Promise.reject(err)
);

apiClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && orig && !orig._retry) {
      orig._retry = true;
      const refresh = await AsyncStorage.getItem(REFRESH_KEY);
      if (refresh) {
        try {
          const { data } = await axios.post<{
            accessToken: string;
            refreshToken?: string;
          }>(`${API_BASE_URL}/auth/refresh`, { refreshToken: refresh });
          await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
          if (data.refreshToken)
            await AsyncStorage.setItem(REFRESH_KEY, data.refreshToken);
          orig.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(orig);
        } catch {
          await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, 'user']);
          onAuthFailure?.();
        }
      } else {
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, 'user']);
        onAuthFailure?.();
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;
