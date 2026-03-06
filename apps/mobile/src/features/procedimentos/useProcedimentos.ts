import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

export interface Procedimento {
  id: string;
  areaId?: string | null;
  cleaningTypeId?: string | null;
  titulo: string;
  videoUrlS3: string | null;
  manualPdfUrl: string | null;
  thumbnailUrl: string | null;
  duracaoSegundos?: number | null;
}

export interface CheckInAllowedResponse {
  allowed: boolean;
  reason: string;
  procedimentos: Procedimento[];
}

export function useCheckInAllowed(taskId: string | null) {
  return useQuery({
    queryKey: ['procedimentos', 'check-in-allowed', taskId],
    queryFn: async (): Promise<CheckInAllowedResponse> => {
      const { data } = await apiClient.get<CheckInAllowedResponse>(
        `/procedimentos/check-in-allowed/${taskId}`,
      );
      return data;
    },
    enabled: !!taskId,
  });
}

export function useLogWatched() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      procedimentoId,
      percentualAssistido = 100,
    }: {
      procedimentoId: string;
      percentualAssistido?: number;
    }) => {
      const { data } = await apiClient.post('/procedimentos/watched', {
        procedimentoId,
        percentualAssistido,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['procedimentos'] });
    },
  });
}
