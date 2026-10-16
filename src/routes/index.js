const express = require("express");
const router = express.Router();

// ─── Google OAuth 2.0 ─────────────────────────────────────────────────
const routerAuth = require("./auth.router");

// Importar routers
const llantaRouter = require("./llanta.router");
const clienteRouter = require("./cliente.router");
const carritoRouter = require("./carrito.router");
const pedidoRouter = require("./pedido.router");
const direccionRouter = require("./direccion.router");
const adminRouter = require("./admin.router");
const vehiculoRouter = require("./vehiculo.router");
const imagenRouter = require("./imagen.router");
const catalogoRouter = require("./catalogo.router");
const productoRouter = require("./producto.router");
const productoAdminRouter = require("./productoAdmin.router");
const compatibilidadRouter = require("./compatibilidad.router");

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenido a API Ectyre v1",
    endpoints: ["/auth", "/productos", "/clientes", "/carrito", "/pedidos", "/direcciones", "/vehiculos", "/catalogos", "/compatibilidad", "/promociones", "/admin", "/admin/productos", "/admin/promociones"]
  });
});

// Configurar rutas
router.use("/auth", routerAuth);          // 🔑 Google OAuth
router.use("/llantas", llantaRouter);     // ⚠️ Deprecado: alias de lectura de /productos
router.use("/clientes", clienteRouter);
router.use("/carrito", carritoRouter);
router.use("/pedidos", pedidoRouter);
router.use("/direcciones", direccionRouter);
router.use("/admin", adminRouter);
router.use("/admin/productos", productoAdminRouter); // 📦 Crear / editar productos (reglas de negocio)
router.use("/admin", imagenRouter);   // 🖼️ Imágenes Cloudinary
router.use("/vehiculos", vehiculoRouter);
router.use("/catalogos", catalogoRouter);          // 📋 Niveles de inventario (tipos, marcas, modelos, medidas, especificaciones)
router.use("/productos", productoRouter);         // 📦 Catálogo público de productos
router.use("/compatibilidad", compatibilidadRouter); // 🔗 Compatibilidad llanta-vehículo
router.use("/promociones", require("./promocion.public.router")); // 🌍 Catálogo público de promociones (solo activas)
router.use("/admin/promociones", require("./promocion.router")); // 🔒 CRUD de promociones (panel admin)
router.use("/admin/media", require("./media.router")); // 📁 Biblioteca de medios (Cloudinary)

module.exports = router;
