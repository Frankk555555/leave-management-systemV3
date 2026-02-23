// ============================================
// LeaveBalance Model (Sequelize) - V2 Normalized
// ============================================
// เปลี่ยนจาก 1 แถว = 1 user (หลาย column)
// เป็น 1 แถว = 1 user + 1 leave_type + 1 year
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LeaveBalance = sequelize.define(
  "LeaveBalance",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "user_id",
    },
    leaveTypeId: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      field: "leave_type_id",
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ปีงบประมาณ (พ.ศ. หรือ ค.ศ.)",
    },
    totalDays: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: false,
      defaultValue: 0,
      field: "total_days",
      comment: "จำนวนวันลาทั้งหมดที่ได้รับ",
    },
    usedDays: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: false,
      defaultValue: 0,
      field: "used_days",
      comment: "จำนวนวันลาที่ใช้ไปแล้ว",
    },
    carriedOverDays: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: false,
      defaultValue: 0,
      field: "carried_over_days",
      comment: "จำนวนวันลาสะสมจากปีก่อน",
    },
  },
  {
    tableName: "leave_balances",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "leave_type_id", "year"],
        name: "uk_user_type_year",
      },
    ],
  }
);

// Virtual field: คำนวณวันลาคงเหลือ
LeaveBalance.prototype.getRemainingDays = function () {
  return (
    parseFloat(this.totalDays) +
    parseFloat(this.carriedOverDays) -
    parseFloat(this.usedDays)
  );
};

module.exports = LeaveBalance;
