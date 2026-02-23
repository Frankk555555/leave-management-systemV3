const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");
const { User, LeaveBalance, LeaveType } = require("../models");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL");

    const user = await User.findOne({ where: { email: "admin@bru.ac.th" } });

    if (user) {
      // Reset password using hooks: false to avoid double-hashing
      const hash = await bcrypt.hash("admin123", 10);
      await user.update({ password: hash }, { hooks: false });
      console.log("Password reset OK for", user.email);
    } else {
      // Create admin user
      const admin = await User.create({
        employeeId: "ADMIN001",
        email: "admin@bru.ac.th",
        password: "admin123",
        firstName: "Admin",
        lastName: "System",
        position: "ผู้ดูแลระบบ",
        role: "admin",
      });

      // Create leave balances (V2: normalized, 1 row per leave type)
      const allLeaveTypes = await LeaveType.findAll({ where: { isActive: true } });
      const currentYear = new Date().getFullYear();

      await Promise.all(
        allLeaveTypes.map((lt) =>
          LeaveBalance.findOrCreate({
            where: { userId: admin.id, leaveTypeId: lt.id, year: currentYear },
            defaults: {
              totalDays: lt.defaultDays,
              usedDays: 0,
              carriedOverDays: 0,
            },
          })
        )
      );

      console.log("Admin user created:", admin.email);
    }

    console.log("Email: admin@bru.ac.th");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
