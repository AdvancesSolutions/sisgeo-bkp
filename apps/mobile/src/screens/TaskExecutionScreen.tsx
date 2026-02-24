import React, { useCallback, useMemo, useState } from 'react';
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
import { Play, Check, Camera, AlertCircle, MapPin, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useTask, useUpdateTaskStatus } from '../features/tasks/useTasks';
import {
  useChecklistItems,
  useChecklistResponses,
  useSaveChecklistResponses,
  type ChecklistResponseInput,
} from '../features/checklist/useChecklist';
import { useUploadPhoto } from '../features/upload/useUploadPhoto';
import { useCreateIncident, type IncidentType } from '../features/incidents/useIncidents';
import { useAuth } from '../features/auth/AuthContext';
import { useEmployeesList } from '../features/employees/useEmployees';
import { getDeviceId } from '../utils/deviceId';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import {
  getEvidencia,
  deveExibirAlertaIA,
  type Evidencia,
} from '../services/visionService';
import { useCheckInAllowed, useLogWatched } from '../features/procedimentos/useProcedimentos';
import { VideoTrainingModal } from '../components/training/VideoTrainingModal';
import { VoiceAssistant } from '../components/voice/VoiceAssistant';
import { useQueryClient } from '@tanstack/react-query';
import { DynamicChecklist } from '../components/task-execution/DynamicChecklist';
import type { RootStackParamList } from '../app/types';

type Route = RouteProp<RootStackParamList, 'TaskExecution'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'TaskExecution'>;

const RISK_LABEL: Record<string, string> = {
  crítico: 'CRÍTICO',
  semicrítico: 'SEMICRÍTICO',
  'não crítico': 'NÃO CRÍTICO',
  CRITICO: 'CRÍTICO',
  SEMICRITICO: 'SEMICRÍTICO',
  NAO_CRITICO: 'NÃO CRÍTICO',
};

const STEP = { VIEW: 1, CHECKIN: 2, CHECKLIST: 3, CHECKOUT: 4 };

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 8;

async function pollEvidencia(taskPhotoId: string): Promise<Evidencia | null> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    const ev = await getEvidencia(taskPhotoId);
    if (ev) return ev;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export function TaskExecutionScreen({ route, navigation }: { route: Route; navigation: Nav }) {
  const { taskId } = route.params;
  const { data: task, isLoading, error } = useTask(taskId);
  const updateStatus = useUpdateTaskStatus();
  const { data: checklistItems = [], isLoading: loadingItems } = useChecklistItems(taskId);
  const { data: responses = [] } = useChecklistResponses(taskId);
  const saveResponses = useSaveChecklistResponses(taskId);
  const uploadPhoto = useUploadPhoto();
  const { data: checkInAllowed } = useCheckInAllowed(taskId);
  const logWatched = useLogWatched();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: employeesData } = useEmployeesList(1, 10);
  const employeeId = user?.employeeId ?? employeesData?.data?.[0]?.id ?? null;
  const createIncident = useCreateIncident();
  const [voiceCheckRequest, setVoiceCheckRequest] = useState<{ itemLabel: string } | null>(null);
  const [voiceCheckAllTrigger, setVoiceCheckAllTrigger] = useState(0);
  const [trainingModal, setTrainingModal] = useState<{
    procedimentos: { id: string; titulo: string; videoUrlS3: string | null; manualPdfUrl: string | null; thumbnailUrl: string | null; duracaoSegundos?: number | null }[];
    index: number;
  } | null>(null);

  const [currentStep, setCurrentStep] = useState(STEP.VIEW);
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponseInput[]>([]);
  const [geofenceError, setGeofenceError] = useState<string | null>(null);

  const area = (task as { area?: { name: string; riskClassification?: string; id?: string } })?.area;
  const hasCheckin = !!(
    (task as { startedAt?: string })?.startedAt ||
    (task as { checkinLat?: number })?.checkinLat
  );

  const initialResponses = useMemo(() => {
    const map: Record<string, { valueBool?: boolean; valueText?: string }> = {};
    for (const r of responses) {
      map[r.checklistItemId] = {
        valueBool: r.valueBool ?? undefined,
        valueText: r.valueText ?? undefined,
      };
    }
    return map;
  }, [responses]);

  const handleCheckin = useCallback(async () => {
    if (!task) return;
    if (checkInAllowed && !checkInAllowed.allowed && checkInAllowed.procedimentos.length > 0) {
      setTrainingModal({
        procedimentos: checkInAllowed.procedimentos,
        index: 0,
      });
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão', 'É necessário permitir localização para o check-in.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const areaRadius = (area as { raioPermitido?: number })?.raioPermitido ?? (area as { location?: { radius?: number } })?.location?.radius;
      const locationCoords = (area as { location?: { lat?: number; lng?: number } })?.location;
      if (areaRadius != null && areaRadius > 0 && locationCoords?.lat != null && locationCoords?.lng != null) {
        const dist = haversineKm(lat, lng, locationCoords.lat, locationCoords.lng);
        if (dist > areaRadius) {
          setGeofenceError(`Você está a ${dist.toFixed(1)} km do local. Raio permitido: ${areaRadius} km.`);
          return;
        }
      }
      setGeofenceError(null);

      const deviceId = await getDeviceId();
      let photoUri: string | null = null;
      // Foto de evidência - usar ImagePicker
      const ImagePicker = await import('expo-image-picker');
      const { status: camPerm } = await ImagePicker.requestCameraPermissionsAsync();
      if (camPerm === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          photoUri = result.assets[0].uri;
        }
      }

      if (!photoUri) {
        Alert.alert('Foto obrigatória', 'A foto de evidência de início é obrigatória para o check-in.');
        return;
      }

      const ImageManipulator = await import('expo-image-manipulator');
      let compressedUri = photoUri;
      try {
        const m = await ImageManipulator.manipulateAsync(
          photoUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        compressedUri = m.uri;
      } catch {
        // segue com original
      }

      await uploadPhoto.mutateAsync({
        uri: compressedUri,
        metadata: {
          taskId,
          type: 'BEFORE',
          timestamp: new Date().toISOString(),
          deviceId,
          lat,
          lng,
        },
      });

      await updateStatus.mutateAsync({
        id: taskId,
        status: 'IN_PROGRESS',
        checkinLat: lat,
        checkinLng: lng,
      });

      setCurrentStep(STEP.CHECKLIST);
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  }, [task, taskId, area, updateStatus, uploadPhoto]);

  const handleSaveChecklist = useCallback(async () => {
    if (checklistResponses.length === 0) {
      setCurrentStep(STEP.CHECKOUT);
      return;
    }
    try {
      await saveResponses.mutateAsync(checklistResponses);
      setCurrentStep(STEP.CHECKOUT);
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  }, [checklistResponses, saveResponses]);

  const handleCheckout = useCallback(async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão', 'É necessário permitir o acesso à câmera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]?.uri) {
        Alert.alert('Foto obrigatória', 'A foto final é obrigatória para o check-out.');
        return;
      }

      let uri = result.assets[0].uri;
      const ImageManipulator = await import('expo-image-manipulator');
      try {
        const m = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        uri = m.uri;
      } catch {
        // segue com original
      }

      const deviceId = await getDeviceId();
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch {
        // segue sem coords
      }

      const uploadResult = await uploadPhoto.mutateAsync({
        uri,
        metadata: {
          taskId,
          type: 'AFTER',
          timestamp: new Date().toISOString(),
          deviceId,
          lat,
          lng,
        },
      });

      await updateStatus.mutateAsync({
        id: taskId,
        status: 'IN_REVIEW',
        checkoutLat: lat,
        checkoutLng: lng,
      });

      let evidencia: Evidencia | null = null;
      if (uploadResult.photoId) {
        evidencia = await pollEvidencia(uploadResult.photoId);
      }

      if (evidencia && deveExibirAlertaIA(evidencia)) {
        Alert.alert(
          'Serviço concluído',
          'Atenção: A IA detectou possível sujeira. Por favor, revise o local ou tire uma foto melhor.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Sucesso', 'Serviço concluído e enviado para validação.');
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  }, [taskId, updateStatus, uploadPhoto, navigation, checkInAllowed]);

  const reportIncident = useCallback(
    async (type: IncidentType, description?: string) => {
      if (!employeeId) {
        Alert.alert('Aviso', 'Não foi possível identificar o colaborador. Faça login novamente.');
        return;
      }
      try {
        await createIncident.mutateAsync({
          employeeId,
          type,
          description: description ?? 'Ocorrência reportada',
          areaId: (task as { areaId?: string })?.areaId ?? (area as { id?: string })?.id ?? null,
        });
      } catch (e) {
        Alert.alert('Erro', getApiErrorMessage(e));
      }
    },
    [employeeId, createIncident, task, area],
  );

  const handleReportIncident = useCallback(() => {
    Alert.alert(
      'Reportar ocorrência',
      'Selecione o tipo de problema:',
      [
        { text: 'Falta de material', onPress: () => reportIncident('FALTA_MATERIAL') },
        { text: 'Equipamento quebrado', onPress: () => reportIncident('QUEBRA_EQUIPAMENTO') },
        { text: 'Outro', onPress: () => reportIncident('OUTRO') },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }, [reportIncident]);

  const handleOpenCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'É necessário permitir o acesso à câmera.');
      return;
    }
    await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
  }, []);

  const handleTrainingHelp = useCallback(
    (topic: string) => {
      const t = topic.toLowerCase();
      const procedimentos = checkInAllowed?.procedimentos ?? [];
      const fromChecklist = checklistItems
        .filter((i) => i.procedimento && (i.label.toLowerCase().includes(t) || t.includes(i.label.toLowerCase())))
        .map((i) => i.procedimento!)
        .filter(Boolean);
      const fromProcedimentos = procedimentos.filter(
        (p) => p.titulo.toLowerCase().includes(t) || t.includes(p.titulo.toLowerCase()),
      );
      const match = fromChecklist[0] ?? fromProcedimentos[0];
      if (match?.videoUrlS3) {
        setTrainingModal({ procedimentos: [match], index: 0 });
      } else if (procedimentos.length > 0) {
        setTrainingModal({ procedimentos, index: 0 });
      }
    },
    [checklistItems, checkInAllowed?.procedimentos],
  );

  const voiceCallbacks = useMemo(
    () => ({
      onReportIncident: (type: string, description: string) => {
        reportIncident(type as IncidentType, description);
      },
      onCheckItem: (itemLabel: string) => {
        setVoiceCheckRequest({ itemLabel });
      },
      onCheckAll: () => {
        setVoiceCheckAllTrigger((n) => n + 1);
        setVoiceCheckRequest(null);
      },
      onOpenCamera: handleOpenCamera,
      onTrainingHelp: handleTrainingHelp,
    }),
    [reportIncident, handleOpenCamera, handleTrainingHelp],
  );

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
  const canDoCheckin = canStart && currentStep >= STEP.CHECKIN;
  const isCheckinDone = hasCheckin || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW' || task.status === 'DONE';

  const currentProcedimento = trainingModal
    ? trainingModal.procedimentos[trainingModal.index]
    : null;

  return (
    <View style={styles.container}>
      <VideoTrainingModal
        visible={!!trainingModal}
        procedimento={currentProcedimento ?? null}
        required
        onClose={() => {
          setTrainingModal(null);
          qc.invalidateQueries({ queryKey: ['procedimentos', 'check-in-allowed', taskId] });
        }}
        onWatched={(procedimentoId, pct) => {
          logWatched.mutate({ procedimentoId, percentualAssistido: pct });
          if (trainingModal && trainingModal.index < trainingModal.procedimentos.length - 1) {
            setTrainingModal((prev) => prev ? { ...prev, index: prev.index + 1 } : null);
          } else {
            setTrainingModal(null);
            qc.invalidateQueries({ queryKey: ['procedimentos', 'check-in-allowed', taskId] });
          }
        }}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Passo 1: Visualização */}
        <View style={styles.section}>
          <Text style={styles.title}>{task.title || area?.name || 'Tarefa'}</Text>
          <Text style={styles.description}>{task.description || 'Sem observações'}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Data:</Text>
            <Text style={styles.metaValue}>{new Date(task.scheduledDate).toLocaleDateString('pt-BR')}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Setor:</Text>
            <Text style={styles.metaValue}>{area?.name ?? '-'}</Text>
          </View>
          {(area as { location?: { lat?: number; lng?: number } })?.location?.lat != null &&
           (area as { location?: { lat?: number; lng?: number } })?.location?.lng != null && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => {
                const loc = (area as unknown as { location: { lat: number; lng: number } }).location;
                navigation.navigate('ARNavigation', {
                  targetLat: loc.lat,
                  targetLng: loc.lng,
                  targetName: area?.name ?? 'Setor',
                });
              }}
            >
              <Navigation size={20} color="#0ea5e9" />
              <Text style={styles.navBtnText}>Como chegar</Text>
            </TouchableOpacity>
          )}
          {area?.riskClassification && (
            <View style={[styles.riskBadge, (area.riskClassification === 'crítico' || area.riskClassification === 'CRITICO') && styles.riskCritical]}>
              <Text style={styles.riskText}>
                {RISK_LABEL[area.riskClassification] ?? area.riskClassification}
              </Text>
            </View>
          )}
        </View>

        {/* Passo 2: Check-in */}
        {canStart && !isCheckinDone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check-in obrigatório</Text>
            <Text style={styles.hint}>Capture GPS e tire a foto de evidência de início.</Text>
            {geofenceError && (
              <View style={styles.geofenceError}>
                <MapPin size={18} color="#ef4444" />
                <Text style={styles.geofenceText}>{geofenceError}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.bigBtn, styles.btnCheckin]}
              onPress={handleCheckin}
              disabled={updateStatus.isPending || uploadPhoto.isPending}
            >
              {(updateStatus.isPending || uploadPhoto.isPending) ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Camera size={28} color="#fff" />
                  <Text style={styles.bigBtnText}>Fazer check-in</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Passo 3: Checklist */}
        {isCheckinDone && (currentStep === STEP.CHECKLIST || currentStep === STEP.VIEW) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist</Text>
            {loadingItems ? (
              <ActivityIndicator color="#0ea5e9" style={{ marginVertical: 20 }} />
            ) : (
              <DynamicChecklist
                taskId={taskId}
                items={checklistItems}
                initialResponses={initialResponses}
                onResponsesChange={setChecklistResponses}
                isCheckinDone={isCheckinDone}
                isSaving={saveResponses.isPending}
                voiceCheckRequest={voiceCheckRequest}
                onVoiceCheckProcessed={() => setVoiceCheckRequest(null)}
                voiceCheckAllTrigger={voiceCheckAllTrigger}
                onVoiceCheckAllProcessed={() => {}}
              />
            )}
            <TouchableOpacity
              style={[styles.bigBtn, styles.btnChecklist]}
              onPress={handleSaveChecklist}
              disabled={saveResponses.isPending}
            >
              {saveResponses.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Check size={24} color="#fff" />
                  <Text style={styles.bigBtnText}>Continuar para check-out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Passo 4: Check-out */}
        {currentStep === STEP.CHECKOUT && isCheckinDone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check-out</Text>
            <Text style={styles.hint}>Resumo do que foi feito. Assinatura digital e foto final.</Text>
            <TouchableOpacity
              style={[styles.bigBtn, styles.btnCheckout]}
              onPress={handleCheckout}
              disabled={updateStatus.isPending || uploadPhoto.isPending}
            >
              {(updateStatus.isPending || uploadPhoto.isPending) ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Camera size={28} color="#fff" />
                  <Text style={styles.bigBtnText}>Fazer check-out</Text>
                </>
              )}
            </TouchableOpacity>
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
      </ScrollView>

      {/* Botão flutuante Ocorrência */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleReportIncident}
        activeOpacity={0.8}
      >
        <AlertCircle size={28} color="#fff" />
      </TouchableOpacity>

      {/* Assistente de voz - microfone flutuante */}
      <VoiceAssistant
        enabled={isCheckinDone && (currentStep === STEP.CHECKLIST || currentStep === STEP.VIEW)}
        checklistLabels={checklistItems.map((i) => i.label)}
        callbacks={voiceCallbacks}
        style={styles.voiceFab}
      />
    </View>
  );
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  error: { color: '#ef4444' },
  section: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  description: { color: '#94a3b8', marginBottom: 12 },
  meta: { flexDirection: 'row', marginBottom: 6 },
  metaLabel: { color: '#64748b', width: 90 },
  metaValue: { color: '#cbd5e1' },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#475569',
    marginTop: 8,
  },
  riskCritical: { backgroundColor: '#b91c1c' },
  riskText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(14,165,233,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.4)',
  },
  navBtnText: { color: '#0ea5e9', fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 8 },
  hint: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  geofenceError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#450a0a',
    borderRadius: 8,
    marginBottom: 12,
  },
  geofenceText: { color: '#fca5a5' },
  bigBtn: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 16,
  },
  btnCheckin: { backgroundColor: '#0ea5e9' },
  btnChecklist: { backgroundColor: '#22c55e' },
  btnCheckout: { backgroundColor: '#16a34a' },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statusBox: {
    backgroundColor: '#fef9c3',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  statusApproved: { backgroundColor: '#dcfce7' },
  statusText: { color: '#0f172a', fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  voiceFab: {
    bottom: 24,
    left: 24,
  },
});
