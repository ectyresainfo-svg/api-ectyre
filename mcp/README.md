# Ectyre MCP (catálogo, solo lectura)

Servidor [MCP](https://modelcontextprotocol.io) que expone el catálogo de la API de Ectyre como herramientas
para un agente de IA (por ejemplo el bot de WhatsApp en n8n).

- **Solo lectura:** `src/api.js` únicamente hace `GET` a rutas públicas de la API. No usa credenciales de admin.
- **Transporte:** Streamable HTTP, sin estado (stateless) → funciona en Vercel y en cualquier servidor Node.
- **Autenticación:** `Authorization: Bearer <MCP_TOKEN>`. Si `MCP_TOKEN` no está definido, rechaza todo (401).

## Herramientas

| Herramienta | Para qué |
|---|---|
| `buscar_productos` | Texto libre, medida ("225/75R15"), marca o modelo |
| `buscar_por_medida` | ancho / alto / aro |
| `buscar_por_vehiculo` | marca, modelo y año del vehículo (los 3 obligatorios) |
| `listar_vehiculos` | Marcas y modelos de vehículos registrados |
| `detalle_producto` | Ficha completa por ID |
| `listar_productos` | Filtros por tipo, marca, destacados y ofertas |
| `recomendaciones` | Alternativas del mismo aro |
| `listar_tipos_producto` / `listar_marcas` / `listar_modelos` | Catálogos |

## Variables de entorno

Ver `.env.example`. Obligatoria: `MCP_TOKEN`. Genera uno con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Probar en local

```bash
npm install
MCP_TOKEN=un-token-de-prueba npm start      # en PowerShell: $env:MCP_TOKEN="..."; npm start
npm test
npx @modelcontextprotocol/inspector         # URL: http://localhost:3333/mcp (Streamable HTTP, header Authorization)
```

## Desplegar en Vercel

1. En Vercel: **Add New → Project** → importa el repo `api-ectyre` y en **Root Directory** pon `mcp`
   (es un proyecto aparte del de la API).
2. En **Environment Variables** define `MCP_TOKEN` (y opcionalmente `API_BASE_URL`, `STORE_URL`).
3. Deploy. La URL del MCP queda como `https://<proyecto>.vercel.app/mcp` (salud: `/health`).

## Limitaciones conocidas (del lado de la API en producción)

- `GET /vehiculos` y `GET /promociones` responden 404 en producción: la versión desplegada de la API no los trae.
  Por eso el MCP no usa promociones y `buscar_por_vehiculo` depende de `/productos/buscar-vehiculo`.
- El catálogo de producción tiene pocos productos hoy (1 llanta al momento de crear esto).
