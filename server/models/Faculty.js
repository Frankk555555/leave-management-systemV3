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
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("faculty", "office", "institute"),
      defaultValue: "faculty",
      comment: "faculty=คณะ, office=สำนัก, institute=สถาบัน",
    },
  },
  {
    tableName: "faculties",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Faculty;
