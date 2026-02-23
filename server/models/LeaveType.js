// ============================================
// LeaveType Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LeaveType = sequelize.define(
  "LeaveType",
  {
    id: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
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
      type: DataTypes.STRING(200),
    },
    defaultDays: {
      type: DataTypes.SMALLINT.UNSIGNED,
      field: "default_days",
    },
    requiresMedicalCert: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "requires_medical_cert",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "leave_types",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LeaveType;
