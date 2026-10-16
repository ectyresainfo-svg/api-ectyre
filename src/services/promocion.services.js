"use strict";

const { ImagenPromocion } = require("../models");
const { NotFoundError } = require("../utils/customErrors");
const { deleteImage } = require("../config/cloudinary");

class PromocionService {
  async getAll() {
    return ImagenPromocion.findAll({ order: [["createdAt", "DESC"]] });
  }

  // 🌍 Catálogo público (tienda): solo promociones activas
  async getAllPublicas() {
    return ImagenPromocion.findAll({ where: { activo: true }, order: [["createdAt", "DESC"]] });
  }

  async getById(id) {
    const item = await ImagenPromocion.findByPk(id);
    if (!item) throw new NotFoundError("Imagen de promoción no encontrada");
    return item;
  }

  // 🌍 Detalle público: nunca expone promociones desactivadas
  async getByIdPublico(id) {
    const item = await ImagenPromocion.findOne({ where: { idImagenPromocion: id, activo: true } });
    if (!item) throw new NotFoundError("Imagen de promoción no encontrada");
    return item;
  }

  async create({ urlImagen, nombre }) {
    return ImagenPromocion.create({ urlImagen, nombre });
  }

  async update(id, data) {
    const item = await this.getById(id);
    await item.update(data);
    return item;
  }

  async delete(id) {
    const item = await this.getById(id);
    await item.destroy();
    return { message: "Imagen de promoción eliminada correctamente" };
  }

  async toggleActivo(id) {
    const item = await this.getById(id);
    await item.update({ activo: !item.activo });
    return item;
  }
}

module.exports = new PromocionService();
