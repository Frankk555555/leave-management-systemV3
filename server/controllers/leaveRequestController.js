const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");
const {
  sendLeaveRequestEmail,
  sendApprovalEmail,
} = require("../services/emailService");
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
      childBirthDate,
      ceremonyDate,
      hasMedicalCertificate,
      isLongTermSick,
    } = req.body;

    // Validate leave request with business rules
    const validation = await validateLeaveRequest({
      userId: req.user._id,
      leaveType,
      startDate,
      endDate,
      childBirthDate,
      ceremonyDate,
      hasMedicalCertificate,
      isLongTermSick,
    });

    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Get attachment paths if files were uploaded (convert to URL format)
    const attachments = req.files
      ? req.files.map((file) => "/" + file.path.replace(/\\/g, "/"))
      : [];

    // Determine if paid leave
    const isPaidLeave = validation.isPaidLeave !== false;

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employee: req.user._id,
      leaveType,
      startDate,
      endDate,
      totalDays: validation.totalDays,
      workingDays: validation.workingDays,
      reason,
      attachments,
      childBirthDate: childBirthDate || null,
      ceremonyDate: ceremonyDate || null,
      hasMedicalCertificate: hasMedicalCertificate || false,
      isLongTermSick: isLongTermSick || false,
      isPaidLeave,
      fiscalYear: getFiscalYear(new Date(startDate)),
      // Auto-approve for military leave
      status: validation.autoApprove ? "approved" : "pending",
      approvedBy: validation.autoApprove ? req.user._id : null,
      approvalDate: validation.autoApprove ? new Date() : null,
      approvalNote: validation.autoApprove ? "อนุมัติอัตโนมัติตามระเบียบ" : "",
    });

    // Deduct leave balance if auto-approved
    if (validation.autoApprove) {
      const user = await User.findById(req.user._id);
      const daysToDeduct = validation.countWorkingDaysOnly
        ? validation.workingDays
        : validation.totalDays;
      user.leaveBalance[leaveType] -= daysToDeduct;
      await user.save();
    }

    // Get user for notifications
    const user = await User.findById(req.user._id);

    // Create notification for supervisor (skip for auto-approved)
    let emailSentTo = [];

    if (!validation.autoApprove && user.supervisor) {
      const supervisor = await User.findById(user.supervisor);
      await Notification.create({
        user: user.supervisor,
        type: "leave_request",
        title: "คำขอลาใหม่",
        message: `${user.firstName} ${user.lastName} ยื่นคำขอ${getLeaveTypeName(
          leaveType
        )} ${validation.totalDays} วัน`,
        relatedLeave: leaveRequest._id,
      });
      sendLeaveRequestEmail(supervisor, user, leaveRequest);
      emailSentTo.push(user.supervisor.toString());
    }

    // Notify admins (skip for auto-approved)
    if (!validation.autoApprove) {
      const admins = await User.find({
        role: "admin",
        _id: { $ne: req.user._id },
      });
      for (const admin of admins) {
        if (emailSentTo.includes(admin._id.toString())) continue;

        await Notification.create({
          user: admin._id,
          type: "leave_request",
          title: "คำขอลาใหม่",
          message: `${user.firstName} ${
            user.lastName
          } ยื่นคำขอ${getLeaveTypeName(leaveType)} ${validation.totalDays} วัน`,
          relatedLeave: leaveRequest._id,
        });
        sendLeaveRequestEmail(admin, user, leaveRequest);
      }
    }

    res.status(201).json({
      ...leaveRequest.toObject(),
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
    const leaveRequests = await LeaveRequest.find({ employee: req.user._id })
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });
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
    const leaveRequests = await LeaveRequest.find({})
      .populate("employee", "firstName lastName email department")
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });
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
    let query = { status: "pending" };

    // If supervisor, only show requests from their subordinates
    if (req.user.role === "supervisor") {
      const subordinates = await User.find({ supervisor: req.user._id }).select(
        "_id"
      );
      const subordinateIds = subordinates.map((s) => s._id);
      query.employee = { $in: subordinateIds };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate("employee", "firstName lastName email department position")
      .sort({ createdAt: -1 });
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
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Leave request has already been processed" });
    }

    // Deduct leave balance
    const employee = await User.findById(leaveRequest.employee);
    employee.leaveBalance[leaveRequest.leaveType] -= leaveRequest.totalDays;
    await employee.save();

    // Update leave request
    leaveRequest.status = "approved";
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvalDate = new Date();
    leaveRequest.approvalNote = req.body.note || "";

    await leaveRequest.save();

    // Create notification for employee
    await Notification.create({
      user: leaveRequest.employee,
      type: "approval",
      title: "คำขอลาได้รับการอนุมัติ",
      message: `คำขอลา${getLeaveTypeName(
        leaveRequest.leaveType
      )}ของคุณได้รับการอนุมัติแล้ว`,
      relatedLeave: leaveRequest._id,
    });
    // Send approval email
    sendApprovalEmail(employee, leaveRequest, true, req.body.note);

    res.json(leaveRequest);
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
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Leave request has already been processed" });
    }

    leaveRequest.status = "rejected";
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvalDate = new Date();
    leaveRequest.approvalNote = req.body.note || "";

    await leaveRequest.save();

    // Get employee for email
    const employee = await User.findById(leaveRequest.employee);

    // Create notification for employee
    await Notification.create({
      user: leaveRequest.employee,
      type: "rejection",
      title: "คำขอลาถูกปฏิเสธ",
      message: `คำขอลา${getLeaveTypeName(
        leaveRequest.leaveType
      )}ของคุณถูกปฏิเสธ${req.body.note ? ": " + req.body.note : ""}`,
      relatedLeave: leaveRequest._id,
    });
    // Send rejection email
    sendApprovalEmail(employee, leaveRequest, false, req.body.note);

    res.json(leaveRequest);
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
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate("employee", "firstName lastName email department position")
      .populate("approvedBy", "firstName lastName");

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
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Check ownership
    if (leaveRequest.employee.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this request" });
    }

    if (leaveRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only cancel pending requests" });
    }

    leaveRequest.status = "cancelled";
    await leaveRequest.save();

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
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Check ownership
    if (leaveRequest.employee.toString() !== req.user._id.toString()) {
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
    const user = await User.findById(req.user._id);
    if (user.leaveBalance[leaveType] < totalDays) {
      return res.status(400).json({
        message: `Insufficient leave balance. You have ${user.leaveBalance[leaveType]} days remaining.`,
      });
    }

    leaveRequest.leaveType = leaveType;
    leaveRequest.startDate = startDate;
    leaveRequest.endDate = endDate;
    leaveRequest.totalDays = totalDays;
    leaveRequest.reason = reason;

    await leaveRequest.save();

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
    const user = await User.findById(req.user._id);

    // Get users in the same department or with same supervisor
    let teamQuery = {};

    if (user.supervisor) {
      // Get colleagues with the same supervisor
      teamQuery = {
        $or: [{ supervisor: user.supervisor }, { _id: user.supervisor }],
      };
    } else {
      // Get users in the same department
      teamQuery = { department: user.department };
    }

    const teamMembers = await User.find(teamQuery).select("_id");
    const teamIds = teamMembers.map((m) => m._id);

    const leaveRequests = await LeaveRequest.find({
      employee: { $in: teamIds },
      status: "approved",
    })
      .populate("employee", "firstName lastName department")
      .select("-reason -attachments -approvalNote")
      .sort({ startDate: -1 });

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
