/**
 * Serviço de atualização OTA (EAS Update).
 * Verifica e aplica atualizações sem precisar de nova APK.
 *
 * No Expo Go (Constants.appOwnership === 'expo'), as atualizações são desabilitadas.
 * Em builds release (APK/IPA), as atualizações funcionam normalmente.
 */
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

/** True se OTA está disponível (build standalone, não Expo Go, não __DEV__). */
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

/**
 * Verifica se há atualização disponível.
 * Retorna { available: true, manifest } se houver; { available: false } caso contrário.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!isUpdatesEnabled()) return { available: false };
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      return { available: true, manifest: result.manifest };
    }
    return { available: false };
  } catch (error) {
    console.warn('[UpdateService] checkForUpdate:', error);
    return { available: false };
  }
}

/**
 * Baixa a atualização em background (não aplica ainda).
 * Use reloadAsync() para aplicar.
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
 * Só funciona após fetchUpdateAsync() ter sucesso.
 */
export async function reloadAsync(): Promise<void> {
  if (!isUpdatesEnabled()) return;
  await Updates.reloadAsync();
}

/**
 * Fluxo completo: verifica, baixa e aplica.
 * Retorna true se aplicou update; false caso contrário.
 */
export async function checkAndApplyUpdate(): Promise<boolean> {
  const check = await checkForUpdate();
  if (!check.available) return false;

  const fetchResult = await fetchUpdateAsync();
  if (!fetchResult.success) {
    console.warn('[UpdateService] fetch failed:', fetchResult.error);
    return false;
  }

  await reloadAsync();
  return true;
}

/**
 * Baixa update em background e aplica na próxima abertura.
 * Use no app startup para atualização silenciosa.
 */
export async function silentUpdate(): Promise<void> {
  const check = await checkForUpdate();
  if (!check.available) return;

  const fetchResult = await fetchUpdateAsync();
  if (fetchResult.success) {
    // Opção 1: aplicar agora (reload imediato)
    await reloadAsync();
    // Opção 2: aplicar na próxima abertura - não chamar reloadAsync;
    // o update já foi baixado e será usado no próximo launch
  }
}

/**
 * Informações da versão atual (para debug/logs).
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
