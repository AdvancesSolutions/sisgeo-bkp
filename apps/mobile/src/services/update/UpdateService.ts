/**
 * Serviço de atualização OTA (EAS Update).
 * Suporta atualização silenciosa, update crítico e bloqueio contra checagens simultâneas.
 *
 * Em Expo Go / __DEV__ as atualizações são desabilitadas.
 */
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { API_BASE_URL } from '../../utils/env';

/** True se OTA está disponível */
function isUpdatesEnabled(): boolean {
  if (__DEV__) return false;
  if (Constants.appOwnership === 'expo') return false;
  return true;
}

export type UpdateCheckResult =
  | { available: true; manifest: Updates.Manifest }
  | { available: false };

export type UpdateApplyResult =
  | { success: true }
  | { success: false; error: Error };

/** Política de update do servidor */
export type AppConfig = {
  minRuntimeVersion: string;
  forceUpdate: boolean;
  message: string;
};

let isChecking = false;

/**
 * Lock: evita duas verificações simultâneas.
 */
async function withLock<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (isChecking) return fallback;
  isChecking = true;
  try {
    return await fn();
  } finally {
    isChecking = false;
  }
}

/**
 * Busca a política de update do servidor (app-config).
 * Retorna null se offline ou timeout.
 */
export async function fetchAppConfig(timeoutMs = 5000): Promise<AppConfig | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_BASE_URL}/app-config`, {
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) return null;
    const data = (await res.json()) as AppConfig;
    return data;
  } catch {
    return null;
  }
}

/**
 * Versão de runtime atual (ex.: "1.0.0" com policy appVersion).
 */
export function getRuntimeVersion(): string | null {
  return Updates.runtimeVersion ?? null;
}

/**
 * Compara versões semânticas (simples).
 * Retorna true se a > b.
 */
function isVersionGreater(a: string, b: string): boolean {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const va = partsA[i] ?? 0;
    const vb = partsB[i] ?? 0;
    if (va > vb) return true;
    if (va < vb) return false;
  }
  return false;
}

/**
 * Verifica se há atualização disponível.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!isUpdatesEnabled()) return { available: false };
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      return { available: true, manifest: result.manifest };
    }
    return { available: false };
  } catch {
    return { available: false };
  }
}

/**
 * Baixa a atualização em background (não aplica ainda).
 */
export async function fetchUpdateAsync(): Promise<UpdateApplyResult> {
  if (!isUpdatesEnabled()) {
    return { success: false, error: new Error('Updates not available') };
  }
  try {
    await Updates.fetchUpdateAsync();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Reinicia o app para aplicar a atualização baixada.
 */
export async function reloadAsync(): Promise<void> {
  if (!isUpdatesEnabled()) return;
  await Updates.reloadAsync();
}

/**
 * Verifica e baixa update silenciosamente em background.
 * Não aplica imediatamente; aplica na próxima abertura ou via modal.
 * Usa lock para evitar checagens simultâneas.
 */
export async function checkAndFetchUpdateSilently(): Promise<{
  downloaded: boolean;
  error?: Error;
}> {
  if (!isUpdatesEnabled()) return { downloaded: false };
  return withLock(
    async () => {
      const check = await checkForUpdate();
      if (!check.available) return { downloaded: false };

      const fetchResult = await fetchUpdateAsync();
      if (!fetchResult.success) {
        return { downloaded: false, error: fetchResult.error };
      }
      return { downloaded: true };
    },
    { downloaded: false },
  );
}

/**
 * Aplica o update já baixado (reload).
 */
export async function applyUpdateIfReady(): Promise<void> {
  if (!isUpdatesEnabled()) return;
  await reloadAsync();
}

/**
 * Fluxo de update crítico:
 * 1. Consulta app-config
 * 2. Se minRuntimeVersion > runtimeVersion atual → retorna 'store' (precisa atualizar na loja)
 * 3. Se forceUpdate=true e existe OTA → baixa e recarrega imediatamente
 * 4. Caso contrário → retorna sem ação
 */
export type ForceUpdateResult =
  | { action: 'none' }
  | { action: 'store'; message: string }
  | { action: 'reloaded'; ok: true }
  | { action: 'error'; message: string };

export async function forceUpdateFlow(): Promise<ForceUpdateResult> {
  if (!isUpdatesEnabled()) return { action: 'none' };

  const config = await fetchAppConfig();
  if (!config) return { action: 'none' };

  const currentVersion = getRuntimeVersion();
  if (currentVersion && isVersionGreater(config.minRuntimeVersion, currentVersion)) {
    return {
      action: 'store',
      message: config.message || 'Atualize o app na loja para continuar.',
    };
  }

  if (!config.forceUpdate) return { action: 'none' };

  const check = await checkForUpdate();
  if (!check.available) return { action: 'none' };

  const fetchResult = await fetchUpdateAsync();
  if (!fetchResult.success) {
    return {
      action: 'error',
      message: fetchResult.error?.message || 'Erro ao baixar atualização.',
    };
  }

  await reloadAsync();
  return { action: 'reloaded', ok: true };
}

/**
 * Informações atuais (debug).
 */
export function getCurrentUpdateInfo(): {
  updatesEnabled: boolean;
  updateId: string | null;
  channel: string | null;
  runtimeVersion: string | null;
} {
  return {
    updatesEnabled: isUpdatesEnabled(),
    updateId: Updates.updateId ?? null,
    channel: Updates.channel ?? null,
    runtimeVersion: Updates.runtimeVersion ?? null,
  };
}
