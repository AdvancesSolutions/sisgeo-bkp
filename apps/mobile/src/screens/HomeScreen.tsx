import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, AppState } from 'react-native';
import { useAuth } from '../features/auth/AuthContext';
import { useEmployeesList } from '../features/employees/useEmployees';
import { useTimeClockHistory, useCheckIn, useCheckOut } from '../features/timeclock/useTimeclock';
import { useTasksList } from '../features/tasks/useTasks';
import { useOfflinePendingCount, useFlushOfflineQueue } from '../features/offline/useOfflineQueue';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { RefreshCw, LogIn, LogOut } from 'lucide-react-native';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import type { Task } from '@sigeo/shared';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em execução',
  IN_REVIEW: 'Em validação',
  DONE: 'Concluída',
  REJECTED: 'Rejeitada',
};

function TaskItem({ task }: { task: Task }) {
  return (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle} numberOfLines={1}>{task.title || 'Sem título'}</Text>
      <Text style={styles.taskMeta}>
        {new Date(task.scheduledDate).toLocaleDateString('pt-BR')} • {STATUS_LABEL[task.status] ?? task.status}
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const { data: employeesData } = useEmployeesList(1, 10);
  const employeeId = employeesData?.data?.[0]?.id ?? null;

  const { data: timeclockData, isLoading: loadingHistory } = useTimeClockHistory(employeeId, 5);
  const checkIn = useCheckIn(employeeId);
  const checkOut = useCheckOut(employeeId);

  const { data: tasksData, isLoading: loadingTasks } = useTasksList(1, 20);

  const { data: pendingCount = 0, refetch: refetchPending } = useOfflinePendingCount();
  const flushQueue = useFlushOfflineQueue();

  const handleSync = useCallback(async () => {
    if (pendingCount === 0) return;
    const { synced, failed } = await flushQueue();
    refetchPending();
    if (synced > 0 || failed > 0) {
      const parts: string[] = [];
      if (synced > 0) parts.push(`${synced} ação(ões) sincronizada(s).`);
      if (failed > 0) parts.push(`${failed} falharam. Tente com internet.`);
      Alert.alert('Sincronização', parts.join(' '));
    }
  }, [pendingCount, flushQueue, refetchPending]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pendingCount > 0) {
        flushQueue().then(({ synced }) => {
          if (synced > 0) refetchPending();
        });
      }
    });
    return () => sub.remove();
  }, [pendingCount, flushQueue, refetchPending]);
  const myTasks = (tasksData?.data ?? []).filter((t) => t.employeeId === employeeId || !t.employeeId);
  const today = new Date().toDateString();
  const todayTasks = myTasks.filter((t) => new Date(t.scheduledDate).toDateString() === today);

  const requestLocationAndCheckIn = async () => {
    if (!employeeId) {
      Alert.alert('Aviso', 'Nenhum funcionário vinculado.');
      return;
    }
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        Alert.alert('GPS necessário', 'Permita o acesso à localização para registrar o ponto.');
        return;
      }
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        Alert.alert('Câmera necessária', 'Permita o acesso à câmera para registrar a foto do ponto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      const loc = await Location.getCurrentPositionAsync({});
      await checkIn.mutateAsync({
        employeeId,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        photoUri: result.assets[0].uri,
      });
      Alert.alert('Sucesso', 'Check-in registrado.');
    } catch (e: unknown) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  const requestLocationAndCheckOut = async () => {
    if (!employeeId) {
      Alert.alert('Aviso', 'Nenhum funcionário vinculado.');
      return;
    }
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        Alert.alert('GPS necessário', 'Permita o acesso à localização para registrar o ponto.');
        return;
      }
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        Alert.alert('Câmera necessária', 'Permita o acesso à câmera para registrar a foto do ponto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      const loc = await Location.getCurrentPositionAsync({});
      await checkOut.mutateAsync({
        employeeId,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        photoUri: result.assets[0].uri,
      });
      Alert.alert('Sucesso', 'Check-out registrado.');
    } catch (e: unknown) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  const lastRecord = timeclockData?.[0];
  const isCheckedIn = lastRecord?.type === 'CHECKIN' || lastRecord?.type === 'CHECKIN_FORA_DE_AREA';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>Olá, {user?.name ?? 'Usuário'}</Text>
      {pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText}>
            Pendências para sincronizar: {pendingCount}
          </Text>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSync}>
            <RefreshCw size={18} color="#0f172a" />
            <Text style={styles.syncBtnText}>Sincronizar</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.sectionTitle}>Status do dia</Text>
      {loadingHistory ? (
        <ActivityIndicator size="small" color="#0ea5e9" style={styles.loader} />
      ) : (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            Último registro: {lastRecord
              ? `${lastRecord.type === 'CHECKIN' ? 'Check-in' : 'Check-out'} às ${new Date(lastRecord.createdAt).toLocaleTimeString('pt-BR')}`
              : 'Nenhum'}
          </Text>
        </View>
      )}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnCheckIn]}
          onPress={requestLocationAndCheckIn}
          disabled={checkIn.isPending || isCheckedIn}
        >
          {checkIn.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <LogIn size={20} color="#fff" />
              <Text style={styles.btnText}>Check-in</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnCheckOut]}
          onPress={requestLocationAndCheckOut}
          disabled={checkOut.isPending || !isCheckedIn}
        >
          {checkOut.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <LogOut size={20} color="#fff" />
              <Text style={styles.btnText}>Check-out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Minhas tarefas hoje</Text>
      {loadingTasks ? (
        <ActivityIndicator size="small" color="#0ea5e9" style={styles.loader} />
      ) : todayTasks.length === 0 ? (
        <Text style={styles.empty}>Nenhuma tarefa para hoje.</Text>
      ) : (
        todayTasks.slice(0, 5).map((task) => <TaskItem key={task.id} task={task} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  welcome: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 20, marginBottom: 8 },
  statusRow: { marginBottom: 12 },
  statusText: { color: '#cbd5e1', fontSize: 14 },
  loader: { marginVertical: 12 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  btn: { flex: 1, flexDirection: 'row', gap: 8, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnCheckIn: { backgroundColor: '#22c55e' },
  btnCheckOut: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '600' },
  taskCard: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8 },
  taskTitle: { color: '#f8fafc', fontWeight: '600' },
  taskMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  empty: { color: '#64748b', fontSize: 14 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  pendingText: { color: '#0f172a', fontWeight: '600', flex: 1 },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  syncBtnText: { color: '#f8fafc', fontWeight: '600' },
});
