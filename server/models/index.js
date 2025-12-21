// ============================================
// Model Associations (Sequelize)
// Define all relationships between models
// ============================================

const User = require("./User");
const Department = require("./Department");
const LeaveBalance = require("./LeaveBalance");
const LeaveRequest = require("./LeaveRequest");
const LeaveAttachment = require("./LeaveAttachment");
const Holiday = require("./Holiday");
const LeaveType = require("./LeaveType");
const Notification = require("./Notification");

// ========================================
// User Associations
// ========================================
// User belongs to Department
User.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

Department.hasMany(User, {
  foreignKey: "departmentId",
  as: "employees",
});

// User has one LeaveBalance
User.hasOne(LeaveBalance, {
  foreignKey: "userId",
  as: "leaveBalance",
});

LeaveBalance.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Self-referential: User has supervisor (also a User)
User.belongsTo(User, {
  foreignKey: "supervisorId",
  as: "supervisor",
});

User.hasMany(User, {
  foreignKey: "supervisorId",
  as: "subordinates",
});

// ========================================
// LeaveRequest Associations
// ========================================
// LeaveRequest belongs to User
LeaveRequest.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(LeaveRequest, {
  foreignKey: "userId",
  as: "leaveRequests",
});

// LeaveRequest belongs to Approver (User)
LeaveRequest.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
});

User.hasMany(LeaveRequest, {
  foreignKey: "approvedBy",
  as: "approvedRequests",
});

// LeaveRequest has many Attachments
LeaveRequest.hasMany(LeaveAttachment, {
  foreignKey: "leaveRequestId",
  as: "attachments",
});

LeaveAttachment.belongsTo(LeaveRequest, {
  foreignKey: "leaveRequestId",
  as: "leaveRequest",
});

// ========================================
// Notification Associations
// ========================================
// Notification belongs to User
Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
});

// Notification belongs to LeaveRequest (optional)
Notification.belongsTo(LeaveRequest, {
  foreignKey: "relatedLeaveId",
  as: "relatedLeave",
});

LeaveRequest.hasMany(Notification, {
  foreignKey: "relatedLeaveId",
  as: "notifications",
});

module.exports = {
  User,
  Department,
  LeaveBalance,
  LeaveRequest,
  LeaveAttachment,
  Holiday,
  LeaveType,
  Notification,
};
