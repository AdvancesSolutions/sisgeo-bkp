import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Check, Camera, CloudOff, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import type { ChecklistItem, ChecklistResponseInput } from '../../features/checklist/useChecklist';
import { useUploadPhoto } from '../../features/upload/useUploadPhoto';
import { useLogWatched } from '../../features/procedimentos/useProcedimentos';
import { VideoTrainingModal, type ProcedimentoInfo } from '../training/VideoTrainingModal';
import { getDeviceId } from '../../utils/deviceId';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import NetInfo from '@react-native-community/netinfo';

const MIN_TOUCH_SIZE = 48;

interface DynamicChecklistProps {
  taskId: string;
  items: ChecklistItem[];
  initialResponses: Record<string, { valueBool?: boolean; valueText?: string }>;
  onResponsesChange: (responses: ChecklistResponseInput[]) => void;
  isCheckinDone: boolean;
  isSaving?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (err: unknown) => void;
  /** Comando de voz: marcar item por label (ex: "bancada") */
  voiceCheckRequest?: { itemLabel: string } | null;
  onVoiceCheckProcessed?: () => void;
  /** Comando de voz: marcar todos (incrementar para disparar) */
  voiceCheckAllTrigger?: number;
  onVoiceCheckAllProcessed?: () => void;
}

function matchLabel(itemLabel: string, search: string): boolean {
  const a = itemLabel.toLowerCase().trim();
  const b = search.toLowerCase().trim();
  return a.includes(b) || b.includes(a);
}

export function DynamicChecklist({
  taskId,
  items,
  initialResponses,
  onResponsesChange,
  isCheckinDone,
  isSaving = false,
  onSaveSuccess,
  onSaveError,
  voiceCheckRequest,
  onVoiceCheckProcessed,
  voiceCheckAllTrigger,
  onVoiceCheckAllProcessed,
}: DynamicChecklistProps) {
  const [responses, setResponses] = useState<Record<string, { valueBool?: boolean; valueText?: string }>>(
    () => initialResponses,
  );
  const [isOffline, setIsOffline] = useState(false);
  const [trainingModal, setTrainingModal] = useState<ProcedimentoInfo | null>(null);
  const uploadPhoto = useUploadPhoto();
  const logWatched = useLogWatched();

  useEffect(() => {
    setResponses(initialResponses);
  }, [initialResponses]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    });
    return () => unsub();
  }, []);

  const buildResponsesArray = useCallback(
    (current: typeof responses): ChecklistResponseInput[] => {
      return Object.entries(current).map(([checklistItemId, v]) => ({
        checklistItemId,
        valueBool: v.valueBool,
        valueText: v.valueText ?? null,
      }));
    },
    [],
  );

  const handleChange = useCallback(
    (itemId: string, value: boolean | string) => {
      const next = { ...responses };
      if (typeof value === 'boolean') {
        next[itemId] = { ...next[itemId], valueBool: value };
      } else {
        next[itemId] = { ...next[itemId], valueText: value };
      }
      setResponses(next);
      onResponsesChange(buildResponsesArray(next));
    },
    [responses, onResponsesChange, buildResponsesArray],
  );

  useEffect(() => {
    if (!voiceCheckRequest?.itemLabel) return;
    const found = items.find((i) => matchLabel(i.label, voiceCheckRequest!.itemLabel));
    if (found) {
      handleChange(found.id, true);
    }
    onVoiceCheckProcessed?.();
  }, [voiceCheckRequest, items, handleChange, onVoiceCheckProcessed]);

  const lastCheckAllTrigger = useRef(0);
  useEffect(() => {
    if (voiceCheckAllTrigger == null || voiceCheckAllTrigger <= 0 || voiceCheckAllTrigger === lastCheckAllTrigger.current) return;
    lastCheckAllTrigger.current = voiceCheckAllTrigger;
    setResponses((prev) => {
      const next = { ...prev };
      for (const item of items) {
        if (item.inputType === 'CHECKBOX') {
          next[item.id] = { ...next[item.id], valueBool: true };
        }
      }
      onResponsesChange(buildResponsesArray(next));
      return next;
    });
    onVoiceCheckAllProcessed?.();
  }, [voiceCheckAllTrigger, items, onResponsesChange, buildResponsesArray, onVoiceCheckAllProcessed]);

  const handleTakePhoto = useCallback(
    async (itemId: string) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão', 'É necessário permitir o acesso à câmera.');
        return;
      }
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: false,
        });
        if (result.canceled || !result.assets[0]?.uri) return;

        let uri = result.assets[0].uri;
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1200 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
          );
          uri = manipulated.uri;
        } catch {
          // usa original se falhar compressão
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
            type: 'BEFORE',
            timestamp: new Date().toISOString(),
            deviceId,
            lat,
            lng,
          },
        });

        if (uploadResult?.url) {
          handleChange(itemId, uploadResult.url);
        }
      } catch (e) {
        Alert.alert('Erro', getApiErrorMessage(e));
      }
    },
    [taskId, handleChange, uploadPhoto],
  );

  if (!isCheckinDone) {
    return (
      <View style={styles.disabled}>
        <Text style={styles.disabledText}>Conclua o check-in para habilitar o checklist.</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhum item de checklist para este tipo de limpeza.</Text>
      </View>
    );
  }

    return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <CloudOff size={18} color="#f59e0b" />
          <Text style={styles.offlineText}>Sem conexão. Os dados serão enviados quando a rede voltar.</Text>
        </View>
      )}
      <VideoTrainingModal
        visible={!!trainingModal}
        procedimento={trainingModal}
        onClose={() => setTrainingModal(null)}
        onWatched={(procedimentoId, pct) => {
          logWatched.mutate({ procedimentoId, percentualAssistido: pct });
        }}
        required={false}
      />
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              {item.label}
              {item.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            {(item.isRequired || item.procedimento) && item.procedimento?.videoUrlS3 && (
              <TouchableOpacity
                style={styles.videoIconBtn}
                onPress={() => setTrainingModal(item.procedimento as ProcedimentoInfo)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Video size={22} color="#0ea5e9" />
              </TouchableOpacity>
            )}
          </View>
          {item.inputType === 'CHECKBOX' && (
            <TouchableOpacity
              style={[styles.touchTarget, styles.checkboxRow]}
              onPress={() => handleChange(item.id, !(responses[item.id]?.valueBool ?? false))}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: responses[item.id]?.valueBool ?? false }}
            >
              <View
                style={[
                  styles.checkbox,
                  (responses[item.id]?.valueBool ?? false) && styles.checkboxChecked,
                ]}
              >
                {(responses[item.id]?.valueBool ?? false) && (
                  <Check size={18} color="#fff" strokeWidth={3} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Concluído</Text>
            </TouchableOpacity>
          )}
          {item.inputType === 'TEXT' && (
            <TextInput
              style={styles.textInput}
              placeholder="Observação..."
              placeholderTextColor="#64748b"
              value={responses[item.id]?.valueText ?? ''}
              onChangeText={(t) => handleChange(item.id, t)}
              multiline
              numberOfLines={2}
            />
          )}
          {item.inputType === 'PHOTO' && (
            <TouchableOpacity
              style={[styles.touchTarget, styles.photoBtn]}
              onPress={() => handleTakePhoto(item.id)}
              disabled={uploadPhoto.isPending}
              activeOpacity={0.7}
            >
              {uploadPhoto.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : responses[item.id]?.valueText ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: responses[item.id]?.valueText }} style={styles.thumb} />
                  <Text style={styles.photoLabel}>Foto anexada</Text>
                </View>
              ) : (
                <>
                  <Camera size={28} color="#fff" />
                  <Text style={styles.photoBtnText}>Tirar foto</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  disabled: {
    padding: 24,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledText: { color: '#64748b', fontSize: 14 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#422006',
    borderRadius: 8,
    marginBottom: 12,
  },
  offlineText: { color: '#fbbf24', fontSize: 14 },
  item: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { flex: 1, color: '#f8fafc', fontSize: 15, fontWeight: '500' },
  videoIconBtn: { padding: 4 },
  required: { color: '#ef4444' },
  touchTarget: { minHeight: MIN_TOUCH_SIZE, justifyContent: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkboxLabel: { color: '#cbd5e1', fontSize: 15 },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 14,
    color: '#f8fafc',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoBtn: {
    backgroundColor: '#475569',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  photoBtnText: { color: '#fff', fontWeight: '600' },
  photoPreview: { alignItems: 'center' },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  photoLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
