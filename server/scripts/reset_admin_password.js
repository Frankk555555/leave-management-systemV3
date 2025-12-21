const { User } = require("../models");
const { sequelize } = require("../config/database");

const resetAdminPassword = async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { role: "admin" } });
    if (user) {
      user.password = "123456";
      await user.save();
      console.log(`Password reset for Admin (${user.email})`);
    } else {
      console.log("Admin user not found");
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetAdminPassword();
