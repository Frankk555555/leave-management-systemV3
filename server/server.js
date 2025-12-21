const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { sequelize, testConnection } = require("./config/database");

// Connect to MySQL database
testConnection();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads with download headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Content-Disposition",
    });
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/leave-requests", require("./routes/leaveRequests"));
app.use("/api/leave-types", require("./routes/leaveTypes"));
app.use("/api/holidays", require("./routes/holidays"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/webhooks", require("./routes/webhooks"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/faculties", require("./routes/faculties"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "University Leave Management API is running",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
