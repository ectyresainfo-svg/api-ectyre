import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatProduct, formatProductList } from '../src/format.js';

const producto = {
  idProducto: 1, nombre: '225/70r15 Nankang', tipoProducto: { nombre: 'LLANTAS' }, marca: { nombre: 'Nankang' },
  medidas: { texto: '225/70R15' }, precio: 125, precioAnterior: 130, descuentoPorcentaje: 4, stock: 8, disponible: true,
};

test('formatProduct muestra precio, descuento y stock', () => {
  const t = formatProduct(producto);
  assert.match(t, /\[ID 1\]/);
  assert.match(t, /Precio: \$125\.00 \(antes \$130\.00, 4% de descuento\)/);
  assert.match(t, /Stock: 8 unidades/);
});

test('formatProduct indica sin stock', () => {
  assert.match(formatProduct({ ...producto, disponible: false, stock: 0 }), /Sin stock/);
});

test('formatProductList devuelve el mensaje vacío', () => {
  assert.equal(formatProductList([], { vacio: 'nada' }), 'nada');
});

test('formatProductList recorta al límite e informa', () => {
  const lista = Array.from({ length: 5 }, (_, i) => ({ ...producto, idProducto: i + 1 }));
  const t = formatProductList(lista, { limite: 2 });
  assert.match(t, /Se muestran 2 de 5/);
});
