// ============================================
// LeaveType Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LeaveType = sequelize.define(
  "LeaveType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      validate: {
        isIn: [
          [
            "sick",
            "personal",
            "vacation",
            "maternity",
            "paternity",
            "childcare",
            "ordination",
            "military",
          ],
        ],
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    defaultDays: {
      type: DataTypes.INTEGER,
      field: "default_days",
    },
    requiresMedicalCert: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "requires_medical_cert",
    },
  },
  {
    tableName: "leave_types",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LeaveType;
