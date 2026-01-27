const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { sequelize } = require("../config/database");
const fs = require("fs");

async function runMigration() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connected to database.");

    const sqlPath = path.join(
      __dirname,
      "../database/restore_unit_affiliation.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Running migration...");
    const statements = sql.split(";").filter((stmt) => stmt.trim() !== "");

    for (const statement of statements) {
      if (statement.trim()) {
        await sequelize.query(statement);
        console.log("Executed statement.");
      }
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
