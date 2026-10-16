const carritoService = require("../services/carrito.services");
const catchError = require("../utils/catchError");

// 🔒 idCliente SOLO sale del JWT verificado — nunca del body. Aceptarlo del
// body permitía leer, llenar o vaciar el carrito de cualquier otro cliente
// con solo mandar { idCliente: X } sin token.
const identidadCarrito = (req) => ({
  idCliente: req.user?.idCliente,
  sesionId: req.query.sesionId || req.body.sesionId,
});

// Obtener carrito
const getCarrito = catchError(async (req, res) => {
  const { idCliente, sesionId } = identidadCarrito(req);

  const carritoExistente = await carritoService.getOrCreateCarrito(idCliente, sesionId);
  const carrito = await carritoService.getCarritoDetallado(carritoExistente.idCarrito);

  res.status(200).json({
    success: true,
    message: "Carrito obtenido correctamente",
    data: carrito,
  });
});

// Agregar item al carrito
const agregarItem = catchError(async (req, res) => {
  const { idCliente, sesionId } = identidadCarrito(req);
  const { idProducto, cantidad } = req.body;

  const carritoExistente = await carritoService.getOrCreateCarrito(
    idCliente,
    sesionId
  );

  const carrito = await carritoService.agregarItem(
    carritoExistente.idCarrito,
    idProducto,
    cantidad
  );

  res.status(201).json({
    success: true,
    message: "Producto agregado al carrito",
    data: carrito,
  });
});

// Actualizar cantidad de item
// 🔒 Se resuelve primero el carrito de quien llama y se le pasa al servicio,
// que solo busca el item DENTRO de ese carrito — así un item de otro cliente
// nunca puede modificarse, aunque se adivine su idItem.
const actualizarItem = catchError(async (req, res) => {
  const { idCliente, sesionId } = identidadCarrito(req);
  const { id } = req.params;
  const { cantidad } = req.body;

  const carritoExistente = await carritoService.getOrCreateCarrito(idCliente, sesionId);
  const carrito = await carritoService.actualizarItem(
    carritoExistente.idCarrito,
    parseInt(id),
    parseInt(cantidad, 10)
  );

  res.status(200).json({
    success: true,
    message: "Cantidad actualizada",
    data: carrito,
  });
});

// Eliminar item del carrito
// 🔒 Mismo criterio que actualizarItem: el item debe pertenecer al carrito de quien llama.
const eliminarItem = catchError(async (req, res) => {
  const { idCliente, sesionId } = identidadCarrito(req);
  const { id } = req.params;

  const carritoExistente = await carritoService.getOrCreateCarrito(idCliente, sesionId);
  const carrito = await carritoService.eliminarItem(carritoExistente.idCarrito, parseInt(id));

  res.status(200).json({
    success: true,
    message: "Producto eliminado del carrito",
    data: carrito,
  });
});

// Vaciar carrito
const vaciarCarrito = catchError(async (req, res) => {
  const { idCliente, sesionId } = identidadCarrito(req);

  const carritoExistente = await carritoService.getOrCreateCarrito(
    idCliente,
    sesionId
  );
  const result = await carritoService.vaciarCarrito(
    carritoExistente.idCarrito
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  getCarrito,
  agregarItem,
  actualizarItem,
  eliminarItem,
  vaciarCarrito,
};
