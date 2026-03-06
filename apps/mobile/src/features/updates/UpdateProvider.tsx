/**
 * Provider que verifica e aplica atualizações OTA ao iniciar o app.
 * Em builds release (APK/IPA), busca updates silenciosamente e aplica se houver.
 */
import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { silentUpdate } from '../../services/UpdateService';

/** Intervalo mínimo (ms) entre verificações de update. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

let lastCheckTime = 0;

function shouldCheck(): boolean {
  return Date.now() - lastCheckTime > CHECK_INTERVAL_MS;
}

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const check = async () => {
      if (!shouldCheck()) return;
      lastCheckTime = Date.now();
      try {
        await silentUpdate();
      } catch (e) {
        console.warn('[UpdateProvider] silentUpdate:', e);
      }
    };

    check();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && shouldCheck()) {
        lastCheckTime = Date.now();
        silentUpdate().catch((e) => console.warn('[UpdateProvider] background check:', e));
      }
    });
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}
