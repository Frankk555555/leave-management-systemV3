// ============================================
// Faculty Model (Sequelize)
// คณะ/สำนัก/สถาบัน
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Faculty = sequelize.define(
  "Faculty",
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("faculty", "office", "institute"),
      defaultValue: "faculty",
      comment: "faculty=คณะ, office=สำนัก, institute=สถาบัน",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "faculties",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Faculty;
