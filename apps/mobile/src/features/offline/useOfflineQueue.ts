import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getPendingActions, retrySync } from '../../services/syncService';
import { addPendingAction, type PendingActionType } from '../../utils/offlineQueue';

const QUERY_KEY = ['offlineQueue'];

export function useOfflinePendingCount() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getPendingActions,
    select: (actions) => actions.length,
  });
}

export function useFlushOfflineQueue() {
  const queryClient = useQueryClient();

  const flush = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    const result = await retrySync();
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['timeclock'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    return result;
  }, [queryClient]);

  return flush;
}

/** Dispara retrySync automaticamente quando a rede volta. */
export function useRetrySyncOnNetwork() {
  const flush = useFlushOfflineQueue();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        getPendingActions().then((actions) => {
          if (actions.length > 0) {
            flush().then(({ synced }) => {
              if (synced > 0) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEY });
                queryClient.invalidateQueries({ queryKey: ['timeclock'] });
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
              }
            });
          }
        });
      }
    });
    return () => unsubscribe();
  }, [flush, queryClient]);
}

export function useAddToOfflineQueue() {
  const queryClient = useQueryClient();

  const addToQueue = useCallback(
    async (type: PendingActionType, payload: unknown) => {
      await addPendingAction(type, payload);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    [queryClient]
  );

  return addToQueue;
}
