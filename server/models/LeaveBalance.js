// ============================================
// LeaveBalance Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LeaveBalance = sequelize.define(
  "LeaveBalance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "user_id",
    },
    sick: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
    },
    personal: {
      type: DataTypes.INTEGER,
      defaultValue: 45,
    },
    vacation: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    maternity: {
      type: DataTypes.INTEGER,
      defaultValue: 90,
    },
    paternity: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    childcare: {
      type: DataTypes.INTEGER,
      defaultValue: 150,
    },
    ordination: {
      type: DataTypes.INTEGER,
      defaultValue: 120,
    },
    military: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
    },
  },
  {
    tableName: "leave_balances",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LeaveBalance;
