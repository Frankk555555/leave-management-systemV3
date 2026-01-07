const {
  LeaveRequest,
  User,
  LeaveBalance,
  LeaveAttachment,
  Department,
} = require("../models");
const { Op } = require("sequelize");
const {
  sendLeaveRequestEmail,
  sendApprovalEmail,
} = require("../services/emailService");
const {
  validateLeaveRequest,
  calculateWorkingDays,
  getFiscalYear,
} = require("../services/leaveValidationService");
const { Notification } = require("../models");

// @desc    Create leave request
// @route   POST /api/leave-requests
// @access  Private
const createLeaveRequest = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      contactAddress,
      contactPhone,
      childBirthDate,
      ceremonyDate,
      hasMedicalCertificate,
      isLongTermSick,
      timeSlot,
    } = req.body;

    // Validate leave request with business rules
    const validation = await validateLeaveRequest({
      userId: req.user.id,
      leaveType,
      startDate,
      endDate,
      childBirthDate,
      ceremonyDate,
      hasMedicalCertificate,
      isLongTermSick,
      timeSlot,
    });

    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Determine if paid leave
    const isPaidLeave = validation.isPaidLeave !== false;

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      userId: req.user.id,
      leaveType,
      startDate,
      endDate,
      totalDays: validation.totalDays,
      timeSlot: timeSlot || "full",
      reason,
      contactAddress,
      contactPhone,
      // Auto-approve for military leave
      status: validation.autoApprove ? "approved" : "pending",
      approvedBy: validation.autoApprove ? req.user.id : null,
      approvedAt: validation.autoApprove ? new Date() : null,
    });

    // Handle file uploads (create attachments)
    if (req.files && req.files.length > 0) {
      const attachmentPromises = req.files.map((file) =>
        LeaveAttachment.create({
          leaveRequestId: leaveRequest.id,
          fileName: file.originalname,
          filePath: "/" + file.path.replace(/\\/g, "/"),
          fileType: file.mimetype,
          fileSize: file.size,
        })
      );
      await Promise.all(attachmentPromises);
    }

    // Create Notification for Supervisor
    const currentUser = await User.findByPk(req.user.id);
    if (currentUser.supervisorId && !validation.autoApprove) {
      await Notification.create({
        userId: currentUser.supervisorId,
        type: "leave_request",
        title: "มีคำขอลาใหม่",
        message: `${currentUser.firstName} ${
          currentUser.lastName
        } ได้ขอลา ${getLeaveTypeName(leaveType)}`,
        relatedLeaveId: leaveRequest.id,
        isRead: false,
      });
    }

    // Deduct leave balance if auto-approved
    if (validation.autoApprove) {
      const userBalance = await LeaveBalance.findOne({
        where: { userId: req.user.id },
      });
      const daysToDeduct = validation.countWorkingDaysOnly
        ? validation.workingDays
        : validation.totalDays;

      if (userBalance && userBalance[leaveType] !== undefined) {
        await userBalance.update({
          [leaveType]: userBalance[leaveType] - daysToDeduct,
        });
      }
    }

    // Fetch created request with associations
    const createdRequest = await LeaveRequest.findByPk(leaveRequest.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        { model: LeaveAttachment, as: "attachments" },
      ],
    });

    res.status(201).json({
      ...createdRequest.toJSON(),
      message: validation.autoApprove
        ? "อนุมัติอัตโนมัติตามระเบียบ (ลาตรวจเลือก/เตรียมพล)"
        : undefined,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get my leave requests
// @route   GET /api/leave-requests
// @access  Private
const getMyLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: "approver",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: LeaveAttachment,
          as: "attachments",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all leave requests (admin)
// @route   GET /api/leave-requests/all
// @access  Private/Admin
const getAllLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "employeeId",
            "firstName",
            "lastName",
            "email",
            "position",
          ],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get pending leave requests (for approval)
// @route   GET /api/leave-requests/pending
// @access  Private/Supervisor
const getPendingLeaveRequests = async (req, res) => {
  try {
    let where = { status: "pending" };

    // If supervisor (head), only show requests from their subordinates
    if (req.user.role === "head") {
      const subordinates = await User.findAll({
        where: { supervisorId: req.user.id },
        attributes: ["id"],
      });
      const subordinateIds = subordinates.map((s) => s.id);
      where.userId = { [Op.in]: subordinateIds };
    }

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "employeeId",
            "firstName",
            "lastName",
            "email",
            "position",
            "profileImage",
          ],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Approve leave request
// @route   PUT /api/leave-requests/:id/approve
// @access  Private/Supervisor
const approveLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
        },
      ],
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Leave request has already been processed" });
    }

    // Deduct leave balance
    const employeeBalance = await LeaveBalance.findOne({
      where: { userId: leaveRequest.userId },
    });

    if (
      employeeBalance &&
      employeeBalance[leaveRequest.leaveType] !== undefined
    ) {
      await employeeBalance.update({
        [leaveRequest.leaveType]:
          employeeBalance[leaveRequest.leaveType] - leaveRequest.totalDays,
      });
    }

    // Update leave request
    await leaveRequest.update({
      status: "approved",
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason: req.body.note || "",
    });

    // Create Notification for User
    await Notification.create({
      userId: leaveRequest.userId,
      type: "approval",
      title: "คำขอลาได้รับการอนุมัติ",
      message: `คำขอลา ${getLeaveTypeName(
        leaveRequest.leaveType
      )} ของคุณได้รับการอนุมัติแล้ว`,
      relatedLeaveId: leaveRequest.id,
      isRead: false,
    });

    // Refetch with associations
    const updatedRequest = await LeaveRequest.findByPk(leaveRequest.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reject leave request
// @route   PUT /api/leave-requests/:id/reject
// @access  Private/Supervisor
const rejectLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByPk(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Leave request has already been processed" });
    }

    await leaveRequest.update({
      status: "rejected",
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason: req.body.note || "",
    });

    // Create Notification for User
    await Notification.create({
      userId: leaveRequest.userId,
      type: "rejection",
      title: "คำขอลาถูกปฏิเสธ",
      message: `คำขอลา ${getLeaveTypeName(
        leaveRequest.leaveType
      )} ของคุณถูกปฏิเสธ`,
      relatedLeaveId: leaveRequest.id,
      isRead: false,
    });

    // Refetch with associations
    const updatedRequest = await LeaveRequest.findByPk(leaveRequest.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get leave request by ID
// @route   GET /api/leave-requests/:id
// @access  Private
const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "employeeId",
            "firstName",
            "lastName",
            "email",
            "position",
          ],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: LeaveAttachment,
          as: "attachments",
        },
      ],
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(leaveRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to get leave type name in Thai
const getLeaveTypeName = (type) => {
  const types = {
    sick: "ลาป่วย",
    personal: "ลากิจส่วนตัว",
    vacation: "ลาพักผ่อน",
    maternity: "ลาคลอดบุตร",
    paternity: "ลาช่วยภรรยาคลอด",
    childcare: "ลากิจเลี้ยงดูบุตร",
    ordination: "ลาอุปสมบท/ฮัจย์",
    military: "ลาตรวจเลือก/เตรียมพล",
  };
  return types[type] || type;
};

// @desc    Cancel leave request
// @route   PUT /api/leave-requests/:id/cancel
// @access  Private
const cancelLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByPk(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Check ownership
    if (leaveRequest.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this request" });
    }

    if (leaveRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only cancel pending requests" });
    }

    await leaveRequest.update({ status: "cancelled" });

    res.json({ message: "คำขอลาถูกยกเลิกเรียบร้อยแล้ว", leaveRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update leave request
// @route   PUT /api/leave-requests/:id
// @access  Private
const updateLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByPk(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Check ownership
    if (leaveRequest.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this request" });
    }

    if (leaveRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only update pending requests" });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const userBalance = await LeaveBalance.findOne({
      where: { userId: req.user.id },
    });

    if (userBalance && userBalance[leaveType] < totalDays) {
      return res.status(400).json({
        message: `Insufficient leave balance. You have ${userBalance[leaveType]} days remaining.`,
      });
    }

    await leaveRequest.update({
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
    });

    res.json({ message: "อัปเดตคำขอลาเรียบร้อยแล้ว", leaveRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get team leave requests (for team calendar)
// @route   GET /api/leave-requests/team
// @access  Private
const getTeamLeaveRequests = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Department,
          as: "department",
        },
      ],
    });

    // Get users in the same department or with same supervisor
    let teamWhere = {};

    if (user.supervisorId) {
      // Get colleagues with the same supervisor
      teamWhere = {
        [Op.or]: [
          { supervisorId: user.supervisorId },
          { id: user.supervisorId },
        ],
      };
    } else if (user.departmentId) {
      // Get users in the same department
      teamWhere = { departmentId: user.departmentId };
    }

    const teamMembers = await User.findAll({
      where: teamWhere,
      attributes: ["id"],
    });
    const teamIds = teamMembers.map((m) => m.id);

    const leaveRequests = await LeaveRequest.findAll({
      where: {
        userId: { [Op.in]: teamIds },
        status: "approved",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      attributes: {
        exclude: [
          "reason",
          "rejectionReason",
          "contactAddress",
          "contactPhone",
        ],
      },
      order: [["startDate", "DESC"]],
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveRequestById,
  cancelLeaveRequest,
  updateLeaveRequest,
  getTeamLeaveRequests,
};
