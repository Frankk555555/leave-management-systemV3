const { User } = require("../models");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const resetPassword = async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findByPk(6);
    if (user) {
      user.password = "123456"; // Will be hashed by hook
      await user.save();
      console.log("Password reset for User 6");
    } else {
      console.log("User 6 not found");
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetPassword();
