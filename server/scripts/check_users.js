const { User } = require("../models");
const { sequelize } = require("../config/database");

const checkUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    const users = await User.findAll({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "role",
        "supervisorId",
        "email",
      ],
    });

    console.log("Users found:", users.length);
    console.table(
      users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        supervisorId: u.supervisorId,
      }))
    );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkUsers();
