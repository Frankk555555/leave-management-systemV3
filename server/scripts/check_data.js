const { LeaveRequest, Notification } = require("../models");
const { sequelize } = require("../config/database");

const checkData = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    const leaves = await LeaveRequest.findAll();
    console.log("Leave Requests:", leaves.length);
    console.table(
      leaves.map((l) => ({
        id: l.id,
        userId: l.userId,
        type: l.leaveType,
        status: l.status,
      }))
    );

    const notifications = await Notification.findAll();
    console.log("Notifications:", notifications.length);
    console.table(
      notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        message: n.message,
      }))
    );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkData();
