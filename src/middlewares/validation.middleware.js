const { body, param, validationResult } = require("express-validator");

/**
 * Middleware genérico para validar resultados de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

// Las validaciones de productos (reglas de negocio) viven en services/producto.services.js
// porque dependen de la BD (tipo, marca, modelo, especificaciones por tipo…).

/**
 * Validaciones para Cliente (Registro)
 */
const validateClienteData = [
  body("tipoIdentificacion")
    .notEmpty()
    .withMessage("Tipo de identificación requerido")
    .isIn(["CEDULA", "RUC", "PASAPORTE"])
    .withMessage("Tipo de identificación inválido"),
  body("numeroIdentificacion")
    .notEmpty()
    .withMessage("Número de identificación requerido")
    .isLength({ min: 5, max: 20 })
    .withMessage("Número de identificación inválido"),
  body("nombres")
    .notEmpty()
    .withMessage("Los nombres son requeridos")
    .isLength({ min: 2, max: 100 })
    .withMessage("Nombres deben tener entre 2 y 100 caracteres"),
  body("apellidos")
    .notEmpty()
    .withMessage("Los apellidos son requeridos")
    .isLength({ min: 2, max: 100 })
    .withMessage("Apellidos deben tener entre 2 y 100 caracteres"),
  body("email")
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),
  body("telefono")
    .notEmpty()
    .withMessage("El teléfono es requerido")
    .isLength({ min: 7, max: 15 })
    .withMessage("Teléfono inválido"),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 6 })
    .withMessage("Contraseña debe tener al menos 6 caracteres"),
  validate,
];

/**
 * Validaciones para Login
 */
const validateLoginData = [
  body("email")
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
  validate,
];

/**
 * Validaciones para Pedido
 */
const validatePedidoData = [
  body("idDireccionEntrega")
    .notEmpty()
    .withMessage("La dirección de entrega es requerida")
    .isInt()
    .withMessage("ID de dirección inválido"),
  body("idMetodoPago")
    .notEmpty()
    .withMessage("El método de pago es requerido")
    .isInt()
    .withMessage("ID de método de pago inválido"),
  body("requiereInstalacion")
    .optional()
    .isBoolean()
    .withMessage("Requiere instalación debe ser true o false"),
  validate,
];

/**
 * Validaciones para agregar al carrito
 */
const validateCarritoItem = [
  body("idProducto")
    .notEmpty()
    .withMessage("El ID de producto es requerido")
    .isInt()
    .withMessage("ID de producto inválido"),
  body("cantidad")
    .notEmpty()
    .withMessage("La cantidad es requerida")
    .isInt({ min: 1 })
    .withMessage("Cantidad debe ser mayor a 0"),
  validate,
];

/**
 * Validación de ID en parámetros
 */
const validateId = [param("id").isInt().withMessage("ID inválido"), validate];

/**
 * Validaciones para actualizar la cantidad de un item del carrito
 */
const validateCantidad = [
  body("cantidad")
    .notEmpty()
    .withMessage("La cantidad es requerida")
    .isInt({ min: 1 })
    .withMessage("Cantidad debe ser un número entero mayor a 0"),
  validate,
];

/**
 * Validaciones para Dirección
 */
const validateDireccionData = [
  body("provincia")
    .notEmpty()
    .withMessage("La provincia es requerida")
    .isLength({ min: 2, max: 100 })
    .withMessage("Provincia debe tener entre 2 y 100 caracteres"),
  body("ciudad")
    .notEmpty()
    .withMessage("La ciudad es requerida")
    .isLength({ min: 2, max: 100 })
    .withMessage("Ciudad debe tener entre 2 y 100 caracteres"),
  body("direccionCompleta")
    .notEmpty()
    .withMessage("La dirección completa es requerida")
    .isLength({ min: 5 })
    .withMessage("Dirección debe tener al menos 5 caracteres"),
  body("referencia")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Referencia demasiado larga"),
  body("esPrincipal")
    .optional()
    .isBoolean()
    .withMessage("esPrincipal debe ser true o false"),
  validate,
];

/**
 * Validaciones para Catálogos (código genérico o descripcion)
 */
const validateCatalogo = [
  body("codigo")
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage("Código debe tener entre 1 y 10 caracteres"),
  body("descripcion")
    .optional()
    .isLength({ min: 1, max: 150 })
    .withMessage("Descripción debe tener entre 1 y 150 caracteres"),
  body("nombre")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Nombre debe tener entre 1 y 100 caracteres"),
  validate,
];

/**
 * Validaciones para Compatibilidad
 */
const validateCompatibilidad = [
  body("idProducto").notEmpty().isInt().withMessage("ID de producto inválido"),
  body("idModelo").notEmpty().isInt().withMessage("ID de modelo de vehículo inválido"),
  body("anioDesde").notEmpty().isInt().withMessage("Año desde inválido"),
  body("anioHasta").optional({ nullable: true }).isInt().withMessage("Año hasta inválido"),
  body("esOriginal").optional().isBoolean().withMessage("Debe ser booleano"),
  validate,
];

module.exports = {
  validate,
  validateClienteData,
  validateLoginData,
  validatePedidoData,
  validateCarritoItem,
  validateId,
  validateCantidad,
  validateDireccionData,
  validateCatalogo,
  validateCompatibilidad,
};
