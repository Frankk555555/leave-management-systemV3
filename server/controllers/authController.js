const jwt = require("jsonwebtoken");
const { User, LeaveBalance, LeaveType, Department } = require("../models");
const { Op } = require("sequelize");

// Generate JWT - Reduced expiry for better security
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Reduced from 30d for security
  });
};

// Note: User registration is handled by admin only via userController.createUser
// See routes/users.js and controllers/userController.js

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user with associations
    const user = await User.findOne({
      where: { email },
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

    if (!user) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (isPasswordValid) {
      res.json({
        id: user.id,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role,
        leaveBalance: user.leaveBalance,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: User,
          as: "supervisor",
          attributes: ["id", "firstName", "lastName", "email"],
        },
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

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { login, getMe };
