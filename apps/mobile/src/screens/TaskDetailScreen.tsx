import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, Check, Camera } from 'lucide-react-native';
import { useTask, useUpdateTaskStatus } from '../features/tasks/useTasks';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import type { RootStackParamList } from '../app/types';

type Route = RouteProp<RootStackParamList, 'TaskDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>;

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em execução',
  IN_REVIEW: 'Em validação',
  DONE: 'Concluída',
  REJECTED: 'Rejeitada',
};

export function TaskDetailScreen({
  route,
  navigation,
}: {
  route: Route;
  navigation: Nav;
}) {
  const { taskId } = route.params;
  const { data: task, isLoading, error } = useTask(taskId);
  const updateStatus = useUpdateTaskStatus();

  const handleStart = async () => {
    try {
      await updateStatus.mutateAsync({ id: taskId, status: 'IN_PROGRESS' });
      Alert.alert('Sucesso', 'Serviço iniciado.');
    } catch (e: unknown) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  const handleFinish = async () => {
    try {
      await updateStatus.mutateAsync({ id: taskId, status: 'IN_REVIEW' });
      Alert.alert('Sucesso', 'Serviço concluído.');
    } catch (e: unknown) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  if (isLoading || !task) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Erro ao carregar tarefa.</Text>
      </View>
    );
  }

  const canStart = task.status === 'PENDING';
  const canFinish = task.status === 'IN_PROGRESS';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{task.title || 'Sem título'}</Text>
      <Text style={styles.description}>{task.description || 'Sem descrição'}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Data:</Text>
        <Text style={styles.value}>{new Date(task.scheduledDate).toLocaleDateString('pt-BR')}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{STATUS_LABEL[task.status] ?? task.status}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Área ID:</Text>
        <Text style={styles.value}>{task.areaId}</Text>
      </View>
      {(task as { rejectedComment?: string; rejectedAt?: string }).rejectedComment && (
        <View style={styles.rejectedBox}>
          <Text style={styles.rejectedTitle}>Recusado pelo supervisor</Text>
          <Text style={styles.rejectedComment}>
            {(task as { rejectedComment?: string }).rejectedComment}
          </Text>
          <Text style={styles.rejectedHint}>Corrija e reenvie as fotos ou conclua novamente.</Text>
        </View>
      )}
      {task.status === 'IN_REVIEW' && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Aguardando validação do supervisor.</Text>
        </View>
      )}
      {task.status === 'DONE' && (
        <View style={[styles.statusBox, styles.statusApproved]}>
          <Text style={styles.statusText}>Aprovado.</Text>
        </View>
      )}
      <Text style={styles.sectionLabel}>Fotos do serviço (antes / depois)</Text>
      {task.photos && task.photos.length > 0 && (
        <View style={styles.photosContainer}>
          {task.photos
            .filter((p) => p.type === 'BEFORE')
            .map((p) => (
              <View key={p.id} style={styles.photoPreview}>
                <Text style={styles.photoLabel}>Antes</Text>
                <Text style={styles.photoTimestamp}>{new Date(p.createdAt).toLocaleString('pt-BR')}</Text>
              </View>
            ))}
          {task.photos
            .filter((p) => p.type === 'AFTER')
            .map((p) => (
              <View key={p.id} style={styles.photoPreview}>
                <Text style={styles.photoLabel}>Depois</Text>
                <Text style={styles.photoTimestamp}>{new Date(p.createdAt).toLocaleString('pt-BR')}</Text>
              </View>
            ))}
        </View>
      )}
      <View style={styles.photoButtons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPhotoBefore, task.photos?.some((p) => p.type === 'BEFORE') && styles.btnDisabled]}
          onPress={() => navigation.navigate('TakeTaskPhoto', { taskId, type: 'BEFORE' })}
          disabled={task.photos?.some((p) => p.type === 'BEFORE')}
        >
          <Camera size={20} color="#fff" />
          <Text style={styles.btnText}>{task.photos?.some((p) => p.type === 'BEFORE') ? 'Foto antes ✓' : 'Foto antes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPhotoAfter, task.photos?.some((p) => p.type === 'AFTER') && styles.btnDisabled]}
          onPress={() => navigation.navigate('TakeTaskPhoto', { taskId, type: 'AFTER' })}
          disabled={task.photos?.some((p) => p.type === 'AFTER')}
        >
          <Camera size={20} color="#fff" />
          <Text style={styles.btnText}>{task.photos?.some((p) => p.type === 'AFTER') ? 'Foto depois ✓' : 'Foto depois'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        {canStart && (
          <TouchableOpacity
            style={[styles.btn, styles.btnStart]}
            onPress={handleStart}
            disabled={updateStatus.isPending}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.btnText}>Iniciar serviço</Text>
          </TouchableOpacity>
        )}
        {canFinish && (
          <TouchableOpacity
            style={[styles.btn, styles.btnFinish]}
            onPress={handleFinish}
            disabled={updateStatus.isPending}
          >
            <Check size={20} color="#fff" />
            <Text style={styles.btnText}>Concluir serviço</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  description: { color: '#94a3b8', marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { color: '#64748b', marginRight: 8, width: 80 },
  value: { color: '#cbd5e1', flex: 1 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginTop: 20, marginBottom: 8 },
  photoButtons: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  btn: { flexDirection: 'row', gap: 8, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPhotoBefore: { flex: 1, backgroundColor: '#64748b' },
  btnPhotoAfter: { flex: 1, backgroundColor: '#475569' },
  actions: { marginTop: 16, gap: 12 },
  btnStart: { backgroundColor: '#0ea5e9' },
  btnFinish: { backgroundColor: '#22c55e' },
  btnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#ef4444' },
  rejectedBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectedTitle: { color: '#b91c1c', fontWeight: '600', marginBottom: 4 },
  rejectedComment: { color: '#991b1b', marginBottom: 4 },
  rejectedHint: { color: '#64748b', fontSize: 12 },
  statusBox: {
    backgroundColor: '#fef9c3',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  statusApproved: { backgroundColor: '#dcfce7' },
  statusText: { color: '#0f172a', fontWeight: '500' },
  photosContainer: { marginBottom: 12, gap: 8 },
  photoPreview: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  photoLabel: { color: '#0ea5e9', fontWeight: '600', fontSize: 12 },
  photoTimestamp: { color: '#64748b', fontSize: 11, marginTop: 2 },
  btnDisabled: { opacity: 0.5 },
});
