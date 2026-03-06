import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TimeClock } from '@sigeo/shared';
import apiClient from '../../services/apiClient';
import { addToOfflineQueueWithPhoto } from '../../services/syncService';
import { isNetworkError } from '../../utils/offlineQueue';

export interface TimeClockCheckPayload {
  employeeId: string;
  lat: number;
  lng: number;
  photoUri: string;
}

export function useTimeClockHistory(employeeId: string | null, limit = 20) {
  return useQuery({
    queryKey: ['timeclock', employeeId, limit],
    queryFn: async (): Promise<TimeClock[]> => {
      const { data } = await apiClient.get<TimeClock[]>(
        `/time-clock/employee/${employeeId}`,
        { params: { limit } }
      );
      return Array.isArray(data) ? data : (data as { data?: TimeClock[] })?.data ?? [];
    },
    enabled: !!employeeId,
  });
}

export function useCheckIn(employeeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TimeClockCheckPayload) => {
      const formData = new FormData();
      formData.append('file', {
        uri: payload.photoUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      formData.append('employeeId', payload.employeeId);
      formData.append('lat', payload.lat.toString());
      formData.append('lng', payload.lng.toString());

      const { data } = await apiClient.post<TimeClock>('/time-clock/checkin', formData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeclock'] });
      qc.invalidateQueries({ queryKey: ['offlineQueue'] });
    },
    onError: async (err, payload) => {
      if (isNetworkError(err)) {
        await addToOfflineQueueWithPhoto('checkin', payload);
        qc.invalidateQueries({ queryKey: ['offlineQueue'] });
      }
    },
  });
}

export function useCheckOut(employeeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TimeClockCheckPayload) => {
      const formData = new FormData();
      formData.append('file', {
        uri: payload.photoUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      formData.append('employeeId', payload.employeeId);
      formData.append('lat', payload.lat.toString());
      formData.append('lng', payload.lng.toString());

      const { data } = await apiClient.post<TimeClock>('/time-clock/checkout', formData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeclock'] });
      qc.invalidateQueries({ queryKey: ['offlineQueue'] });
    },
    onError: async (err, payload) => {
      if (isNetworkError(err)) {
        await addToOfflineQueueWithPhoto('checkout', payload);
        qc.invalidateQueries({ queryKey: ['offlineQueue'] });
      }
    },
  });
}
