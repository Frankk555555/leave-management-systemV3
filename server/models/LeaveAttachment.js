// ============================================
// LeaveAttachment Model (Sequelize)
// ============================================

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LeaveAttachment = sequelize.define(
  "LeaveAttachment",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    leaveRequestId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "leave_request_id",
    },
    fileName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "file_name",
    },
    originalName: {
      type: DataTypes.STRING(150),
      field: "original_name",
      comment: "ชื่อไฟล์ต้นฉบับ (ภาษาไทย)",
    },
    filePath: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "file_path",
    },
    fileType: {
      type: DataTypes.STRING(50),
      field: "file_type",
    },
    fileSize: {
      type: DataTypes.INTEGER.UNSIGNED,
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
