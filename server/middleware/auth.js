const jwt = require("jsonwebtoken");
const { User, LeaveBalance, Department } = require("../models");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user with associations using Sequelize
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: LeaveBalance,
            as: "leaveBalance",
          },
          {
            model: Department,
            as: "department",
          },
        ],
      });

      if (!req.user) {
        return res.status(401).json({ message: "ไม่พบผู้ใช้ในระบบ" });
      }

      return next();
    } catch (error) {
      console.error("Auth error:", error.message);
      return res.status(401).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อน" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

const supervisor = (req, res, next) => {
  if (req.user && (req.user.role === "head" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as supervisor" });
  }
};

module.exports = { protect, admin, supervisor };
