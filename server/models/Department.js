// ============================================
// Department Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Department = sequelize.define(
  "Department",
  {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    facultyId: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: true,
      field: "faculty_id",
      comment: "FK to faculties table",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "departments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Department;
