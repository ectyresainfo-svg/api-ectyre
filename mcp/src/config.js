// Configuración del MCP — todo viene de variables de entorno.
export const config = {
  // URL base de la API REST (incluye /api/v1, sin barra final)
  apiBaseUrl: (process.env.API_BASE_URL || 'https://ectyre-backend.vercel.app/api/v1').replace(/\/+$/, ''),
  // Token que debe enviar el cliente (n8n) en "Authorization: Bearer <token>"
  mcpToken: process.env.MCP_TOKEN || '',
  // Solo para pruebas locales: permite llamar sin token
  allowNoAuth: process.env.ALLOW_NO_AUTH === 'true',
  // Dominio público de la tienda (opcional) para armar el enlace del producto
  storeUrl: (process.env.STORE_URL || '').replace(/\/+$/, ''),
  // Tiempo máximo de espera por llamada a la API (ms)
  timeoutMs: Number(process.env.API_TIMEOUT_MS) || 15000,
  // Máximo de productos que devuelve una herramienta
  maxResults: Number(process.env.MAX_RESULTS) || 10,
};
