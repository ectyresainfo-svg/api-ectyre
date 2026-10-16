const { Carrito, ItemCarrito, Producto } = require("../models");
const { NotFoundError, ValidationError } = require("../utils/customErrors");
const { includeProductoResumen } = require("../utils/productoHelpers");

const itemInclude = [
  {
    model: Producto,
    as: "producto",
    attributes: ["idProducto", "nombre", "precio", "precioAnterior", "stock", "activo"],
    include: includeProductoResumen(),
  },
];

class CarritoService {
  async getOrCreateCarrito(idCliente, sesionId = null) {
    let carrito;

    if (idCliente) {
      carrito = await Carrito.findOne({
        where: { idCliente, estado: "ACTIVO" },
        include: [
          {
            model: ItemCarrito,
            as: "items",
            include: itemInclude,
          },
        ],
      });

      if (!carrito) {
        carrito = await Carrito.create({ idCliente, estado: "ACTIVO" });
      }
    } else if (sesionId) {
      carrito = await Carrito.findOne({
        where: { sesionId, estado: "ACTIVO" },
        include: [
          {
            model: ItemCarrito,
            as: "items",
            include: itemInclude,
          },
        ],
      });

      if (!carrito) {
        carrito = await Carrito.create({ sesionId, estado: "ACTIVO" });
      }
    } else {
      throw new ValidationError("Se requiere idCliente o sesionId");
    }

    return carrito;
  }

  async agregarItem(carritoId, idProducto, cantidad) {
    const carrito = await Carrito.findByPk(carritoId);
    if (!carrito) {
      throw new NotFoundError("Carrito no encontrado");
    }

    const producto = await Producto.findByPk(idProducto);
    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }

    if (!producto.activo) {
      throw new ValidationError("Producto no disponible");
    }

    if (producto.stock < cantidad) {
      throw new ValidationError(
        `Stock insuficiente. Disponible: ${producto.stock}`
      );
    }

    let item = await ItemCarrito.findOne({
      where: { idCarrito: carritoId, idProducto },
    });

    if (item) {
      const nuevaCantidad = item.cantidad + cantidad;
      if (producto.stock < nuevaCantidad) {
        throw new ValidationError(
          `Stock insuficiente. Disponible: ${producto.stock}`
        );
      }
      await item.update({ cantidad: nuevaCantidad });
    } else {
      // `precio` es el precio de venta actual (el precio anterior solo se muestra tachado)
      const precio = producto.precio;
      item = await ItemCarrito.create({
        idCarrito: carritoId,
        idProducto,
        cantidad,
        precioUnitario: precio,
      });
    }

    return await this.getCarritoDetallado(carritoId);
  }

  // 🔒 El item debe pertenecer a `carritoId` (el carrito de quien llama).
  // Buscar solo por itemId permitía modificar el carrito de cualquier otro
  // cliente adivinando o probando su idItem.
  async actualizarItem(carritoId, itemId, cantidad) {
    const item = await ItemCarrito.findOne({
      where: { idItem: itemId, idCarrito: carritoId },
      include: [{ model: Producto, as: "producto" }],
    });

    if (!item) {
      throw new NotFoundError("Item no encontrado");
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new ValidationError("La cantidad debe ser un número entero mayor a 0");
    }

    if (item.producto.stock < cantidad) {
      throw new ValidationError(
        `Stock insuficiente. Disponible: ${item.producto.stock}`
      );
    }

    await item.update({ cantidad });

    return await this.getCarritoDetallado(carritoId);
  }

  // 🔒 Mismo criterio que actualizarItem: el item debe pertenecer a `carritoId`.
  async eliminarItem(carritoId, itemId) {
    const item = await ItemCarrito.findOne({
      where: { idItem: itemId, idCarrito: carritoId },
    });
    if (!item) {
      throw new NotFoundError("Item no encontrado");
    }

    await item.destroy();

    return await this.getCarritoDetallado(carritoId);
  }

  async vaciarCarrito(carritoId) {
    await ItemCarrito.destroy({ where: { idCarrito: carritoId } });
    return { message: "Carrito vaciado correctamente" };
  }

  async getCarritoDetallado(carritoId) {
    const carrito = await Carrito.findByPk(carritoId, {
      include: [
        {
          model: ItemCarrito,
          as: "items",
          include: itemInclude,
        },
      ],
    });

    if (!carrito) {
      throw new NotFoundError("Carrito no encontrado");
    }

    let subtotal = 0;
    carrito.items.forEach((item) => {
      subtotal += parseFloat(item.precioUnitario) * item.cantidad;
    });

    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    return {
      carrito,
      resumen: {
        cantidadItems: carrito.items.length,
        subtotal: subtotal.toFixed(2),
        iva: iva.toFixed(2),
        total: total.toFixed(2),
      },
    };
  }
}

module.exports = new CarritoService();
