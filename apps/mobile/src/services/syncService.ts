/**
 * Serviço de sincronização offline.
 * Armazena payload (JSON + imagem em base64) quando a API falha por conexão.
 * retrySync() dispara ao detectar sinal de rede.
 */

import * as FileSystem from 'expo-file-system';
import apiClient from './apiClient';
import {
  getPendingActions,
  removePendingAction,
  addPendingAction,
  type PendingAction,
  type PendingActionType,
} from '../utils/offlineQueue';

/** Converte URI de imagem para base64 (para armazenamento offline). */
export async function uriToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/** Cria FormData a partir de payload com photoBase64 (para retry). React Native exige URI de arquivo. */
async function buildCheckinCheckoutFormData(p: {
  employeeId: string;
  lat: number;
  lng: number;
  photoBase64: string;
}): Promise<FormData> {
  const formData = new FormData();
  const tempPath = `${FileSystem.cacheDirectory}retry_photo_${Date.now()}.jpg`;
  await FileSystem.writeAsStringAsync(tempPath, p.photoBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  formData.append('file', {
    uri: tempPath,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  formData.append('employeeId', p.employeeId);
  formData.append('lat', p.lat.toString());
  formData.append('lng', p.lng.toString());
  return formData;
}

async function runAction(action: PendingAction): Promise<boolean> {
  try {
    if (action.type === 'checkin') {
      const p = action.payload as {
        employeeId: string;
        lat: number;
        lng: number;
        photoBase64?: string;
        photoUri?: string;
      };
      if (!p.photoBase64 && p.photoUri) {
        p.photoBase64 = await uriToBase64(p.photoUri);
      }
      if (!p.photoBase64) {
        return false;
      }
      const formData = await buildCheckinCheckoutFormData({
        employeeId: p.employeeId,
        lat: p.lat,
        lng: p.lng,
        photoBase64: p.photoBase64,
      });
      await apiClient.post('/time-clock/checkin', formData);
    } else if (action.type === 'checkout') {
      const p = action.payload as {
        employeeId: string;
        lat: number;
        lng: number;
        photoBase64?: string;
        photoUri?: string;
      };
      if (!p.photoBase64 && p.photoUri) {
        p.photoBase64 = await uriToBase64(p.photoUri);
      }
      if (!p.photoBase64) {
        return false;
      }
      const formData = await buildCheckinCheckoutFormData({
        employeeId: p.employeeId,
        lat: p.lat,
        lng: p.lng,
        photoBase64: p.photoBase64,
      });
      await apiClient.post('/time-clock/checkout', formData);
    } else if (action.type === 'updateTask') {
      const p = action.payload as { id: string; status: string; checkinLat?: number; checkinLng?: number; checkoutLat?: number; checkoutLng?: number };
      const { id, ...body } = p;
      await apiClient.patch(`/tasks/${id}`, body);
    } else {
      return false;
    }
    await removePendingAction(action.id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tenta sincronizar todas as ações pendentes.
 * Retorna { synced, failed }.
 */
export async function retrySync(): Promise<{ synced: number; failed: number }> {
  const actions = await getPendingActions();
  let synced = 0;
  let failed = 0;
  for (const action of actions) {
    const ok = await runAction(action);
    if (ok) synced++;
    else failed++;
  }
  return { synced, failed };
}

/**
 * Adiciona ação à fila offline com suporte a imagem.
 * Para checkin/checkout: converte photoUri em base64 antes de armazenar.
 */
export async function addToOfflineQueueWithPhoto(
  type: 'checkin' | 'checkout',
  payload: { employeeId: string; lat: number; lng: number; photoUri: string },
): Promise<PendingAction> {
  const base64 = await uriToBase64(payload.photoUri);
  const action = await addPendingAction(type, {
    employeeId: payload.employeeId,
    lat: payload.lat,
    lng: payload.lng,
    photoBase64: base64,
  });
  return action;
}

export { getPendingActions, addPendingAction };
export type { PendingAction, PendingActionType };
