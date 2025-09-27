const { DataTypes } = require("sequelize");
const cockroach = require("../config/sequelize");

const Lands = cockroach.define(
  "lands",
  {
    land_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    land_area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
    },
    polygon_coordinates: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    polygon_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "lands",
  }
);

module.exports = Lands;
