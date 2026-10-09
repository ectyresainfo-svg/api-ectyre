// Arranque local / Docker: node src/server.js
import http from 'node:http';
import { handleMcp } from './handler.js';
import { config } from './config.js';

const port = Number(process.env.PORT) || 3333;
http.createServer((req, res) => handleMcp(req, res)).listen(port, () => {
  console.log(`MCP Ectyre escuchando en http://localhost:${port}/mcp  (API: ${config.apiBaseUrl})`);
  if (!config.mcpToken && !config.allowNoAuth) console.warn('MCP_TOKEN no está definido: todas las peticiones serán rechazadas (401).');
});
