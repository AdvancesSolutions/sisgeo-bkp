/**
 * Extrai mensagem amigável de erro da API (400/422) ou de rede/auth.
 * Use em catch de chamadas api.* para exibir ao usuário.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string }; status?: number } }).response;
    if (res?.data?.message && typeof res.data.message === 'string') {
      return res.data.message;
    }
    if (res?.status === 401) return 'Sessão expirada. Faça login novamente.';
    if (res?.status === 403) return 'Você não tem permissão para esta ação.';
    if (res?.status === 404) return 'Recurso não encontrado.';
    if (res?.status && res.status >= 400) return `Erro ${res.status}. ${res.data?.message ?? ''}`.trim() || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
