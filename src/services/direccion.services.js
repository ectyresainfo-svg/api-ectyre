const { Direccion } = require("../models");

class DireccionService {
  // Obtener todas las direcciones de un cliente
  async getDirecciones(idCliente) {
    try {
      const direcciones = await Direccion.findAll({
        where: { idCliente },
        order: [
          ["esPrincipal", "DESC"],
          ["createdAt", "ASC"],
        ],
      });
      return direcciones;
    } catch (error) {
      throw new Error(`Error al obtener direcciones: ${error.message}`);
    }
  }

  // Obtener una dirección por ID (verificando que pertenezca al cliente)
  async getDireccionById(id, idCliente) {
    try {
      const direccion = await Direccion.findOne({
        where: { idDireccion: id, idCliente },
      });
      if (!direccion) {
        throw new Error("Dirección no encontrada");
      }
      return direccion;
    } catch (error) {
      throw new Error(`Error al obtener dirección: ${error.message}`);
    }
  }

  // Crear una nueva dirección
  async createDireccion(idCliente, data) {
    try {
      const { provincia, ciudad, direccionCompleta, referencia, esPrincipal } =
        data;

      // Si esta dirección será la principal, desmarcar las demás
      if (esPrincipal) {
        await Direccion.update(
          { esPrincipal: false },
          { where: { idCliente } }
        );
      }

      const nuevaDireccion = await Direccion.create({
        idCliente,
        provincia,
        ciudad,
        direccionCompleta,
        referencia,
        esPrincipal: esPrincipal || false,
      });

      return nuevaDireccion;
    } catch (error) {
      throw new Error(`Error al crear dirección: ${error.message}`);
    }
  }

  // Actualizar una dirección (solo si pertenece al cliente)
  // 🔒 Whitelist explícito: `data` nunca se pasa completo a `.update()`, o un
  // cliente podría enviar { idCliente: X } y mover la dirección a otra cuenta.
  async updateDireccion(id, idCliente, data) {
    try {
      const direccion = await Direccion.findOne({
        where: { idDireccion: id, idCliente },
      });

      if (!direccion) {
        throw new Error("Dirección no encontrada");
      }

      // Si se marca como principal, desmarcar las demás
      if (data.esPrincipal) {
        await Direccion.update(
          { esPrincipal: false },
          { where: { idCliente } }
        );
      }

      const cambios = {};
      if (data.provincia !== undefined) cambios.provincia = data.provincia;
      if (data.ciudad !== undefined) cambios.ciudad = data.ciudad;
      if (data.direccionCompleta !== undefined) cambios.direccionCompleta = data.direccionCompleta;
      if (data.referencia !== undefined) cambios.referencia = data.referencia;
      if (data.esPrincipal !== undefined) cambios.esPrincipal = data.esPrincipal;

      await direccion.update(cambios);

      const actualizada = await Direccion.findByPk(id);
      return actualizada;
    } catch (error) {
      throw new Error(`Error al actualizar dirección: ${error.message}`);
    }
  }

  // Eliminar una dirección (solo si pertenece al cliente)
  async deleteDireccion(id, idCliente) {
    try {
      const direccion = await Direccion.findOne({
        where: { idDireccion: id, idCliente },
      });

      if (!direccion) {
        throw new Error("Dirección no encontrada");
      }

      await direccion.destroy();
      return { id, message: "Dirección eliminada correctamente" };
    } catch (error) {
      throw new Error(`Error al eliminar dirección: ${error.message}`);
    }
  }
}

module.exports = new DireccionService();
