/**
 * Extrai mensagem de erro amigável a partir de erros da API (Axios ou genérico).
 */
export function getApiErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const res = (e as { response?: { data?: unknown; status?: number } }).response;
    if (res?.data && typeof res.data === 'object' && 'message' in res.data) {
      const msg = (res.data as { message?: unknown }).message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg.map(String).join(', ');
    }
    if (res?.status === 401) return 'Sessão expirada. Faça login novamente.';
    if (res?.status === 403) return 'Sem permissão para esta ação.';
    if (res?.status === 404) return 'Recurso não encontrado.';
    if (res?.status && res.status >= 500) return 'Erro no servidor. Tente mais tarde.';
  }
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return 'Ocorreu um erro. Tente novamente.';
}
