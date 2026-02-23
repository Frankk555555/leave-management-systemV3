# 🔄 Migration Guide - Schema V1 → V2

> คู่มือการอัปเดตจาก Schema V1 ไปยัง V2

---

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. Schema SQL
- [x] `server/database/schema_v2.sql` — สร้างใหม่

### 2. Sequelize Models (ทั้งหมด 10 ไฟล์)
- [x] `LeaveBalance.js` — **เขียนใหม่ทั้งหมด** (Normalized)
- [x] `LeaveRequest.js` — **เขียนใหม่** (FK leave_type_id, DECIMAL, cancelled)
- [x] `LeaveHistory.js` — **สร้างใหม่** (Audit Trail)
- [x] `User.js` — เพิ่ม `isActive`
- [x] `Faculty.js` — เพิ่ม `isActive`
- [x] `Department.js` — เพิ่ม `isActive`
- [x] `LeaveType.js` — เพิ่ม `isActive`
- [x] `Notification.js` — เพิ่ม `readAt`, types ใหม่
- [x] `LeaveAttachment.js` — เพิ่ม `originalName`
- [x] `Holiday.js` — เพิ่ม `year`, `type`
- [x] `index.js` — อัปเดต Associations ทั้งหมด

---

## ⚠️ สิ่งที่ต้องอัปเดตต่อ (Controllers)

### ❗ จุดเปลี่ยนหลัก 2 ข้อ

#### 1. `leaveType` (VARCHAR) → `leaveTypeId` (INT FK)
**ไฟล์ที่ต้องแก้:**

| ไฟล์ | จุดที่ต้องแก้ |
|------|-------------|
| `leaveRequestController.js` | เปลี่ยนจาก `req.body.leaveType` → ใช้ `leaveTypeId`, include LeaveType ใน queries |
| `reportController.js` | เปลี่ยนจาก `req.leaveType` → `req.leaveType.code`, join LeaveType |
| `notificationController.js` | เปลี่ยน attributes จาก `leaveType` → include LeaveType |
| `webhookController.js` | เปลี่ยนการ filter จาก `r.leaveType === "sick"` → ใช้ LeaveType relation |

#### 2. `leaveBalance` (Denormalized) → Normalized (FK + year)
**ไฟล์ที่ต้องแก้:**

| ไฟล์ | จุดที่ต้องแก้ |
|------|-------------|
| `userController.js` | เปลี่ยน `leaveBalance` → `leaveBalances`, สร้าง balance ต่อ leave_type |
| `authController.js` | เปลี่ยน include จาก `as: "leaveBalance"` → `as: "leaveBalances"` |
| `leaveRequestController.js` | เปลี่ยนการเช็ค/หัก balance จาก column-based → row-based |
| `reportController.js` | เปลี่ยน `resetYearlyLeaveBalance` ให้ทำงานกับ normalized data |

---

## 📋 ตัวอย่างการแก้ Controllers (Reference)

### ตัวอย่าง 1: สร้าง LeaveBalance สำหรับ User ใหม่

```javascript
// ❌ V1 (เดิม) - 1 แถว, หลาย columns
await LeaveBalance.create({
  userId: user.id,
  sick: 60,
  personal: 45,
  vacation: 10,
  // ...
});

// ✅ V2 (ใหม่) - หลายแถว, 1 ต่อ leave_type
const leaveTypes = await LeaveType.findAll({ where: { isActive: true } });
const currentYear = new Date().getFullYear();

await Promise.all(
  leaveTypes.map((lt) =>
    LeaveBalance.create({
      userId: user.id,
      leaveTypeId: lt.id,
      year: currentYear,
      totalDays: lt.defaultDays,
      usedDays: 0,
      carriedOverDays: 0,
    })
  )
);
```

### ตัวอย่าง 2: ดึง LeaveBalance ของ User

```javascript
// ❌ V1 (เดิม)
include: [{ model: LeaveBalance, as: "leaveBalance" }]

// ✅ V2 (ใหม่)
include: [{
  model: LeaveBalance,
  as: "leaveBalances",
  where: { year: new Date().getFullYear() },
  required: false,
  include: [{ model: LeaveType, as: "leaveType" }],
}]
```

### ตัวอย่าง 3: เช็คยอดวันลาคงเหลือ

```javascript
// ❌ V1 (เดิม)
const userBalance = await LeaveBalance.findOne({ where: { userId } });
if (userBalance[leaveType] < totalDays) { ... }

// ✅ V2 (ใหม่)
const balance = await LeaveBalance.findOne({
  where: {
    userId,
    leaveTypeId,
    year: new Date().getFullYear(),
  },
});
const remaining = balance.getRemainingDays();
if (remaining < totalDays) { ... }
```

### ตัวอย่าง 4: หักวันลา

```javascript
// ❌ V1 (เดิม)
await userBalance.update({
  [leaveType]: Math.max(0, currentBalance - totalDays),
});

// ✅ V2 (ใหม่)
await balance.update({
  usedDays: parseFloat(balance.usedDays) + totalDays,
});
```

### ตัวอย่าง 5: สร้าง LeaveRequest

```javascript
// ❌ V1 (เดิม)
await LeaveRequest.create({
  leaveType,  // VARCHAR "sick"
  ...
});

// ✅ V2 (ใหม่)
await LeaveRequest.create({
  leaveTypeId,  // INT FK
  ...
});
```

### ตัวอย่าง 6: บันทึก Audit Trail

```javascript
// ✅ V2 (ใหม่) - เพิ่มใน approve/reject/confirm functions
const { LeaveHistory } = require("../models");

await LeaveHistory.create({
  leaveRequestId: leaveRequest.id,
  action: "approved",
  actionBy: req.user.id,
  oldStatus: "pending",
  newStatus: "approved",
  note: "อนุมัติโดยหัวหน้า",
});
```
