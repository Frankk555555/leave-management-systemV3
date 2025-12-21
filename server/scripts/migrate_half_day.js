const { Sequelize } = require("sequelize");
const { sequelize } = require("../config/database");

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    const queryInterface = sequelize.getQueryInterface();

    // 1. Modify total_days column to FLOAT
    console.log("Modifying total_days to FLOAT...");
    await sequelize.query(
      "ALTER TABLE leave_requests MODIFY COLUMN total_days FLOAT NOT NULL;"
    );

    // 2. Add time_slot column
    console.log("Adding time_slot column...");
    try {
      await sequelize.query(
        "ALTER TABLE leave_requests ADD COLUMN time_slot ENUM('full', 'morning', 'afternoon') DEFAULT 'full' AFTER total_days;"
      );
    } catch (error) {
      if (error.original && error.original.code === "ER_DUP_FIELDNAME") {
        console.log("Column time_slot already exists, skipping...");
      } else {
        throw error;
      }
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
