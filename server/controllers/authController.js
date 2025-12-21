const jwt = require("jsonwebtoken");
const { User, LeaveBalance, LeaveType, Department } = require("../models");
const { Op } = require("sequelize");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      password,
      departmentId,
      position,
      role,
      supervisorId,
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { employeeId }],
      },
    });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      employeeId,
      firstName,
      lastName,
      email,
      password, // Will be hashed by beforeCreate hook
      departmentId,
      position,
      role: role || "employee",
      supervisorId: supervisorId || null,
    });

    // Create leave balance for user
    await LeaveBalance.create({
      userId: user.id,
      sick: 60,
      personal: 45,
      vacation: 10,
      maternity: 90,
      paternity: 15,
      childcare: 150,
      ordination: 120,
      military: 60,
    });

    // Fetch user with associations
    const userWithBalance = await User.findByPk(user.id, {
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

    res.status(201).json({
      id: user.id,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: userWithBalance.department,
      position: user.position,
      role: user.role,
      leaveBalance: userWithBalance.leaveBalance,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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
      return res.status(401).json({ message: "Invalid email or password" });
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
      res.status(401).json({ message: "Invalid email or password" });
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
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { register, login, getMe };
