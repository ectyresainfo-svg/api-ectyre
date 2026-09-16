"use strict";

const { MediaItem } = require("../models");
const { deleteImage } = require("../config/cloudinary");
const { Op } = require("sequelize");

class MediaService {
  async getAll({ search = "" } = {}) {
    const where = {};
    if (search && search.trim()) {
      where.nombre = { [Op.iLike]: `%${search.trim()}%` };
    }
    try {
      return await MediaItem.findAll({
        where,
        order: [["createdAt", "DESC"]],
      });
    } catch (err) {
      console.warn("MediaItem table error, attempting sync:", err.message);
      try {
        await MediaItem.sync();
        return await MediaItem.findAll({
          where,
          order: [["createdAt", "DESC"]],
        });
      } catch (syncErr) {
        console.error("Failed to sync MediaItem table:", syncErr.message);
        return [];
      }
    }
  }

  async getById(id) {
    const item = await MediaItem.findByPk(id);
    if (!item) {
      const error = new Error("Elemento multimedia no encontrado");
      error.status = 404;
      throw error;
    }
    return item;
  }

  async createFromUpload(file, { nombre, seccion = "GENERAL" } = {}) {
    if (!file) {
      throw new Error("No se envió ningún archivo");
    }

    // Calcular formato
    const formato = file.mimetype ? file.mimetype.split("/")[1] : "png";
    const displayName = (nombre && nombre.trim()) || file.originalname || `media-${Date.now()}`;

    // Multer-storage-cloudinary coloca la URL en file.path y public_id en file.filename
    const media = await MediaItem.create({
      nombre: displayName,
      urlImagen: file.path,
      publicId: file.filename,
      bytes: file.size || null,
      formato: formato.toUpperCase(),
      dimensiones: file.width && file.height ? `${file.width}×${file.height}` : null,
      seccion,
      activo: true,
    });

    return media;
  }

  async delete(id) {
    const item = await this.getById(id);

    // Borrar de Cloudinary si tiene publicId
    if (item.publicId) {
      try {
        await deleteImage(item.publicId);
      } catch (cloudErr) {
        console.warn("Advertencia: No se pudo eliminar de Cloudinary:", cloudErr.message);
      }
    }

    await item.destroy();
    return { success: true, message: "Imagen eliminada correctamente de Cloudinary y la base de datos" };
  }
}

module.exports = new MediaService();
