import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { MainTabs } from './MainTabs';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { TaskExecutionScreen } from '../screens/TaskExecutionScreen';
import { TakeTaskPhotoScreen } from '../screens/TakeTaskPhotoScreen';
import { ARNavigationScreen } from '../screens/ARNavigationScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
            options={{ title: 'Detalhe da tarefa' }}
          />
          <Stack.Screen
            name="TaskExecution"
            component={TaskExecutionScreen}
            options={{ title: 'Execução da tarefa' }}
          />
          <Stack.Screen
            name="TakeTaskPhoto"
            component={TakeTaskPhotoScreen}
            options={({ route }) => ({
              title: route.params.type === 'BEFORE' ? 'Foto antes' : 'Foto depois',
            })}
          />
          <Stack.Screen
            name="ARNavigation"
            component={ARNavigationScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
