"use strict";

const {
  uploadLlanta,
  uploadMarca,
  uploadProducto,
  uploadEspecificacion,
  uploadMediaSingle: mediaSingle,
  uploadMediaMultiple: mediaMultiple,
} = require("../config/cloudinary");
const { MAX_IMAGENES_PRODUCTO } = require("../utils/productoConstantes");

// Traduce los errores de multer a mensajes claros para el admin
const mensajeErrorMulter = (err, mensajePorDefecto) => {
  // Cloudinary rechaza con un objeto plano { message, http_code }, no con un Error
  if (err.http_code) {
    return `Cloudinary rechazó la imagen (${err.http_code}): ${err.message}`;
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE" && err.field === "imagenes") {
    return `Máximo ${MAX_IMAGENES_PRODUCTO} imágenes por producto`;
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return `Campo de archivo no permitido: ${err.field}`;
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return "La imagen supera el tamaño máximo permitido";
  }
  return err.message || mensajePorDefecto;
};

const manejarSubida = (middlewareMulter, mensajePorDefecto) => (req, res, next) => {
  middlewareMulter(req, res, (err) => {
    if (err) {
      // Sin esto Vercel solo registra "[object Object]" y el motivo real se pierde
      console.error(`[Upload] ${req.method} ${req.originalUrl}:`, err.message || JSON.stringify(err), err.http_code || err.code || "");
      return res.status(err.http_code >= 500 ? 502 : 400).json({
        success: false,
        message: mensajeErrorMulter(err, mensajePorDefecto),
      });
    }
    next();
  });
};

/**
 * Fotos del producto (field "imagenes", máx 5).
 * Si llega una sexta imagen, multer aborta la petición y elimina las ya subidas.
 * Ej: POST /api/v1/admin/productos (multipart: datos + imagenes[])
 */
const uploadImagenesProducto = manejarSubida(
  uploadProducto.array("imagenes", MAX_IMAGENES_PRODUCTO),
  "Error al subir las imágenes"
);

/**
 * UNA foto de producto (field "imagen") — endpoint individual de imágenes
 */
const uploadImagenProducto = manejarSubida(uploadProducto.single("imagen"), "Error al subir la imagen");

/**
 * Logo y banner de marca (fields "logo" y "banner")
 */
const uploadImagenesMarca = manejarSubida(
  uploadMarca.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  "Error al subir las imágenes de la marca"
);

/**
 * Ícono de especificación técnica (field "icono")
 */
const uploadIconoEspecificacion = manejarSubida(uploadEspecificacion.single("icono"), "Error al subir el ícono");

/**
 * Media general: 1 imagen (field "file") o hasta 10 (field "files") — usado por /admin/media
 */
const uploadMediaSingle = manejarSubida(mediaSingle, "Error al subir la imagen");
const uploadMediaMultiple = manejarSubida(mediaMultiple, "Error al subir las imágenes");

/**
 * Imagen de promoción / banner (field "imagen") — usado por /admin/promociones
 */
const uploadImagenPromocion = manejarSubida(uploadLlanta.single("imagen"), "Error al subir la imagen");

module.exports = {
  MAX_IMAGENES_PRODUCTO,
  uploadImagenesProducto,
  uploadImagenProducto,
  uploadImagenesMarca,
  uploadIconoEspecificacion,
  uploadImagenPromocion,
  uploadMediaSingle,
  uploadMediaMultiple,
};
