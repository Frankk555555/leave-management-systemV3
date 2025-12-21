const User = require("./models/User");
const { sequelize } = require("./config/database");

async function testCreateUser() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    const payload = {
      employeeId: "TEST003",
      firstName: "Test",
      lastName: "User",
      email: "test" + Date.now() + "@example.com",
      password: "password123",
      departmentId: "", // Simulating empty string from frontend
      position: "Tester",
      role: "employee",
      supervisorId: "", // Simulating empty string
    };

    console.log("Attempting to create user with payload:", payload);

    // Manual simulation of controller logic
    const { departmentId, supervisorId } = payload;
    const safeDepartmentId = departmentId === "" ? null : departmentId;
    const safeSupervisorId = supervisorId === "" ? null : supervisorId;

    const user = await User.create({
      ...payload,
      departmentId: safeDepartmentId,
      supervisorId: safeSupervisorId,
    });
    console.log("User created:", user.id);
  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await sequelize.close();
  }
}

testCreateUser();
