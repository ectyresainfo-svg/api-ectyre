import { config } from './config.js';

const money = (n) => `$${Number(n).toFixed(2)}`;

// Convierte un producto de la API en una línea de texto compacta para el LLM.
export function formatProduct(p) {
  const parts = [`[ID ${p.idProducto}] ${p.nombre}`];
  if (p.tipoProducto?.nombre) parts.push(`Tipo: ${p.tipoProducto.nombre}`);
  if (p.marca?.nombre) parts.push(`Marca: ${p.marca.nombre}`);
  if (p.modelo?.nombre) parts.push(`Modelo: ${p.modelo.nombre}`);
  if (p.medidas?.texto) parts.push(`Medida: ${p.medidas.texto}`);

  let precio = `Precio: ${money(p.precio)}`;
  if (p.precioAnterior && Number(p.precioAnterior) > Number(p.precio)) {
    precio += ` (antes ${money(p.precioAnterior)}, ${p.descuentoPorcentaje || 0}% de descuento)`;
  }
  parts.push(precio);
  parts.push(p.disponible ? `Stock: ${p.stock} unidades (disponible)` : 'Sin stock');

  const flags = [];
  if (p.enOferta) flags.push('en oferta');
  if (p.esNuevo) flags.push('nuevo');
  if (p.envioGratis) flags.push('envío gratis');
  if (p.aplicaGarantia) flags.push('con garantía');
  if (flags.length) parts.push(`Etiquetas: ${flags.join(', ')}`);

  if (p.descripcion) parts.push(`Descripción: ${p.descripcion}`);
  const specs = (p.especificaciones || []).filter((e) => e.valor).map((e) => `${e.nombre}: ${e.valor}`);
  if (specs.length) parts.push(`Especificaciones: ${specs.join('; ')}`);
  if (p.imagenPrincipal) parts.push(`Imagen: ${p.imagenPrincipal}`);
  if (config.storeUrl) parts.push(`Enlace: ${config.storeUrl}/product/${p.idProducto}`);
  return parts.join(' | ');
}

export function formatProductList(list, { vacio = 'No se encontraron productos.', limite } = {}) {
  const items = Array.isArray(list) ? list : [];
  if (!items.length) return vacio;
  const max = limite || config.maxResults;
  const shown = items.slice(0, max);
  const lines = shown.map(formatProduct);
  const extra = items.length > shown.length ? `\n(Se muestran ${shown.length} de ${items.length}; afina la búsqueda para ver otros.)` : '';
  return `${items.length} producto(s) encontrado(s):\n${lines.join('\n')}${extra}`;
}

export const text = (t) => ({ content: [{ type: 'text', text: t }] });
export const fail = (e) => ({ isError: true, content: [{ type: 'text', text: `Error al consultar el catálogo: ${e.message}` }] });
