import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config.js';
import { createServer } from './tools.js';

const safeEqual = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

function authorized(req) {
  if (config.allowNoAuth) return true;
  if (!config.mcpToken) return false; // sin token configurado el servidor se niega a responder
  const m = /^Bearer\s+(.+)$/i.exec(req.headers['authorization'] || '');
  return Boolean(m) && safeEqual(m[1], config.mcpToken);
}

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  if (req.body !== undefined) return req.body; // Vercel ya lo parsea
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : undefined;
}

// Handler HTTP sin estado (stateless): cada petición crea su propio servidor MCP.
// Funciona igual en Vercel (serverless) y en un servidor Node normal.
export async function handleMcp(req, res) {
  if (req.url?.startsWith('/health')) return send(res, 200, { ok: true, name: 'ectyre-mcp' });

  if (!authorized(req)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return send(res, 401, { jsonrpc: '2.0', error: { code: -32001, message: 'No autorizado' }, id: null });
  }
  if (req.method !== 'POST') {
    // En modo stateless no hay streams SSE ni sesiones que abrir o cerrar
    res.setHeader('Allow', 'POST');
    return send(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Método no permitido' }, id: null });
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, await readBody(req));
  } catch (e) {
    console.error('[mcp] error:', e);
    if (!res.headersSent) send(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: 'Error interno' }, id: null });
  }
}
