const express = require("express");
const {
  getCarrito,
  agregarItem,
  actualizarItem,
  eliminarItem,
  vaciarCarrito,
} = require("../controllers/carrito.controllers");
const { verifyJWT } = require("../middlewares/auth.middleware");
const {
  validateCarritoItem,
  validateId,
  validateCantidad,
} = require("../middlewares/validation.middleware");

const router = express.Router();

// Middleware opcional para autenticación (permite invitados con sesionId)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    return verifyJWT(req, res, next);
  }
  next();
};

// Rutas del carrito
router.get("/", optionalAuth, getCarrito); // 🌍/🔒 Autenticado o sesión
router.post("/agregar", optionalAuth, validateCarritoItem, agregarItem); // 🌍/🔒 Autenticado o sesión
router.put("/actualizar/:id", optionalAuth, validateId, validateCantidad, actualizarItem); // 🌍/🔒 Autenticado o sesión
router.delete("/eliminar/:id", optionalAuth, validateId, eliminarItem); // 🌍/🔒 Autenticado o sesión
router.delete("/vaciar", optionalAuth, vaciarCarrito); // 🌍/🔒 Autenticado o sesión

module.exports = router;
