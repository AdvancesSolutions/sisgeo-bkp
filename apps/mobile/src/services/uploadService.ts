import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUploadApiUrl } from '../utils/env';

export interface PhotoUploadMetadata {
  lat?: number;
  lng?: number;
  timestamp: string;
  deviceId: string;
  /** UUID da tarefa realizada no local/área (vincula foto à tarefa) */
  taskId?: string;
  /** Antes ou depois do serviço (ex.: faxina) */
  type?: 'BEFORE' | 'AFTER';
}

export interface PhotoUploadResult {
  url: string;
  key: string;
}

/**
 * Garante token válido antes do upload (refresh automático se expirado).
 * Usa a mesma URL do upload (produção) para /auth/me e /auth/refresh.
 */
async function ensureValidToken(): Promise<string> {
  const baseUrl = getUploadApiUrl();
  let token = await AsyncStorage.getItem('accessToken');
  if (!token) throw new Error('Faça login novamente.');

  let res = await fetch(`${baseUrl}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (!refresh) throw new Error('Sessão expirada. Faça login novamente.');
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!refreshRes.ok) throw new Error('Sessão expirada. Faça login novamente.');
    const data = (await refreshRes.json()) as { accessToken: string; refreshToken?: string };
    await AsyncStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) await AsyncStorage.setItem('refreshToken', data.refreshToken);
    token = data.accessToken;
  }

  return token;
}

/**
 * Executa um único POST de upload com o token informado.
 * Retorna a resposta ou rejeita com o status e mensagem.
 */
function doUpload(
  url: string,
  formData: FormData,
  token: string
): Promise<PhotoUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timeoutId = setTimeout(() => xhr.abort(), 60000);

    xhr.onload = () => {
      clearTimeout(timeoutId);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as PhotoUploadResult);
        } catch {
          reject(new Error('Resposta inválida do servidor.'));
        }
        return;
      }
      let message = 'Falha ao enviar foto.';
      try {
        const json = JSON.parse(xhr.responseText) as { message?: unknown };
        if (json?.message) {
          if (Array.isArray(json.message)) {
            message = (json.message as string[]).join(', ');
          } else if (typeof json.message === 'string') {
            message = json.message;
          }
        }
      } catch {
        if (xhr.responseText) message = xhr.responseText;
      }
      reject(Object.assign(new Error(message), { status: xhr.status }));
    };

    xhr.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Falha de rede. Verifique a conexão e a URL da API.'));
    };

    xhr.ontimeout = () => {
      clearTimeout(timeoutId);
      reject(new Error('Tempo esgotado. Tente novamente.'));
    };

    xhr.open('POST', url);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 60000;
    xhr.send(formData);
  });
}

function buildFormData(imageUri: string, metadata: PhotoUploadMetadata): FormData {
  const formData = new FormData();
  const name = imageUri.split('/').pop() || `photo-${Date.now()}.jpg`;
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name,
  } as unknown as Blob);
  formData.append('timestamp', metadata.timestamp);
  formData.append('deviceId', metadata.deviceId);
  if (metadata.lat != null) formData.append('lat', String(metadata.lat));
  if (metadata.lng != null) formData.append('lng', String(metadata.lng));
  if (metadata.taskId) formData.append('taskId', metadata.taskId);
  if (metadata.type) formData.append('type', metadata.type);
  return formData;
}

/**
 * Envia foto via multipart/form-data para POST /upload/photo.
 * Usa XMLHttpRequest (mais estável que fetch com FormData no React Native).
 * Em 401, renova o token e tenta enviar novamente uma vez.
 */
export async function uploadPhoto(
  imageUri: string,
  metadata: PhotoUploadMetadata
): Promise<PhotoUploadResult> {
  const url = `${getUploadApiUrl()}/upload/photo`;
  let token = await ensureValidToken();

  try {
    return await doUpload(url, buildFormData(imageUri, metadata), token);
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401) {
      token = await ensureValidToken();
      return doUpload(url, buildFormData(imageUri, metadata), token);
    }
    throw err;
  }
}
