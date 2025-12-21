const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const {
  LeaveRequest,
  User,
  LeaveType,
  LeaveBalance,
  Department,
} = require("../models");
const { Op } = require("sequelize");

// @desc    Get leave statistics
// @route   GET /api/reports/statistics
// @access  Private/Admin
const getLeaveStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    // Get all leave requests for the year
    const leaveRequests = await LeaveRequest.findAll({
      where: {
        startDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "departmentId"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    // Statistics by type
    const byType = leaveRequests.reduce((acc, req) => {
      acc[req.leaveType] = (acc[req.leaveType] || 0) + req.totalDays;
      return acc;
    }, {});

    // Statistics by department
    const byDepartment = leaveRequests.reduce((acc, req) => {
      const dept = req.user?.department?.name || "ไม่ระบุ";
      acc[dept] = (acc[dept] || 0) + req.totalDays;
      return acc;
    }, {});

    // Statistics by month
    const byMonth = Array(12).fill(0);
    leaveRequests.forEach((req) => {
      const month = new Date(req.startDate).getMonth();
      byMonth[month] += req.totalDays;
    });

    // Statistics by status
    const byStatus = leaveRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});

    // Total employees
    const totalEmployees = await User.count();

    res.json({
      year: currentYear,
      totalRequests: leaveRequests.length,
      totalDays: leaveRequests.reduce((sum, r) => sum + r.totalDays, 0),
      totalEmployees,
      byType,
      byDepartment,
      byMonth,
      byStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Export leave report to Excel
// @route   GET /api/reports/export/excel
// @access  Private/Admin
const exportToExcel = async (req, res) => {
  try {
    const { year, month } = req.query;

    let where = {};
    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1);
      const endDate = month
        ? new Date(year, month, 0)
        : new Date(year, 11, 31, 23, 59, 59);
      where.startDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["employeeId", "firstName", "lastName", "position"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["name"],
            },
          ],
        },
        {
          model: User,
          as: "approver",
          attributes: ["firstName", "lastName"],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("รายงานการลา");

    // Header styling
    worksheet.columns = [
      { header: "รหัสพนักงาน", key: "employeeId", width: 15 },
      { header: "ชื่อ-นามสกุล", key: "employeeName", width: 25 },
      { header: "แผนก", key: "department", width: 20 },
      { header: "ประเภทการลา", key: "leaveType", width: 15 },
      { header: "วันที่เริ่ม", key: "startDate", width: 15 },
      { header: "วันที่สิ้นสุด", key: "endDate", width: 15 },
      { header: "จำนวนวัน", key: "totalDays", width: 12 },
      { header: "สถานะ", key: "status", width: 15 },
      { header: "ผู้อนุมัติ", key: "approvedBy", width: 20 },
      { header: "เหตุผล", key: "reason", width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "667eea" },
    };
    worksheet.getRow(1).font = { color: { argb: "FFFFFF" }, bold: true };

    // Add data
    const leaveTypeNames = {
      sick: "ลาป่วย",
      personal: "ลากิจส่วนตัว",
      vacation: "ลาพักผ่อน",
      maternity: "ลาคลอดบุตร",
      paternity: "ลาช่วยภรรยาคลอด",
      childcare: "ลาเลี้ยงดูบุตร",
      ordination: "ลาอุปสมบท/ฮัจย์",
      military: "ลาตรวจเลือก",
    };
    const statusNames = {
      pending: "รออนุมัติ",
      approved: "อนุมัติแล้ว",
      rejected: "ไม่อนุมัติ",
    };

    leaveRequests.forEach((request) => {
      worksheet.addRow({
        employeeId: request.user?.employeeId || "",
        employeeName: `${request.user?.firstName || ""} ${
          request.user?.lastName || ""
        }`,
        department: request.user?.department?.name || "",
        leaveType: leaveTypeNames[request.leaveType] || request.leaveType,
        startDate: new Date(request.startDate).toLocaleDateString("th-TH"),
        endDate: new Date(request.endDate).toLocaleDateString("th-TH"),
        totalDays: request.totalDays,
        status: statusNames[request.status] || request.status,
        approvedBy: request.approver
          ? `${request.approver.firstName} ${request.approver.lastName}`
          : "",
        reason: request.reason,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=leave-report-${year || "all"}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Export leave report to PDF
// @route   GET /api/reports/export/pdf
// @access  Private/Admin
const exportToPDF = async (req, res) => {
  try {
    const { year, month } = req.query;

    let where = {};
    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1);
      const endDate = month
        ? new Date(year, month, 0)
        : new Date(year, 11, 31, 23, 59, 59);
      where.startDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["employeeId", "firstName", "lastName"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    const path = require("path");
    const fontPath = path.join(__dirname, "../fonts/Mitr-Regular.ttf");

    const doc = new PDFDocument({
      margin: 50,
      font: fontPath, // Set default font
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=leave-report-${year || "all"}.pdf`
    );

    doc.pipe(res);

    // Register font family to be safe
    doc.font(fontPath);

    // Title
    doc.fontSize(20).text("รายงานการลา", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`ปี: ${year || "ทั้งหมด"}`, { align: "center" });
    doc.moveDown(2);

    // Summary
    const stats = {
      total: leaveRequests.length,
      approved: leaveRequests.filter((r) => r.status === "approved").length,
      pending: leaveRequests.filter((r) => r.status === "pending").length,
      rejected: leaveRequests.filter((r) => r.status === "rejected").length,
    };

    doc.fontSize(14).text("สรุป", { underline: true });
    doc.fontSize(12);
    doc.text(`จำนวนคำขอทั้งหมด: ${stats.total}`);
    doc.text(`อนุมัติแล้ว: ${stats.approved}`);
    doc.text(`รออนุมัติ: ${stats.pending}`);
    doc.text(`ไม่อนุมัติ: ${stats.rejected}`);
    doc.moveDown(2);

    // Table header
    const leaveTypeNames = {
      sick: "ลาป่วย",
      personal: "ลากิจส่วนตัว",
      vacation: "ลาพักผ่อน",
      maternity: "ลาคลอดบุตร",
      paternity: "ลาช่วยภรรยาคลอด",
      childcare: "ลาเลี้ยงดูบุตร",
      ordination: "ลาอุปสมบท/ฮัจย์",
      military: "ลาตรวจเลือก",
    };

    doc.fontSize(14).text("รายละเอียด", { underline: true });
    doc.moveDown();

    leaveRequests.slice(0, 50).forEach((request, index) => {
      doc.fontSize(10);
      doc.text(
        `${index + 1}. ${request.user?.firstName || ""} ${
          request.user?.lastName || ""
        } - ${leaveTypeNames[request.leaveType] || request.leaveType}`
      );
      doc.text(
        `   วันที่: ${new Date(request.startDate).toLocaleDateString(
          "th-TH"
        )} - ${new Date(request.endDate).toLocaleDateString("th-TH")} (${
          request.totalDays
        } วัน)`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reset yearly leave balance for all employees
// @route   POST /api/reports/reset-yearly
// @access  Private/Admin
const resetYearlyLeaveBalance = async (req, res) => {
  try {
    // Update all leave balances to default values
    const [updatedCount] = await LeaveBalance.update(
      {
        sick: 60,
        personal: 45,
        vacation: 10,
        maternity: 90,
        paternity: 15,
        childcare: 150,
        ordination: 120,
        military: 60,
      },
      {
        where: {}, // Update all records
      }
    );

    res.json({
      message: "รีเซ็ตวันลาประจำปีเรียบร้อยแล้ว",
      updatedCount,
      leaveBalance: {
        sick: 60,
        personal: 45,
        vacation: 10,
        maternity: 90,
        paternity: 15,
        childcare: 150,
        ordination: 120,
        military: 60,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all leave requests (admin)
// @route   GET /api/reports/all-requests
// @access  Private/Admin
const getAllRequests = async (req, res) => {
  try {
    const { year, status, departmentId } = req.query;

    let where = {};

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      where.startDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (status) {
      where.status = status;
    }

    const include = [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "employeeId",
          "firstName",
          "lastName",
          "position",
          "departmentId",
        ],
        include: [
          {
            model: Department,
            as: "department",
            attributes: ["id", "name"],
          },
        ],
        where: departmentId ? { departmentId } : undefined,
      },
      {
        model: User,
        as: "approver",
        attributes: ["id", "firstName", "lastName"],
      },
    ];

    const leaveRequests = await LeaveRequest.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getLeaveStatistics,
  exportToExcel,
  exportToPDF,
  resetYearlyLeaveBalance,
  getAllRequests,
};
