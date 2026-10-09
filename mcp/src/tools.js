import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiGet } from './api.js';
import { config } from './config.js';
import { formatProduct, formatProductList, text, fail } from './format.js';

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const limite = z.number().int().min(1).max(50).optional().describe(`Máximo de resultados (por defecto ${config.maxResults})`);

// Envuelve cada herramienta para devolver siempre un error legible en lugar de romper.
const safe = (fn) => async (args) => {
  try { return await fn(args || {}); } catch (e) { return fail(e); }
};

export function createServer() {
  const server = new McpServer(
    { name: 'ectyre-catalogo', version: '1.0.0' },
    {
      instructions:
        'Catálogo de Ectyre S.A. (llantas, baterías y accesorios). Solo lectura: consulta productos, precios, stock y catálogos. ' +
        'Para medidas como "225/70R15" usa buscar_por_medida (ancho/alto/aro) o buscar_productos con el texto. ' +
        'No inventes precios ni stock: usa siempre lo que devuelvan las herramientas.',
    },
  );

  server.registerTool('buscar_productos', {
    title: 'Buscar productos por texto',
    description:
      'Búsqueda general en el catálogo. Acepta una medida ("225/75R15"), una marca, un modelo o texto libre ("llanta todo terreno"). ' +
      'Úsala cuando el cliente describe lo que busca con sus palabras.',
    inputSchema: { texto: z.string().min(1).describe('Medida, marca, modelo o texto libre'), limite },
    annotations: readOnly,
  }, safe(async ({ texto, limite: l }) => {
    const data = await apiGet('/productos/buscar-general', { q: texto });
    const r = data?.resultados ?? [];
    let out = formatProductList(r, { limite: l, vacio: `No hay productos que coincidan con "${texto}".` });
    if (!r.length && data?.recomendaciones?.length) {
      out += `\n\nAlternativas similares:\n${data.recomendaciones.slice(0, 5).map(formatProduct).join('\n')}`;
    }
    return text(out);
  }));

  server.registerTool('buscar_por_medida', {
    title: 'Buscar llantas por medida',
    description: 'Busca llantas por medida exacta. Ejemplo: "225/70R15" → ancho=225, alto=70, aro=15. Puedes omitir alguno para ampliar la búsqueda.',
    inputSchema: {
      ancho: z.number().int().optional().describe('Ancho en mm, ej. 225'),
      alto: z.number().int().optional().describe('Perfil/alto, ej. 70'),
      aro: z.number().optional().describe('Aro en pulgadas, ej. 15'),
      limite,
    },
    annotations: readOnly,
  }, safe(async ({ ancho, alto, aro, limite: l }) => {
    if (ancho == null && alto == null && aro == null) return text('Indica al menos ancho, alto o aro.');
    const data = await apiGet('/productos/buscar-medida', { ancho, alto, aro });
    return text(formatProductList(data, { limite: l, vacio: 'No hay llantas con esa medida.' }));
  }));

  server.registerTool('buscar_por_vehiculo', {
    title: 'Buscar llantas compatibles con un vehículo',
    description: 'Busca llantas compatibles según la marca, modelo y año del vehículo del cliente. Los tres datos son obligatorios; si falta alguno, pídeselo al cliente. Usa listar_vehiculos para ver qué marcas y modelos existen.',
    inputSchema: {
      marca: z.string().describe('Marca del vehículo, ej. Toyota'),
      modelo: z.string().describe('Modelo, ej. Hilux'),
      anio: z.number().int().min(1950).max(2100).describe('Año, ej. 2018'),
      limite,
    },
    annotations: readOnly,
  }, safe(async ({ marca, modelo, anio, limite: l }) => {
    const data = await apiGet('/productos/buscar-vehiculo', { marca, modelo, anio });
    return text(formatProductList(data, { limite: l, vacio: 'No hay llantas registradas como compatibles con ese vehículo. Sugiere buscar por medida.' }));
  }));

  server.registerTool('listar_vehiculos', {
    title: 'Listar vehículos registrados',
    description: 'Lista las marcas de vehículos y sus modelos registrados en el catálogo. Útil para validar lo que dice el cliente antes de usar buscar_por_vehiculo.',
    inputSchema: { marca: z.string().optional().describe('Filtra por marca, ej. Toyota') },
    annotations: readOnly,
  }, safe(async ({ marca }) => {
    let data = (await apiGet('/vehiculos/marcas/completo')) || [];
    if (marca) data = data.filter((m) => m.nombre.toLowerCase().includes(marca.toLowerCase()));
    return text(data.map((m) => `${m.nombre}: ${(m.modelos || []).map((x) => `${x.nombre}${x.tipoVehiculo ? ` (${x.tipoVehiculo})` : ''}`).join(', ') || 'sin modelos'}`).join('\n') || 'No hay vehículos registrados con ese filtro.');
  }));

  server.registerTool('detalle_producto', {
    title: 'Detalle de un producto',
    description: 'Devuelve toda la información de un producto (precio, stock, especificaciones, imagen) a partir de su ID.',
    inputSchema: { id: z.number().int().positive().describe('ID del producto, el número que aparece como [ID n]') },
    annotations: readOnly,
  }, safe(async ({ id }) => text(formatProduct(await apiGet(`/productos/${id}`)))));

  server.registerTool('listar_productos', {
    title: 'Listar productos del catálogo',
    description: 'Lista productos con filtros opcionales por tipo, marca, destacados u ofertas. Sin filtros devuelve los primeros del catálogo.',
    inputSchema: {
      idTipoProducto: z.number().int().optional().describe('ID del tipo (ver listar_tipos_producto)'),
      idMarca: z.number().int().optional().describe('ID de la marca (ver listar_marcas)'),
      destacados: z.boolean().optional().describe('Solo productos destacados'),
      soloOfertas: z.boolean().optional().describe('Solo productos en oferta'),
      limite,
    },
    annotations: readOnly,
  }, safe(async ({ idTipoProducto, idMarca, destacados, soloOfertas, limite: l }) => {
    let data = await apiGet('/productos', {
      idTipoProducto, idMarca, destacado: destacados ? 'true' : undefined, limit: soloOfertas ? 100 : (l || config.maxResults),
    });
    if (soloOfertas) data = (data || []).filter((p) => p.enOferta);
    return text(formatProductList(data, { limite: l, vacio: 'No hay productos con esos filtros.' }));
  }));

  server.registerTool('recomendaciones', {
    title: 'Productos recomendados',
    description: 'Sugiere llantas del mismo aro, útil para ofrecer alternativas.',
    inputSchema: {
      aro: z.number().describe('Aro en pulgadas'),
      excluirIds: z.array(z.number().int()).optional().describe('IDs de productos a excluir'),
      limite,
    },
    annotations: readOnly,
  }, safe(async ({ aro, excluirIds, limite: l }) => {
    const data = await apiGet('/productos/recomendaciones', { aro, excluir: excluirIds?.join(',') });
    return text(formatProductList(data, { limite: l, vacio: 'No hay recomendaciones para ese aro.' }));
  }));

  server.registerTool('listar_tipos_producto', {
    title: 'Listar tipos de producto',
    description: 'Lista las categorías del catálogo (llantas, baterías, etc.) con su ID y cuántos productos tiene cada una.',
    inputSchema: {},
    annotations: readOnly,
  }, safe(async () => {
    const data = (await apiGet('/catalogos/tipos-producto')) || [];
    return text(data.filter((t) => t.activo !== false).map((t) => `[ID ${t.idTipoProducto}] ${t.nombre} — ${t.totalProductos} producto(s), ${t.totalMarcas} marca(s)`).join('\n') || 'Sin tipos de producto.');
  }));

  server.registerTool('listar_marcas', {
    title: 'Listar marcas',
    description: 'Lista las marcas disponibles, opcionalmente de un tipo de producto.',
    inputSchema: { idTipoProducto: z.number().int().optional().describe('Filtra por tipo de producto') },
    annotations: readOnly,
  }, safe(async ({ idTipoProducto }) => {
    const data = (await apiGet('/catalogos/marcas', { idTipoProducto })) || [];
    return text(data.filter((m) => m.activo !== false).map((m) => `[ID ${m.idMarca}] ${m.nombre}${m.paisOrigen ? ` (${m.paisOrigen})` : ''} — ${m.totalProductos} producto(s)`).join('\n') || 'Sin marcas.');
  }));

  server.registerTool('listar_modelos', {
    title: 'Listar modelos',
    description: 'Lista los modelos de producto, opcionalmente de una marca.',
    inputSchema: {
      idMarca: z.number().int().optional().describe('Filtra por marca'),
      idTipoProducto: z.number().int().optional().describe('Filtra por tipo de producto'),
    },
    annotations: readOnly,
  }, safe(async ({ idMarca, idTipoProducto }) => {
    const data = (await apiGet('/catalogos/modelos', { idMarca, idTipoProducto })) || [];
    return text(data.filter((m) => m.activo !== false).map((m) => `[ID ${m.idModelo}] ${m.marca?.nombre || ''} ${m.nombre}${m.tipoUso?.descripcion ? ` — ${m.tipoUso.descripcion}` : ''} — ${m.totalProductos} producto(s)`).join('\n') || 'Sin modelos.');
  }));

  return server;
}
