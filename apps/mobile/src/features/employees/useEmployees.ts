import { useQuery } from '@tanstack/react-query';
import type { Employee } from '@sigeo/shared';
import apiClient from '../../services/apiClient';

interface EmployeesResponse {
  data: Employee[];
  total: number;
  totalPages: number;
}

export function useEmployeesList(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['employees', page, limit],
    queryFn: async (): Promise<EmployeesResponse> => {
      const { data } = await apiClient.get<EmployeesResponse>('/employees', {
        params: { page, limit },
      });
      return data;
    },
  });
}

/**
 * Para MVP: retorna o primeiro funcionário da lista como "eu".
 * Em produção você pode vincular User -> Employee na API ou permitir seleção.
 */
export function useMyEmployeeId(): string | null {
  const { data } = useEmployeesList(1, 10);
  const first = data?.data?.[0];
  return first?.id ?? null;
}
