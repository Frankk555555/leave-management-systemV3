const { LeaveRequest } = require("../models");
const { sequelize } = require("../config/database");

const checkLeaves = async () => {
  try {
    await sequelize.authenticate();
    const leaves = await LeaveRequest.findAll();
    console.table(
      leaves.map((l) => ({
        id: l.id,
        userId: l.userId,
        type: l.leaveType,
        status: l.status,
      }))
    );
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkLeaves();
