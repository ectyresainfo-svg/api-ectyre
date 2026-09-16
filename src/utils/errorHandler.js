const errorHandler = (error, req, res, _next) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Asegurar cabeceras CORS en respuestas de error para evitar que el navegador las bloquee como Network Error
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // ─── Log interno (nunca exponer al cliente) ──────────────────────────
  if (!isProduction) {
    console.error("❌ [ErrorHandler]", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    // En producción solo loguear el nombre y el path (sin stack ni datos sensibles)
    console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${error.name}: ${error.message}`);
  }

  // ─── Errores de validación de Sequelize (campos inválidos) ───────────
  if (error.name === "SequelizeValidationError") {
    const errObj = {};
    error.errors.forEach((er) => {
      errObj[er.path] = er.message;
    });
    return res.status(400).json({
      success: false,
      message: "Error de validación en base de datos",
      errors: errObj,
    });
  }

  // ─── Violación de clave foránea ──────────────────────────────────────
  if (error.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "El recurso relacionado no existe",
      // Nunca exponer detail de DB en producción
      ...(isProduction ? {} : { detail: error.parent?.detail }),
    });
  }

  // ─── Violación de clave única (duplicados) ───────────────────────────
  if (error.name === "SequelizeUniqueConstraintError") {
    const campo = error.errors?.[0]?.path || "campo";
    return res.status(409).json({
      success: false,
      message: `Ya existe un registro con ese ${campo}`,
    });
  }

  // ─── Error genérico de base de datos ────────────────────────────────
  if (error.name === "SequelizeDatabaseError") {
    return res.status(400).json({
      success: false,
      // Nunca exponer el SQL ni detalles internos en producción
      message: isProduction ? "Error en la base de datos" : error.message,
    });
  }

  // ─── Error de conexión a DB ──────────────────────────────────────────
  if (error.name === "SequelizeConnectionError") {
    return res.status(503).json({
      success: false,
      message: "Servicio no disponible. Intente más tarde.",
    });
  }

  // ─── Error de CORS ────────────────────────────────────────────────────
  if (error.message && error.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado por política CORS",
    });
  }

  // ─── Errores del negocio lanzados manualmente con statusCode ─────────
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(Array.isArray(error.errors) && error.errors.length > 0 ? { errors: error.errors } : {}),
    });
  }

  // ─── JWT errors ──────────────────────────────────────────────────────
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
    });
  }

  // ─── Error genérico 500 ──────────────────────────────────────────────
  // En producción: NUNCA exponer stack traces, mensajes de DB, ni rutas internas
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    message: isProduction
      ? "Error interno del servidor"
      : error.message || "Error interno del servidor",
    // Stack solo en desarrollo, nunca en producción
    ...(isProduction ? {} : { stack: error.stack }),
  });
};

module.exports = errorHandler;