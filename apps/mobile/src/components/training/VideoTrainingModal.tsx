import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { X } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = 220;

export interface ProcedimentoInfo {
  id: string;
  titulo: string;
  videoUrlS3: string | null;
  manualPdfUrl: string | null;
  thumbnailUrl: string | null;
  duracaoSegundos?: number | null;
}

interface VideoTrainingModalProps {
  visible: boolean;
  procedimento: ProcedimentoInfo | null;
  onClose: () => void;
  onWatched?: (procedimentoId: string, percentualAssistido: number) => void;
  required?: boolean; // Se true, exige assistir antes de fechar
}

const CACHE_DIR = `${FileSystem.cacheDirectory}procedimentos/`;

async function getCachedVideoPath(url: string): Promise<string> {
  const filename = url.split('/').pop() || `video-${Date.now()}.mp4`;
  const localPath = `${CACHE_DIR}${filename}`;
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) return localPath;
  await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  await FileSystem.downloadAsync(url, localPath);
  return localPath;
}

export function VideoTrainingModal({
  visible,
  procedimento,
  onClose,
  onWatched,
  required = false,
}: VideoTrainingModalProps) {
  const videoRef = useRef<Video>(null);
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [canClose, setCanClose] = useState(!required);

  const loadVideo = useCallback(async () => {
    if (!procedimento?.videoUrlS3) {
      setError('Vídeo não disponível');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const uri = await getCachedVideoPath(procedimento.videoUrlS3);
      setSourceUri(uri);
    } catch (e) {
      setError('Falha ao carregar vídeo');
      setSourceUri(procedimento.videoUrlS3);
    } finally {
      setLoading(false);
    }
  }, [procedimento?.videoUrlS3]);

  useEffect(() => {
    if (visible && procedimento) {
      loadVideo();
      setProgress(0);
      setCanClose(!required);
    } else if (!visible) {
      setSourceUri(null);
      setError(null);
    }
  }, [visible, procedimento, required, loadVideo]);

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const pct = status.durationMillis
        ? (status.positionMillis / status.durationMillis) * 100
        : 0;
      setProgress(pct);
      if (pct >= 80 && required) {
        setCanClose(true);
      }
    },
    [required],
  );

  const handleClose = useCallback(() => {
    if (required && !canClose) return;
    if (onWatched && procedimento && progress >= 80) {
      onWatched(procedimento.id, Math.round(progress));
    }
    onClose();
  }, [required, canClose, onWatched, procedimento, progress, onClose]);

  if (!procedimento) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {procedimento.titulo}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={required && !canClose}
              style={[styles.closeBtn, required && !canClose && styles.closeDisabled]}
            >
              <X size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          {required && !canClose && (
            <Text style={styles.hint}>
              Assista até 80% do vídeo para continuar
            </Text>
          )}

          {loading ? (
            <View style={[styles.videoPlaceholder, styles.centered]}>
              <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
          ) : error ? (
            <View style={[styles.videoPlaceholder, styles.centered]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : sourceUri ? (
            <Video
              ref={videoRef}
              source={{ uri: sourceUri }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              shouldPlay={false}
            />
          ) : null}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, canClose ? styles.btnPrimary : styles.btnDisabled]}
              onPress={handleClose}
              disabled={!canClose}
            >
              <Text style={styles.btnText}>
                {canClose ? 'Fechar' : `Assista o vídeo (${Math.round(progress)}%)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  closeDisabled: {
    opacity: 0.5,
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  videoPlaceholder: {
    height: VIDEO_HEIGHT,
    backgroundColor: '#0f172a',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  video: {
    width: SCREEN_WIDTH - 32,
    height: VIDEO_HEIGHT,
    alignSelf: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  btn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0ea5e9',
  },
  btnDisabled: {
    backgroundColor: '#475569',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
