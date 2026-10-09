import { config } from './config.js';

// Cliente GET de solo lectura hacia la API de Ectyre.
// Este módulo NO tiene ninguna función que escriba: el MCP es solo consulta.
export async function apiGet(path, params = {}) {
  const url = new URL(config.apiBaseUrl + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  let body = null;
  try { body = await res.json(); } catch { /* respuesta sin JSON */ }
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `La API respondió ${res.status}`);
  }
  return body?.data;
}
