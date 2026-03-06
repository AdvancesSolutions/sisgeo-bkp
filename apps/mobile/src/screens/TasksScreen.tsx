import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Navigation } from 'lucide-react-native';
import { useTasksList } from '../features/tasks/useTasks';
import apiClient from '../services/apiClient';
import type { Task } from '@sigeo/shared';
import type { RootStackParamList } from '../app/types';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em execução',
  IN_REVIEW: 'Em validação',
  DONE: 'Concluída',
  REJECTED: 'Rejeitada',
};

const BADGE_BG: Record<string, { backgroundColor: string }> = {
  PENDING: { backgroundColor: '#64748b' },
  IN_PROGRESS: { backgroundColor: '#0ea5e9' },
  IN_REVIEW: { backgroundColor: '#f59e0b' },
  DONE: { backgroundColor: '#22c55e' },
  REJECTED: { backgroundColor: '#ef4444' },
};

export function TasksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, isRefetching, refetch } = useTasksList(1, 50);
  const [locating, setLocating] = useState(false);

  const tasks = data?.data ?? [];

  const pendingTasks = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
  );
  const nextPending = pendingTasks[0];

  const handleLocalizarPonto = useCallback(async () => {
    if (!nextPending) {
      Alert.alert('Nenhum setor pendente', 'Não há tarefas pendentes para localizar.');
      return;
    }
    setLocating(true);
    try {
      const { data: task } = await apiClient.get<Task & { area?: { name?: string; location?: { lat?: number; lng?: number } } }>(
        `/tasks/${nextPending.id}`
      );
      const loc = task?.area?.location;
      if (loc?.lat != null && loc?.lng != null) {
        navigation.navigate('ARNavigation', {
          targetLat: loc.lat,
          targetLng: loc.lng,
          targetName: task?.area?.name ?? 'Próximo setor',
        });
      } else {
        Alert.alert(
          'Coordenadas indisponíveis',
          'Este setor ainda não possui localização cadastrada.'
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o próximo setor.');
    } finally {
      setLocating(false);
    }
  }, [nextPending, navigation]);

  const openARForTask = useCallback(
    async (taskId: string) => {
      try {
        const { data: task } = await apiClient.get<Task & { area?: { name?: string; location?: { lat?: number; lng?: number } } }>(
          `/tasks/${taskId}`
        );
        const loc = task?.area?.location;
        if (loc?.lat != null && loc?.lng != null) {
          navigation.navigate('ARNavigation', {
            targetLat: loc.lat,
            targetLng: loc.lng,
            targetName: task?.area?.name ?? 'Setor',
          });
        } else {
          Alert.alert(
            'Coordenadas indisponíveis',
            'Este setor ainda não possui localização cadastrada.'
          );
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar o setor.');
      }
    },
    [navigation]
  );

  const renderItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TaskExecution', { taskId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>{item.title || 'Sem título'}</Text>
        {(item.status === 'PENDING' || item.status === 'IN_PROGRESS') && (
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={(e) => {
              e.stopPropagation();
              openARForTask(item.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Navigation size={20} color="#0ea5e9" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.meta}>
        {new Date(item.scheduledDate).toLocaleDateString('pt-BR')}
      </Text>
      <View style={[styles.badge, BADGE_BG[item.status] ?? styles.badge_PENDING]}>
        <Text style={styles.badgeText}>{STATUS_LABEL[item.status] ?? item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {nextPending && (
        <TouchableOpacity
          style={styles.localizarBtn}
          onPress={handleLocalizarPonto}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Navigation size={20} color="#fff" />
              <Text style={styles.localizarText}>Localizar próximo setor</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma tarefa encontrada.</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={['#0ea5e9']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 16, paddingBottom: 40 },
  localizarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(14,165,233,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.5)',
  },
  localizarText: { color: '#0ea5e9', fontWeight: '600', fontSize: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: '#f8fafc', fontSize: 16, fontWeight: '600', flex: 1 },
  navIconBtn: { padding: 4 },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  badge_PENDING: { backgroundColor: '#64748b' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 24 },
});
