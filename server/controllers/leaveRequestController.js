const {
  LeaveRequest,
  User,
  LeaveBalance,
  LeaveAttachment,
  Department,
  Faculty,
  Notification,
} = require("../models");
const { Op } = require("sequelize");
const {
  validateLeaveRequest,
  calculateWorkingDays,
  getFiscalYear,
} = require("../services/leaveValidationService");

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

    // Create leave request - auto save (no approval needed)
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
        }),
      );
      await Promise.all(attachmentPromises);
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

    // Notify all admins about new leave request
    try {
      const admins = await User.findAll({ where: { role: "admin" } });
      const leaveTypeName = getLeaveTypeName(leaveType);
      const notificationPromises = admins.map((admin) =>
        Notification.create({
          userId: admin.id,
          type: "new_leave",
          title: "มีใบลาใหม่",
          message: `${req.user.firstName} ${req.user.lastName} ยื่นใบ${leaveTypeName} ${validation.totalDays} วัน`,
          relatedLeaveId: leaveRequest.id,
        }),
      );
      await Promise.all(notificationPromises);
    } catch (notifyError) {
      console.error("Error notifying admins:", notifyError);
    }

    res.status(201).json(createdRequest);
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
            "unit",
            "affiliation",
            "phone",
            "documentNumber",
          ],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["id", "name"],
              include: [
                {
                  model: Faculty,
                  as: "faculty",
                  attributes: ["id", "name"],
                },
              ],
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

    await leaveRequest.destroy();

    res.json({ message: "ลบบันทึกการลาเรียบร้อยแล้ว" });
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

    res.json({ message: "อัปเดตบันทึกการลาเรียบร้อยแล้ว", leaveRequest });
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

// @desc    Confirm leave request (admin marks as processed in university system)
// @route   PUT /api/leave-requests/:id/confirm
// @access  Private/Admin
const confirmLeaveRequest = async (req, res) => {
  try {
    const { note } = req.body;
    const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: "ไม่พบใบลา" });
    }

    if (leaveRequest.status === "confirmed") {
      return res.status(400).json({ message: "ใบลานี้ถูกยืนยันแล้ว" });
    }

    // Update status to confirmed
    await leaveRequest.update({
      status: "confirmed",
      confirmedBy: req.user.id,
      confirmedAt: new Date(),
      confirmedNote: note || null,
    });

    // Deduct leave balance from user
    try {
      const userBalance = await LeaveBalance.findOne({
        where: { userId: leaveRequest.userId },
      });

      if (userBalance) {
        const leaveType = leaveRequest.leaveType;
        const totalDays = leaveRequest.totalDays;

        // Handle vacation specially (has accrued and current year)
        if (leaveType === "vacation") {
          // First deduct from current year, then from accrued
          let remaining = totalDays;
          const currentYear = userBalance.vacationCurrentYear || 0;
          const accrued = userBalance.vacationAccrued || 0;

          if (remaining <= currentYear) {
            await userBalance.update({
              vacationCurrentYear: currentYear - remaining,
              vacation: currentYear - remaining + accrued,
            });
          } else {
            // Deduct all current year first, then from accrued
            const fromAccrued = remaining - currentYear;
            await userBalance.update({
              vacationCurrentYear: 0,
              vacationAccrued: Math.max(0, accrued - fromAccrued),
              vacation: Math.max(0, accrued - fromAccrued),
            });
          }
        } else if (userBalance[leaveType] !== undefined) {
          // For other leave types, just deduct directly
          const currentBalance = userBalance[leaveType] || 0;
          await userBalance.update({
            [leaveType]: Math.max(0, currentBalance - totalDays),
          });
        }

        console.log(
          `Deducted ${totalDays} days of ${leaveType} from user ${leaveRequest.userId}`,
        );
      }
    } catch (balanceError) {
      console.error("Error deducting leave balance:", balanceError);
      // Don't fail the whole request, just log the error
    }

    // Send notification to the user
    const leaveTypeName = getLeaveTypeName(leaveRequest.leaveType);
    await Notification.create({
      userId: leaveRequest.userId,
      type: "confirmation",
      title: "ใบลาถูกลงข้อมูลแล้ว",
      message: `ใบ${leaveTypeName}ของคุณ (${
        leaveRequest.totalDays
      } วัน) ถูกลงข้อมูลในระบบมหาวิทยาลัยเรียบร้อยแล้ว${
        note ? " หมายเหตุ: " + note : ""
      }`,
      relatedLeaveId: leaveRequest.id,
    });

    res.json({ message: "ยืนยันการลงข้อมูลเรียบร้อยแล้ว", leaveRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  getLeaveRequestById,
  cancelLeaveRequest,
  updateLeaveRequest,
  getTeamLeaveRequests,
  confirmLeaveRequest,
};
