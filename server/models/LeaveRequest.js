// ============================================
// LeaveRequest Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LeaveRequest = sequelize.define(
  "LeaveRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    leaveType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "leave_type",
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
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "end_date",
    },
    totalDays: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "total_days",
    },
    timeSlot: {
      type: DataTypes.ENUM("full", "morning", "afternoon"),
      defaultValue: "full",
      field: "time_slot",
    },
    reason: {
      type: DataTypes.TEXT,
    },
    contactAddress: {
      type: DataTypes.TEXT,
      field: "contact_address",
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      field: "contact_phone",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      field: "approved_by",
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: "approved_at",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: "rejection_reason",
    },
  },
  {
    tableName: "leave_requests",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LeaveRequest;
