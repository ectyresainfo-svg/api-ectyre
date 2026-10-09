# Entrega al agente de n8n — conectar el MCP del catálogo al bot de WhatsApp

> De: Claude Code (backend) → Para: agente de n8n.
> El servidor MCP ya está construido y probado. Tu parte es conectarlo al bot y afinar el prompt.
> **No modifiques el MCP ni la API.** Si algo falla, anótalo en "Qué devolver" y se lo pasamos a quien mantiene el backend.

## Datos de conexión

| Dato | Valor |
|---|---|
| URL del MCP | `https://ectyre-mcp.vercel.app/mcp` |
| Transporte | **Streamable HTTP** (sin estado) |
| Autenticación | Header `Authorization: Bearer <MCP_TOKEN>` (credencial tipo *Header Auth* o *Bearer Auth* en n8n; el dueño del proyecto te entrega el token aparte; **no** lo pegues en el prompt ni en un nodo Code) |
| Salud | `GET <URL base>/health` → `{"ok":true}` |
| Permisos | Solo lectura. No puede cambiar precios ni stock. |

## Qué hacer en n8n

1. Abre el bot **"Ectyre S.A. - WhatsApp Chatwoot Integration"** (id `BgOV10GWR49ZInh5`). **Haz una copia de respaldo antes de editar.**
2. En el AI Agent, agrega el nodo **MCP Client Tool**:
   - Endpoint URL: la URL del MCP.
   - Server Transport: **HTTP Streamable**.
   - Authentication: Bearer, con una credencial nueva que guarde el token.
   - Tools to Include: *All* (son 10 herramientas, todas de lectura).
3. Ajusta el prompt del agente (ver abajo).
4. Prueba con las preguntas de la tabla.

## Herramientas disponibles

`buscar_productos(texto)`, `buscar_por_medida(ancho, alto, aro)`, `buscar_por_vehiculo(marca, modelo, anio)` (los 3 obligatorios), `listar_vehiculos(marca?)`,
`detalle_producto(id)`, `listar_productos(idTipoProducto, idMarca, destacados, soloOfertas)`,
`recomendaciones(aro)`, `listar_tipos_producto()`, `listar_marcas()`, `listar_modelos()`.

Cada producto se devuelve como una línea: `[ID n] nombre | Marca | Medida | Precio (antes/descuento) | Stock | Especificaciones | Imagen`.

## Reglas sugeridas para el prompt

- Para precio, stock, medidas y disponibilidad **usa siempre las herramientas**; no respondas de memoria ni desde la base de conocimiento de Supabase si hay conflicto (el catálogo es la fuente de verdad).
- Medida tipo "225/70R15" → `buscar_por_medida` (ancho=225, alto=70, aro=15).
- Si `Sin stock` o no hay resultados: dilo con claridad, ofrece `recomendaciones` del mismo aro y/o traspaso a un asesor humano.
- Nunca inventes productos, precios ni existencias.
- Si una herramienta devuelve error, no lo muestres crudo al cliente: discúlpate y ofrece pasar con un asesor.

## Pruebas a ejecutar

| Pregunta del cliente | Debe usar | Resultado esperado hoy |
|---|---|---|
| "¿Tienen llanta 225/70R15?" | `buscar_por_medida` | Nankang CW-25, $125, 8 en stock |
| "Busco llantas Nankang" | `buscar_productos` | El mismo producto |
| "¿Tienen 265/65R17?" | `buscar_por_medida` | "No hay llantas con esa medida" → ofrece alternativa/asesor |
| "¿Qué marcas manejan?" | `listar_marcas` | Nankang, Wanli |
| "Tengo una Hilux 2018" | `buscar_por_vehiculo` | Sin resultados (aún no hay compatibilidades cargadas) → pide la medida |
| "¿Qué ofertas hay?" | `listar_productos` con `soloOfertas` | Sin ofertas marcadas hoy |

## Qué devolver cuando termines

- ¿Conectó bien el nodo? (sí/no, y el error exacto si no).
- Resultado de cada prueba de la tabla (qué herramienta usó y qué respondió el bot).
- Cualquier respuesta rara, herramienta mal elegida o texto del MCP que confunda al modelo → lo ajusta quien mantiene el MCP.

## Notas

- El catálogo de producción hoy tiene pocos productos; muchas respuestas "no encontrado" son normales, no un fallo.
- Si recibes **401**: el token es incorrecto o falta el header. Si recibes **405** en una llamada GET: es esperado, el MCP solo acepta POST.
