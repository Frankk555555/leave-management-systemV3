const { User, LeaveRequest, Department } = require("../models");
const { sequelize } = require("../config/database");
const { Op } = require("sequelize");

const debugApproval = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    // Simulate User 6 (Head)
    const userId = 6;
    const user = await User.findByPk(userId);
    console.log(`User: ${user.firstName} ${user.lastName}, Role: ${user.role}`);

    let where = { status: "pending" };

    if (user.role === "head") {
      console.log("User is Head. Finding subordinates...");
      const subordinates = await User.findAll({
        where: { supervisorId: userId },
        attributes: ["id"],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      console.log("Subordinate IDs:", subordinateIds);

      where.userId = { [Op.in]: subordinateIds };
    }

    console.log("Query Where:", JSON.stringify(where, null, 2)); // fix: avoid circular structure

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName"],
        },
      ],
    });

    console.log("Found Requests:", leaveRequests.length);
    leaveRequests.forEach((r) => {
      console.log(`- Request ${r.id} by ${r.user.firstName} (${r.leaveType})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

debugApproval();
