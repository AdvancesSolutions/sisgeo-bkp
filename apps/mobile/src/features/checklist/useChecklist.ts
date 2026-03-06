import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

export interface ProcedimentoRef {
  id: string;
  titulo: string;
  videoUrlS3: string | null;
  manualPdfUrl: string | null;
  thumbnailUrl: string | null;
  duracaoSegundos?: number | null;
}

export interface ChecklistItem {
  id: string;
  cleaningTypeId: string;
  label: string;
  inputType: 'CHECKBOX' | 'PHOTO' | 'TEXT';
  isRequired: boolean;
  sortOrder: number;
  procedimento?: ProcedimentoRef | null;
}

export interface TaskChecklistResponse {
  id: string;
  taskId: string;
  checklistItemId: string;
  valueBool: boolean | null;
  valueText: string | null;
  checklistItem?: ChecklistItem;
}

export interface ChecklistResponseInput {
  checklistItemId: string;
  valueBool?: boolean | null;
  valueText?: string | null;
}

export function useChecklistItems(taskId: string | null) {
  return useQuery({
    queryKey: ['checklist', 'items', taskId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data } = await apiClient.get<ChecklistItem[]>(`/checklist/task/${taskId}/items`);
      return data;
    },
    enabled: !!taskId,
  });
}

export function useChecklistResponses(taskId: string | null) {
  return useQuery({
    queryKey: ['checklist', 'responses', taskId],
    queryFn: async (): Promise<TaskChecklistResponse[]> => {
      const { data } = await apiClient.get<TaskChecklistResponse[]>(`/checklist/task/${taskId}/responses`);
      return data;
    },
    enabled: !!taskId,
  });
}

export function useSaveChecklistResponses(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (responses: ChecklistResponseInput[]) => {
      const { data } = await apiClient.post<{ saved: number }>(`/checklist/task/${taskId}/responses`, {
        responses,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist', 'responses', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}
