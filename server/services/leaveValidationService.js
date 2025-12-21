const { Holiday, LeaveRequest, User, LeaveBalance } = require("../models");
const { Op } = require("sequelize");

// รายชื่อประเภทการลาที่นับเฉพาะวันทำการ (ไม่รวมวันหยุด)
const WORKING_DAYS_ONLY_LEAVE_TYPES = [
  "sick",
  "personal",
  "vacation",
  "paternity",
  "maternity",
  "childcare",
  "ordination",
];

// รายชื่อประเภทการลาที่นับรวมวันหยุด
const INCLUDE_HOLIDAYS_LEAVE_TYPES = ["military"];

/**
 * คำนวณปีงบประมาณจากวันที่ (1 ต.ค. - 30 ก.ย.)
 */
const getFiscalYear = (date = new Date()) => {
  const d = new Date(date);
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();
  // ถ้าเป็นเดือน ต.ค. - ธ.ค. (9-11) ปีงบประมาณคือปีถัดไป
  return month >= 9 ? year + 1 : year;
};

/**
 * คำนวณวันทำการ (หักวันเสาร์-อาทิตย์ และวันหยุดราชการ)
 */
const calculateWorkingDays = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // ดึงวันหยุดราชการในช่วงวันที่
  const holidays = await Holiday.findAll({
    where: {
      date: {
        [Op.between]: [start, end],
      },
    },
  });
  const holidayDates = holidays.map((h) => new Date(h.date).toDateString());

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateString = current.toDateString();

    // ไม่ใช่เสาร์ (6) หรืออาทิตย์ (0) และไม่ใช่วันหยุดราชการ
    if (
      dayOfWeek !== 0 &&
      dayOfWeek !== 6 &&
      !holidayDates.includes(dateString)
    ) {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDays;
};

/**
 * คำนวณจำนวนวันลาทั้งหมด (รวมวันหยุด)
 */
const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * ตรวจสอบเงื่อนไขการลาคลอดบุตร
 */
const validateMaternityLeave = async (userId, totalDays) => {
  const user = await User.findByPk(userId, {
    include: [{ model: LeaveBalance, as: "leaveBalance" }],
  });

  if (!user) {
    return { valid: false, message: "ไม่พบข้อมูลผู้ใช้" };
  }

  // Note: specialLeaveUsed ไม่มีใน Sequelize model ปัจจุบัน
  // สมมติว่าสามารถลาได้
  if (totalDays > 90) {
    return { valid: false, message: "ลาคลอดบุตรได้ไม่เกิน 90 วัน" };
  }

  return { valid: true };
};

/**
 * ตรวจสอบเงื่อนไขการลาช่วยภรรยาคลอด
 */
const validatePaternityLeave = async (
  userId,
  startDate,
  childBirthDate,
  workingDays
) => {
  if (!childBirthDate) {
    return { valid: false, message: "กรุณาระบุวันที่ภรรยาคลอดบุตร" };
  }

  const birthDate = new Date(childBirthDate);
  const leaveStart = new Date(startDate);
  const diffDays = Math.ceil((leaveStart - birthDate) / (1000 * 60 * 60 * 24));

  // ต้องลาภายใน 90 วันนับจากวันที่ภรรยาคลอด
  if (diffDays > 90) {
    return {
      valid: false,
      message: "ต้องลาภายใน 90 วันนับจากวันที่ภรรยาคลอดบุตร",
    };
  }

  // ลาได้ไม่เกิน 15 วันทำการ
  const user = await User.findByPk(userId, {
    include: [{ model: LeaveBalance, as: "leaveBalance" }],
  });

  if (!user || !user.leaveBalance) {
    return { valid: false, message: "ไม่พบข้อมูลวันลา" };
  }

  if (workingDays > user.leaveBalance.paternity) {
    return {
      valid: false,
      message: `สิทธิ์ลาช่วยภรรยาคลอดคงเหลือ ${user.leaveBalance.paternity} วันทำการ`,
    };
  }

  return { valid: true };
};

/**
 * ตรวจสอบเงื่อนไขการลากิจเลี้ยงดูบุตร
 */
const validateChildcareLeave = async (userId, workingDays) => {
  const user = await User.findByPk(userId, {
    include: [{ model: LeaveBalance, as: "leaveBalance" }],
  });

  if (!user || !user.leaveBalance) {
    return { valid: false, message: "ไม่พบข้อมูลวันลา" };
  }

  if (workingDays > user.leaveBalance.childcare) {
    return {
      valid: false,
      message: `สิทธิ์ลากิจเลี้ยงดูบุตรคงเหลือ ${user.leaveBalance.childcare} วันทำการ`,
    };
  }

  return { valid: true, isPaidLeave: false }; // ไม่ได้รับเงินเดือน
};

/**
 * ตรวจสอบเงื่อนไขการลาอุปสมบท/ฮัจย์
 */
const validateOrdinationLeave = async (
  userId,
  startDate,
  ceremonyDate,
  totalDays
) => {
  if (!ceremonyDate) {
    return {
      valid: false,
      message: "กรุณาระบุวันที่อุปสมบท/เดินทางไปประกอบพิธีฮัจย์",
    };
  }

  const ceremony = new Date(ceremonyDate);
  const now = new Date();
  const diffDays = Math.ceil((ceremony - now) / (1000 * 60 * 60 * 24));

  // ต้องยื่นล่วงหน้าอย่างน้อย 60 วัน
  if (diffDays < 60) {
    return {
      valid: false,
      message: "ต้องยื่นคำขอลาล่วงหน้าอย่างน้อย 60 วันก่อนวันอุปสมบท/เดินทาง",
    };
  }

  if (totalDays > 120) {
    return { valid: false, message: "ลาอุปสมบท/ฮัจย์ได้ไม่เกิน 120 วัน" };
  }

  return { valid: true };
};

/**
 * ตรวจสอบเงื่อนไขการลาตรวจเลือก/เตรียมพล
 */
const validateMilitaryLeave = async (userId, startDate) => {
  // ต้องรายงานภายใน 48 ชั่วโมง แต่ไม่ต้องรออนุมัติ
  // Auto-approve ทันที
  return { valid: true, autoApprove: true };
};

/**
 * ตรวจสอบเงื่อนไขการลากิจส่วนตัว
 */
const validatePersonalLeave = async (userId, workingDays) => {
  const user = await User.findByPk(userId, {
    include: [{ model: LeaveBalance, as: "leaveBalance" }],
  });

  if (!user || !user.leaveBalance) {
    return { valid: false, message: "ไม่พบข้อมูลวันลา" };
  }

  const fiscalYear = getFiscalYear();
  const maxDays = 45; // สมมติว่าไม่ใช่ปีแรก

  // ตรวจสอบว่าใช้สิทธิ์ไปแล้วเท่าไหร่ในปีงบประมาณนี้
  const usedDays = await getUsedLeaveDays(userId, "personal", fiscalYear);
  const remaining = user.leaveBalance.personal - usedDays;

  if (workingDays > remaining) {
    return {
      valid: false,
      message: `สิทธิ์ลากิจส่วนตัวคงเหลือ ${remaining} วันทำการ`,
    };
  }

  return { valid: true };
};

/**
 * ตรวจสอบเงื่อนไขการลาป่วย
 */
const validateSickLeave = async (
  userId,
  totalDays,
  hasMedicalCertificate,
  isLongTermSick
) => {
  const user = await User.findByPk(userId, {
    include: [{ model: LeaveBalance, as: "leaveBalance" }],
  });

  if (!user || !user.leaveBalance) {
    return { valid: false, message: "ไม่พบข้อมูลวันลา" };
  }

  // ถ้าลา 30 วันขึ้นไปต้องมีใบรับรองแพทย์
  if (totalDays >= 30 && !hasMedicalCertificate) {
    return {
      valid: false,
      message: "ลาป่วยตั้งแต่ 30 วันขึ้นไปต้องมีใบรับรองแพทย์",
    };
  }

  const fiscalYear = getFiscalYear();
  const maxDays = 60;

  const usedDays = await getUsedLeaveDays(userId, "sick", fiscalYear);
  const remaining = user.leaveBalance.sick - usedDays;

  if (totalDays > remaining) {
    return {
      valid: false,
      message: `สิทธิ์ลาป่วยคงเหลือ ${remaining} วัน`,
    };
  }

  return { valid: true };
};

/**
 * ตรวจสอบเงื่อนไขการลาพักผ่อน
 */
const validateVacationLeave = async (userId, workingDays) => {
  const user = await User.findByPk(userId, {
    include: [{ model: LeaveBalance, as: "leaveBalance" }],
  });

  if (!user || !user.leaveBalance) {
    return { valid: false, message: "ไม่พบข้อมูลวันลา" };
  }

  const remaining = user.leaveBalance.vacation;

  if (workingDays > remaining) {
    return {
      valid: false,
      message: `สิทธิ์ลาพักผ่อนคงเหลือ ${remaining} วันทำการ`,
    };
  }

  return { valid: true };
};

/**
 * ดึงจำนวนวันลาที่ใช้ไปแล้วในปีงบประมาณ
 */
const getUsedLeaveDays = async (
  userId,
  leaveType,
  fiscalYear,
  isLongTermSick = false
) => {
  const where = {
    userId,
    leaveType,
    status: {
      [Op.in]: ["approved", "pending"],
    },
  };

  const requests = await LeaveRequest.findAll({ where });

  // สำหรับประเภทที่นับเฉพาะวันทำการ
  if (WORKING_DAYS_ONLY_LEAVE_TYPES.includes(leaveType)) {
    return requests.reduce((sum, r) => sum + r.totalDays, 0);
  }

  return requests.reduce((sum, r) => sum + r.totalDays, 0);
};

/**
 * ตรวจสอบเงื่อนไขการลาทั้งหมด
 */
const validateLeaveRequest = async (leaveData) => {
  const {
    userId,
    leaveType,
    startDate,
    endDate,
    childBirthDate,
    ceremonyDate,
    hasMedicalCertificate,
    isLongTermSick,
    timeSlot,
  } = leaveData;

  let totalDays = calculateTotalDays(startDate, endDate);
  let workingDays = await calculateWorkingDays(startDate, endDate);

  // Handle Half-Day logic
  if (timeSlot === "morning" || timeSlot === "afternoon") {
    totalDays = 0.5;
    workingDays = workingDays > 0 ? 0.5 : 0; // If it's a working day, it counts as 0.5
  }

  let result = { valid: true };

  switch (leaveType) {
    case "maternity":
      result = await validateMaternityLeave(userId, totalDays);
      break;
    case "paternity":
      result = await validatePaternityLeave(
        userId,
        startDate,
        childBirthDate,
        workingDays
      );
      break;
    case "childcare":
      result = await validateChildcareLeave(userId, workingDays);
      break;
    case "ordination":
      result = await validateOrdinationLeave(
        userId,
        startDate,
        ceremonyDate,
        totalDays
      );
      break;
    case "military":
      result = await validateMilitaryLeave(userId, startDate);
      break;
    case "personal":
      result = await validatePersonalLeave(userId, workingDays);
      break;
    case "sick":
      result = await validateSickLeave(
        userId,
        totalDays,
        hasMedicalCertificate,
        isLongTermSick
      );
      break;
    case "vacation":
      result = await validateVacationLeave(userId, workingDays);
      break;
    default:
      result = { valid: false, message: "ประเภทการลาไม่ถูกต้อง" };
  }

  return {
    ...result,
    totalDays,
    workingDays,
    countWorkingDaysOnly: WORKING_DAYS_ONLY_LEAVE_TYPES.includes(leaveType),
  };
};

/**
 * รีเซ็ตวันลาประจำปีงบประมาณใหม่ (1 ต.ค.)
 */
const resetAnnualLeaveBalance = async () => {
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
      where: {}, // Update all
    }
  );

  return { success: true, usersUpdated: updatedCount };
};

module.exports = {
  getFiscalYear,
  calculateWorkingDays,
  calculateTotalDays,
  validateLeaveRequest,
  resetAnnualLeaveBalance,
  getUsedLeaveDays,
  WORKING_DAYS_ONLY_LEAVE_TYPES,
  INCLUDE_HOLIDAYS_LEAVE_TYPES,
};
