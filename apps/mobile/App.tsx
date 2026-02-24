import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './src/lib/queryClient';
import { AuthProvider } from './src/features/auth/AuthContext';
import { UpdateManager } from './src/features/updates/UpdateManager';
import { useRetrySyncOnNetwork } from './src/features/offline/useOfflineQueue';
import { RootNavigator } from './src/app/RootNavigator';

function OfflineSyncHandler() {
  useRetrySyncOnNetwork();
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: 7 * 24 * 60 * 60 * 1000 }}
      >
        <OfflineSyncHandler />
        <UpdateManager>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </UpdateManager>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
