const { User, LeaveBalance, Department } = require("../models");
const { Op } = require("sequelize");

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
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
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
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

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
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
      leaveBalance,
    } = req.body;

    // Handle empty strings for optional fields
    const safeDepartmentId = departmentId === "" ? null : departmentId;
    const safeSupervisorId = supervisorId === "" ? null : supervisorId;

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
      password, // Will be hashed by hook
      departmentId: safeDepartmentId,
      position,
      role: role || "employee",
      supervisorId: safeSupervisorId,
    });

    // Create leave balance
    await LeaveBalance.create({
      userId: user.id,
      sick: leaveBalance?.sick || 60,
      personal: leaveBalance?.personal || 45,
      vacation: leaveBalance?.vacation || 10,
      maternity: leaveBalance?.maternity || 90,
      paternity: leaveBalance?.paternity || 15,
      childcare: leaveBalance?.childcare || 150,
      ordination: leaveBalance?.ordination || 120,
      military: leaveBalance?.military || 60,
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
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: LeaveBalance,
          as: "leaveBalance",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      firstName,
      lastName,
      email,
      departmentId,
      position,
      role,
      supervisorId,
      leaveBalance,
    } = req.body;

    // Handle empty strings for optional fields
    const safeDepartmentId = departmentId === "" ? null : departmentId;
    const safeSupervisorId = supervisorId === "" ? null : supervisorId;

    // Update user fields
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      departmentId:
        safeDepartmentId !== undefined ? safeDepartmentId : user.departmentId,
      position: position || user.position,
      role: role || user.role,
      supervisorId:
        safeSupervisorId !== undefined ? safeSupervisorId : user.supervisorId,
    });

    // Update leave balance if provided
    if (leaveBalance && user.leaveBalance) {
      await user.leaveBalance.update(leaveBalance);
    }

    // Fetch updated user with associations
    const updatedUser = await User.findByPk(user.id, {
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

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get supervisors
// @route   GET /api/users/supervisors
// @access  Private
const getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.findAll({
      where: {
        role: {
          [Op.in]: ["head", "admin"],
        },
      },
      attributes: [
        "id",
        "employeeId",
        "firstName",
        "lastName",
        "email",
        "departmentId",
      ],
      include: [
        {
          model: Department,
          as: "department",
        },
      ],
    });
    res.json(supervisors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update own profile (for regular users)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const { firstName, lastName, email, phone, password } = req.body;

    // Update allowed fields only
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (password && password.trim() !== "") {
      user.password = password; // Will be hashed by beforeUpdate hook
    }

    await user.save();

    // Return user without password
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        { model: LeaveBalance, as: "leaveBalance" },
        { model: Department, as: "department" },
      ],
    });

    res.json({ message: "อัปเดตโปรไฟล์เรียบร้อยแล้ว", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update profile image
// @route   PUT /api/users/profile/image
// @access  Private
const updateProfileImage = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "กรุณาอัปโหลดรูปภาพ" });
    }

    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    res.json({
      message: "อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSupervisors,
  updateProfile,
  updateProfileImage,
};
