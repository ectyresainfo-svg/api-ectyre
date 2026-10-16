const { Cliente, Direccion } = require("../models");
const {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} = require("../utils/customErrors");
const jwt = require("jsonwebtoken");

class ClienteService {
  // Registrar cliente
  async registrarCliente(data) {
    // Verificar si el email ya existe
    const existeEmail = await Cliente.findOne({ where: { email: data.email } });
    if (existeEmail) {
      throw new ConflictError("El email ya está registrado");
    }

    // Verificar si la identificación ya existe
    const existeIdentificacion = await Cliente.findOne({
      where: { numeroIdentificacion: data.numeroIdentificacion },
    });
    if (existeIdentificacion) {
      throw new ConflictError("La identificación ya está registrada");
    }

    // Crear cliente (el hook beforeCreate encriptará la contraseña)
    // 🔒 Whitelist explícito: nunca pasar el body completo a Cliente.create,
    // o cualquiera podría registrarse con role: "admin" (o activo, googleId…)
    const cliente = await Cliente.create({
      tipoIdentificacion: data.tipoIdentificacion,
      numeroIdentificacion: data.numeroIdentificacion,
      nombres: data.nombres,
      apellidos: data.apellidos,
      email: data.email,
      telefono: data.telefono,
      passwordHash: data.password,
      role: "cliente",
      activo: true,
    });

    // Generar token JWT igual que en login (auto-login al registrarse)
    const token = jwt.sign(
      {
        idCliente: cliente.idCliente,
        email: cliente.email,
        nombres: cliente.nombres,
        role: cliente.role,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // No devolver el password
    const clienteData = cliente.toJSON();
    delete clienteData.passwordHash;

    return { cliente: clienteData, token };
  }

  // Login
  async loginCliente(email, password) {
    const cliente = await Cliente.findOne({ where: { email, activo: true } });

    if (!cliente) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    // Comparar contraseña
    const passwordValido = await cliente.comparePassword(password);
    if (!passwordValido) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        idCliente: cliente.idCliente,
        email: cliente.email,
        nombres: cliente.nombres,
        role: cliente.role,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    const clienteData = cliente.toJSON();
    delete clienteData.passwordHash;

    return {
      cliente: clienteData,
      token,
    };
  }

  // Obtener perfil
  async getClientePerfil(idCliente) {
    const cliente = await Cliente.findByPk(idCliente, {
      include: [
        {
          model: Direccion,
          as: "direcciones",
        },
      ],
      attributes: { exclude: ["passwordHash"] },
    });

    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado");
    }

    return cliente;
  }

  // Actualizar perfil
  // 🔒 Whitelist explícito: solo los campos que ProfilePage.jsx permite editar.
  // Nunca aceptar el body completo — de lo contrario cualquier cliente podría
  // enviar { role: "admin" }, { activo: true } o cambiar su email/password sin verificación.
  async updateClientePerfil(idCliente, data) {
    const cliente = await Cliente.findByPk(idCliente);

    if (!cliente) {
      throw new NotFoundError("Cliente no encontrado");
    }

    const cambios = {};
    if (data.nombres !== undefined) cambios.nombres = data.nombres;
    if (data.apellidos !== undefined) cambios.apellidos = data.apellidos;
    if (data.telefono !== undefined) cambios.telefono = data.telefono;

    await cliente.update(cambios);

    const clienteData = cliente.toJSON();
    delete clienteData.passwordHash;

    return clienteData;
  }
}

module.exports = new ClienteService();
