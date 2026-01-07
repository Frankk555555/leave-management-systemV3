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
      comment: "วันลาพักผ่อนรวม (สะสม + ปีปัจจุบัน) - ใช้สำหรับแสดงผล",
    },
    vacationAccrued: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "vacation_accrued",
      comment: "วันลาพักผ่อนสะสมจากปีก่อน",
    },
    vacationCurrentYear: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      field: "vacation_current_year",
      comment: "วันลาพักผ่อนปีปัจจุบัน (10 วัน)",
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
