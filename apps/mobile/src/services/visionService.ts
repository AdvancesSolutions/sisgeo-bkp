import { apiClient } from './apiClient';

export interface Evidencia {
  id: string;
  taskPhotoId: string;
  limpo: boolean | null;
  confianca: number | null;
  detalhes: string | null;
  anomaliaDetectada: boolean;
  status: string;
  provider: string;
  createdAt: string;
}

/**
 * Busca a última evidência de análise IA para uma foto.
 * Usado pelo mobile para exibir alerta quando limpo: false e confianca > 80.
 */
export async function getEvidencia(taskPhotoId: string): Promise<Evidencia | null> {
  const { data } = await apiClient.get<Evidencia | null>(`/vision/evidencia/${taskPhotoId}`);
  return data;
}

/**
 * Indica se a evidência deve disparar alerta no mobile.
 */
export function deveExibirAlertaIA(evidencia: Evidencia | null): boolean {
  if (!evidencia) return false;
  return evidencia.limpo === false && (evidencia.confianca ?? 0) > 80;
}
