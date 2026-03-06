/**
 * Hook para verificação manual de atualizações.
 * Use em telas de configurações para "Verificar atualizações".
 */
import { useState, useCallback } from 'react';
import {
  checkForUpdate,
  fetchUpdateAsync,
  reloadAsync,
  getCurrentUpdateInfo,
} from '../../services/UpdateService';

export function useUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    setUpdateAvailable(false);
    try {
      const result = await checkForUpdate();
      if (result.available) {
        setUpdateAvailable(true);
        return true;
      }
      return false;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao verificar');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const apply = useCallback(async () => {
    const fetchResult = await fetchUpdateAsync();
    if (fetchResult.success) {
      await reloadAsync();
    } else {
      setError(fetchResult.error?.message ?? 'Erro ao aplicar');
    }
  }, []);

  const info = getCurrentUpdateInfo();

  return { check, apply, isChecking, updateAvailable, error, info };
}
