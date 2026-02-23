import React from "react";
// ============================================
// Leave Type Utilities (Shared)
// ============================================
// รองรับทั้ง string code ("sick") และ object ({id, code, name, ...})
// ============================================

import {
  FaHospital,
  FaClipboardList,
  FaUmbrellaBeach,
  FaBaby,
  FaUserFriends,
  FaChild,
  FaPray,
  FaMedal,
} from "react-icons/fa";

const LEAVE_TYPE_NAMES = {
  sick: "ลาป่วย",
  personal: "ลากิจส่วนตัว",
  vacation: "ลาพักผ่อน",
  maternity: "ลาคลอดบุตร",
  paternity: "ลาช่วยภรรยาคลอด",
  childcare: "ลาเลี้ยงดูบุตร",
  ordination: "ลาอุปสมบท/ฮัจย์",
  military: "ลาตรวจเลือก",
};

/**
 * แปลง leaveType (string หรือ object) เป็น code string
 */
export const getLeaveTypeCode = (type) => {
  if (!type) return "";
  if (typeof type === "string") return type;
  return type.code || "";
};

/**
 * ดึงชื่อประเภทลาภาษาไทย
 * @param {string|object} type - code string หรือ LeaveType object
 */
export const getLeaveTypeName = (type) => {
  if (!type) return "ไม่ระบุ";
  // ถ้าเป็น object จาก backend V2
  if (typeof type === "object") {
    return type.name || LEAVE_TYPE_NAMES[type.code] || "ไม่ระบุ";
  }
  // ถ้าเป็น string code
  return LEAVE_TYPE_NAMES[type] || type;
};

/**
 * ดึง icon สำหรับประเภทลา
 * @param {string|object} type - code string หรือ LeaveType object
 */
export const getLeaveTypeIcon = (type) => {
  const code = getLeaveTypeCode(type);
  switch (code) {
    case "sick":
      return <FaHospital />;
    case "personal":
      return <FaClipboardList />;
    case "vacation":
      return <FaUmbrellaBeach />;
    case "maternity":
      return <FaBaby />;
    case "paternity":
      return <FaUserFriends />;
    case "childcare":
      return <FaChild />;
    case "ordination":
      return <FaPray />;
    case "military":
      return <FaMedal />;
    default:
      return <FaClipboardList />;
  }
};
