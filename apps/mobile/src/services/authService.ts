import { loginSchema } from '@sigeo/shared';
import type { LoginInput } from '@sigeo/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const body = loginSchema.parse(input);
  const { data } = await apiClient.post<LoginResult>('/auth/login', body);
  await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
  await AsyncStorage.setItem(REFRESH_KEY, data.refreshToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function hasStoredToken(): Promise<boolean> {
  const t = await AsyncStorage.getItem(TOKEN_KEY);
  return !!t;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, USER_KEY]);
}
