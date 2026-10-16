"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TipoUso extends Model {
    static associate(models) {
      // Tipo de uso de un modelo (ej: AT = Todo Terreno, MT = Terreno Lodoso / Fango)
      this.hasMany(models.Modelo, {
        foreignKey: "idTipoUso",
        as: "modelos",
      });
    }
  }

  TipoUso.init(
    {
      idTipoUso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "id_tipo_uso",
      },
      codigo: {
        type: DataTypes.STRING(5),
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "TipoUso",
      tableName: "tipos_uso",
      timestamps: true,
      underscored: true,
    }
  );

  return TipoUso;
};
