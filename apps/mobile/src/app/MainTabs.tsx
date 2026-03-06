import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ListTodo, Clock, Camera, LogOut } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { PontoScreen } from '../screens/PontoScreen';
import { PhotoScreen } from '../screens/PhotoScreen';
import { useAuth } from '../features/auth/AuthContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICON_SIZE = 22;

function TabIcon({
  name,
  focused,
}: {
  name: 'Home' | 'Tasks' | 'Ponto' | 'Photo';
  focused: boolean;
}) {
  const color = focused ? '#0ea5e9' : '#64748b';
  switch (name) {
    case 'Home':
      return <Home size={ICON_SIZE} color={color} />;
    case 'Tasks':
      return <ListTodo size={ICON_SIZE} color={color} />;
    case 'Ponto':
      return <Clock size={ICON_SIZE} color={color} />;
    case 'Photo':
      return <Camera size={ICON_SIZE} color={color} />;
    default:
      return null;
  }
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ color: focused ? '#0ea5e9' : '#64748b', fontSize: 12 }}>{label}</Text>;
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
      <LogOut size={20} color="#94a3b8" />
      <Text style={styles.logoutText}>Sair</Text>
    </TouchableOpacity>
  );
}

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 12) + 8;
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          paddingBottom: tabBarPaddingBottom,
          height: 56 + tabBarPaddingBottom,
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          headerRight: () => <LogoutButton />,
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Início" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ focused }) => <TabIcon name="Tasks" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Tarefas" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Ponto"
        component={PontoScreen}
        options={{
          title: 'Ponto',
          tabBarIcon: ({ focused }) => <TabIcon name="Ponto" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Ponto" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Photo"
        component={PhotoScreen}
        options={{
          title: 'Foto',
          tabBarIcon: ({ focused }) => <TabIcon name="Photo" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Foto" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  logoutText: { color: '#94a3b8', fontSize: 14 },
});
