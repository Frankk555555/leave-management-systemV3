const { LeaveRequest, User, Holiday, Department } = require("../models");
const { Op } = require("sequelize");

// @desc    Get weekly leave report for n8n
// @route   GET /api/webhooks/weekly-report
// @access  Public (secured by API key)
const getWeeklyReport = async (req, res) => {
  try {
    // Verify API key
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.N8N_API_KEY) {
      return res.status(401).json({ message: "Invalid API key" });
    }

    // Get date range
    const now = new Date();
    let startDate, endDate;

    if (req.query.all === "true") {
      // Get all data (last 365 days)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 365);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default: Last 7 days (weekly report)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get leave requests for the period
    const leaveRequests = await LeaveRequest.findAll({
      where: {
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            endDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
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
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    // Get statistics
    const stats = {
      totalRequests: leaveRequests.length,
      approved: leaveRequests.filter((r) => r.status === "approved").length,
      pending: leaveRequests.filter((r) => r.status === "pending").length,
      rejected: leaveRequests.filter((r) => r.status === "rejected").length,
      cancelled: leaveRequests.filter((r) => r.status === "cancelled").length,
    };

    // Count by leave type
    const byType = {
      sick: leaveRequests.filter((r) => r.leaveType === "sick").length,
      personal: leaveRequests.filter((r) => r.leaveType === "personal").length,
      vacation: leaveRequests.filter((r) => r.leaveType === "vacation").length,
      maternity: leaveRequests.filter((r) => r.leaveType === "maternity")
        .length,
      paternity: leaveRequests.filter((r) => r.leaveType === "paternity")
        .length,
      childcare: leaveRequests.filter((r) => r.leaveType === "childcare")
        .length,
      ordination: leaveRequests.filter((r) => r.leaveType === "ordination")
        .length,
      military: leaveRequests.filter((r) => r.leaveType === "military").length,
    };

    // Count by department
    const byDepartment = {};
    leaveRequests.forEach((r) => {
      const dept = r.user?.department?.name || "ไม่ระบุ";
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    // Get holidays this week
    const holidays = await Holiday.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // Total days on leave
    const totalLeaveDays = leaveRequests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + r.totalDays, 0);

    // Format for AI summary
    const summaryData = {
      weekRange: {
        start: startDate.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        end: endDate.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      },
      statistics: stats,
      byLeaveType: byType,
      byDepartment,
      totalLeaveDays,
      holidays: holidays.map((h) => ({
        name: h.name,
        date: new Date(h.date).toLocaleDateString("th-TH"),
      })),
      leaveDetails: leaveRequests.map((r) => ({
        employee: `${r.user?.firstName || ""} ${r.user?.lastName || ""}`,
        department: r.user?.department?.name || "ไม่ระบุ",
        type:
          r.leaveType === "sick"
            ? "ลาป่วย"
            : r.leaveType === "personal"
            ? "ลากิจ"
            : r.leaveType === "vacation"
            ? "ลาพักร้อน"
            : r.leaveType === "maternity"
            ? "ลาคลอดบุตร"
            : r.leaveType === "paternity"
            ? "ลาช่วยภรรยาคลอด"
            : r.leaveType === "childcare"
            ? "ลาเลี้ยงดูบุตร"
            : r.leaveType === "ordination"
            ? "ลาอุปสมบท/ฮัจย์"
            : "ลาตรวจเลือก",
        startDate: new Date(r.startDate).toLocaleDateString("th-TH"),
        endDate: new Date(r.endDate).toLocaleDateString("th-TH"),
        totalDays: r.totalDays,
        status:
          r.status === "approved"
            ? "อนุมัติ"
            : r.status === "pending"
            ? "รออนุมัติ"
            : r.status === "rejected"
            ? "ปฏิเสธ"
            : "ยกเลิก",
        reason: r.reason,
      })),
      textSummary: generateTextSummary(
        stats,
        byType,
        byDepartment,
        totalLeaveDays,
        leaveRequests.length
      ),
    };

    res.json(summaryData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate text summary for AI
const generateTextSummary = (stats, byType, byDepartment, totalDays, total) => {
  let summary = `รายงานสรุปการลาประจำสัปดาห์\n\n`;
  summary += `📊 สถิติภาพรวม:\n`;
  summary += `- คำขอลาทั้งหมด: ${total} รายการ\n`;
  summary += `- อนุมัติแล้ว: ${stats.approved} / รออนุมัติ: ${stats.pending} / ไม่อนุมัติ: ${stats.rejected}\n`;
  summary += `- รวมวันลา (อนุมัติ): ${totalDays} วัน\n\n`;

  summary += `🏥 แยกตามประเภท:\n`;
  summary += `- ลาป่วย: ${byType.sick} รายการ\n`;
  summary += `- ลากิจส่วนตัว: ${byType.personal} รายการ\n`;
  summary += `- ลาพักผ่อน: ${byType.vacation} รายการ\n`;
  summary += `- ลาคลอดบุตร: ${byType.maternity} รายการ\n`;
  summary += `- ลาช่วยภรรยาคลอด: ${byType.paternity} รายการ\n`;
  summary += `- ลาเลี้ยงดูบุตร: ${byType.childcare} รายการ\n`;
  summary += `- ลาอุปสมบท/ฮัจย์: ${byType.ordination} รายการ\n`;
  summary += `- ลาตรวจเลือก: ${byType.military} รายการ\n\n`;

  summary += `🏢 แยกตามแผนก:\n`;
  Object.entries(byDepartment).forEach(([dept, count]) => {
    summary += `- ${dept}: ${count} รายการ\n`;
  });

  return summary;
};

// @desc    Webhook to receive n8n callbacks
// @route   POST /api/webhooks/n8n-callback
// @access  Public (secured by API key)
const n8nCallback = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.N8N_API_KEY) {
      return res.status(401).json({ message: "Invalid API key" });
    }

    const { action, data } = req.body;

    console.log("n8n callback received:", action, data);

    // Handle different actions from n8n
    switch (action) {
      case "report_sent":
        console.log("Weekly report was sent successfully");
        break;
      case "error":
        console.error("n8n reported an error:", data);
        break;
      default:
        console.log("Unknown action:", action);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getWeeklyReport,
  n8nCallback,
};
