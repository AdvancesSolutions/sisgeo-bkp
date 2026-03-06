/**
 * Hook que gerencia atualizações OTA:
 * - Checa update ao abrir e ao voltar ao app
 * - Atualização silenciosa: baixa em background e mostra modal "Atualização pronta"
 * - Update crítico: recarrega automaticamente após baixar
 * - minRuntimeVersion: exibe tela bloqueante "Atualize na loja"
 */
import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  checkAndFetchUpdateSilently,
  applyUpdateIfReady,
  forceUpdateFlow,
} from '../services/update/UpdateService';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1h entre checagens

let lastCheckTime = 0;

function shouldCheck(): boolean {
  return Date.now() - lastCheckTime > CHECK_INTERVAL_MS;
}

export type UpdateManagerState = {
  /** Update baixou e está pronto para aplicar (mostrar modal) */
  updateReady: boolean;
  /** Precisa atualizar na loja (tela bloqueante) */
  storeUpdateRequired: boolean;
  /** Mensagem para exibir na tela bloqueante */
  storeUpdateMessage: string;
  /** Aplicando update (loading) */
  applying: boolean;
};

export function useUpdateManager() {
  const [state, setState] = useState<UpdateManagerState>({
    updateReady: false,
    storeUpdateRequired: false,
    storeUpdateMessage: '',
    applying: false,
  });

  const runCheck = useCallback(async () => {
    if (!shouldCheck()) return;
    lastCheckTime = Date.now();

    // 1. Verifica política de update crítico primeiro
    const forceResult = await forceUpdateFlow();

    if (forceResult.action === 'store') {
      setState((s) => ({
        ...s,
        storeUpdateRequired: true,
        storeUpdateMessage: forceResult.message,
      }));
      return;
    }

    if (forceResult.action === 'reloaded') {
      // App recarregou
      return;
    }

    if (forceResult.action === 'error') {
      console.warn('[useUpdateManager] forceUpdateFlow error:', forceResult.message);
    }

    // 2. Atualização silenciosa (não crítico)
    const { downloaded } = await checkAndFetchUpdateSilently();
    if (downloaded) {
      setState((s) => ({ ...s, updateReady: true }));
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setState((s) => ({ ...s, applying: true }));
    try {
      await applyUpdateIfReady();
    } finally {
      setState((s) => ({ ...s, applying: false }));
    }
  }, []);

  const dismissUpdateReady = useCallback(() => {
    setState((s) => ({ ...s, updateReady: false }));
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        runCheck();
      }
    });
    return () => sub.remove();
  }, [runCheck]);

  return {
    state,
    applyUpdate,
    dismissUpdateReady,
  };
}
