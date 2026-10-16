"use strict";

const traduccionesEspanol = {
  AT: "Todo Terreno",
  XT: "Terreno Extremo",
  HP: "Alto Rendimiento",
  HT: "Carretera / Pavimento",
  MT: "Terreno Lodoso / Fango",
  RT: "Terreno Escabroso / Rugoso",
  ST: "Remolque Especial",
};

const traduccionesIngles = {
  AT: "All Terrain",
  XT: "Extreme Terrain",
  HP: "High Performance",
  HT: "Highway Terrain",
  MT: "Mud Terrain",
  RT: "Rough Terrain / Rugged Terrain",
  ST: "Special Trailer",
};

const tablaExiste = async (queryInterface, tabla) => {
  const [rows] = await queryInterface.sequelize.query(
    "SELECT to_regclass(:nombre) AS reg",
    { replacements: { nombre: `public.${tabla}` } }
  );
  return Boolean(rows[0] && rows[0].reg);
};

module.exports = {
  async up(queryInterface) {
    if (!(await tablaExiste(queryInterface, "tipos_uso"))) return;

    for (const [codigo, descripcion] of Object.entries(traduccionesEspanol)) {
      await queryInterface.sequelize.query(
        "UPDATE tipos_uso SET descripcion = :descripcion WHERE codigo = :codigo",
        { replacements: { codigo, descripcion } }
      );
    }
  },

  async down(queryInterface) {
    if (!(await tablaExiste(queryInterface, "tipos_uso"))) return;

    for (const [codigo, descripcion] of Object.entries(traduccionesIngles)) {
      await queryInterface.sequelize.query(
        "UPDATE tipos_uso SET descripcion = :descripcion WHERE codigo = :codigo",
        { replacements: { codigo, descripcion } }
      );
    }
  },
};
