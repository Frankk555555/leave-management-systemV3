// ============================================
// LeaveAttachment Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LeaveAttachment = sequelize.define(
  "LeaveAttachment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    leaveRequestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "leave_request_id",
    },
    fileName: {
      type: DataTypes.STRING(255),
      field: "file_name",
    },
    filePath: {
      type: DataTypes.STRING(500),
      field: "file_path",
    },
    fileType: {
      type: DataTypes.STRING(50),
      field: "file_type",
    },
    fileSize: {
      type: DataTypes.INTEGER,
      field: "file_size",
    },
  },
  {
    tableName: "leave_attachments",
    timestamps: true,
    underscored: true,
    updatedAt: false, // Only createdAt, no updatedAt for attachments
  }
);

module.exports = LeaveAttachment;
