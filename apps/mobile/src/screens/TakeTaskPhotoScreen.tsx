import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Camera, Trash2, Send } from 'lucide-react-native';
import { useUploadPhoto } from '../features/upload/useUploadPhoto';
import { getDeviceId } from '../utils/deviceId';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import type { RootStackParamList } from '../app/types';

type Route = RouteProp<RootStackParamList, 'TakeTaskPhoto'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'TakeTaskPhoto'>;

const TYPE_LABEL = { BEFORE: 'Foto antes', AFTER: 'Foto depois' };

export function TakeTaskPhotoScreen({
  route,
  navigation,
}: {
  route: Route;
  navigation: Nav;
}) {
  const { taskId, type } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<React.ComponentRef<typeof CameraView> | null>(null);
  const uploadPhoto = useUploadPhoto();

  const handleTakePicture = async () => {
    if (!cameraRef.current || !cameraReady) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) setLastPhotoUri(photo.uri);
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  const handleUpload = async () => {
    if (!lastPhotoUri) return;
    try {
      const deviceId = await getDeviceId();
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {
        // segue sem coordenadas
      }
      await uploadPhoto.mutateAsync({
        uri: lastPhotoUri,
        metadata: {
          taskId,
          type,
          lat,
          lng,
          timestamp: new Date().toISOString(),
          deviceId,
        },
      });
      Alert.alert('Sucesso', `${TYPE_LABEL[type]} vinculada à tarefa.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  const handleDiscard = () => setLastPhotoUri(null);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Camera size={64} color="#64748b" style={styles.cameraIcon} />
        <Text style={styles.message}>Permita o acesso à câmera para registrar a foto.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (lastPhotoUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.badge}>{TYPE_LABEL[type]} — vinculada à tarefa</Text>
        <Image source={{ uri: lastPhotoUri }} style={styles.preview} resizeMode="contain" />
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleDiscard}
            disabled={uploadPhoto.isPending}
          >
            <Trash2 size={20} color="#fff" />
            <Text style={styles.btnText}>Descartar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleUpload}
            disabled={uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Send size={20} color="#fff" />
                <Text style={styles.btnText}>Enviar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>{TYPE_LABEL[type]}</Text>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleTakePicture}
          disabled={!cameraReady}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  badge: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  message: { color: '#94a3b8', textAlign: 'center', marginBottom: 16 },
  cameraIcon: { marginBottom: 16 },
  camera: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 4,
    borderColor: '#0ea5e9',
  },
  preview: { flex: 1, backgroundColor: '#000' },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#0f172a',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#0ea5e9' },
  btnSecondary: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontWeight: '600' },
});
