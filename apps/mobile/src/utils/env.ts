/**
 * URL base da API (HTTPS obrigatório no dispositivo).
 * Definir EXPO_PUBLIC_API_URL em .env.development / .env.production.
 */
const PRODUCTION_API_URL = 'https://dapotha14ic3h.cloudfront.net';

function getApiBaseUrl(): string {
  const env = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined;
  const url = typeof env === 'string' && env.trim() ? env.trim() : PRODUCTION_API_URL;
  return url.replace(/\/$/, '');
}

/** URL usada para todas as requisições (login, check-in, tarefas, etc.). */
export const API_BASE_URL = getApiBaseUrl();

/**
 * URL usada especificamente para upload de foto.
 * Sempre aponta para produção para evitar falha de rede por .env local.
 */
export function getUploadApiUrl(): string {
  return PRODUCTION_API_URL;
}
