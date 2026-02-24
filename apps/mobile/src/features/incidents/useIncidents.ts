import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

export type IncidentType = 'FALTA_MATERIAL' | 'QUEBRA_EQUIPAMENTO' | 'OUTRO';

export interface CreateIncidentInput {
  employeeId: string;
  type: IncidentType;
  description: string;
  organizationId?: string | null;
  areaId?: string | null;
}

export interface Incident {
  id: string;
  employeeId: string;
  type: string;
  description: string;
  status: string;
  organizationId?: string | null;
  createdAt: string;
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIncidentInput): Promise<Incident> => {
      const { data } = await apiClient.post<Incident>('/incidents', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}
