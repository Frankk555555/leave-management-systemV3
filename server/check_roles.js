const User = require("./models/User");
const { sequelize } = require("./config/database");

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    const users = await User.findAll({
      attributes: ["id", "firstName", "lastName", "role", "email"],
    });

    console.log("--- All Users ---");
    users.forEach((u) => {
      console.log(
        `ID: ${u.id}, Name: ${u.firstName} ${u.lastName}, Role: '${u.role}', Email: ${u.email}`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
