# 📦 Database Design - ระบบบริหารการลา (Leave Management System)

> **Version:** 2.0 | **DB Engine:** MySQL 8.0+ | **ORM:** Sequelize | **Charset:** utf8mb4

---

## 📊 ER Diagram (Entity Relationship)

```
┌──────────────┐         ┌──────────────┐
│  faculties   │ 1 ── N  │ departments  │
│──────────────│         │──────────────│
│ PK id        │◄────────│ FK faculty_id│
│ name         │         │ PK id        │
│ code (UQ)    │         │ name         │
│ type (ENUM)  │         │ code (UQ)    │
│ is_active    │         │ is_active    │
└──────────────┘         └──────┬───────┘
                                │ 1
                                │
                                │ N
                         ┌──────┴───────┐
                         │    users     │
                         │──────────────│
                         │ PK id        │
                         │ employee_id  │
                         │ email (UQ)   │
                         │ password     │
                         │ first_name   │
                         │ last_name    │
                         │ FK dept_id   │
                         │ position     │
                         │ role (ENUM)  │
      ┌─ self-ref ──────►│ FK superv_id │
      │                  │ phone        │
      │                  │ start_date   │
      │                  │ is_active    │
      │                  └──┬───┬───┬───┘
      │                     │   │   │
      │              ┌──────┘   │   └──────┐
      │              │ 1        │ 1        │ 1
      │              │ N        │ N        │ N
      │    ┌─────────┴──┐ ┌────┴─────┐ ┌──┴───────────┐
      │    │leave_balan │ │leave_req │ │notifications │
      │    │────────────│ │──────────│ │──────────────│
      │    │PK id       │ │PK id     │ │ PK id        │
      │    │FK user_id  │ │FK user_id│ │ FK user_id   │
      │    │FK type_id  │ │FK type_id│ │ type (ENUM)  │
      │    │year        │ │start_date│ │ title        │
      │    │total_days  │ │end_date  │ │ message      │
      │    │used_days   │ │total_days│ │ FK rel_leave │
      │    │carried_over│ │time_slot │ │ is_read      │
      │    │            │ │reason    │ │ read_at      │
      │    │ UQ(user,   │ │status    │ └──────────────┘
      │    │  type,year)│ │FK approv │
      │    └────────────┘ │FK confirm│
      │                   └──┬───┬───┘
      │                      │   │
      │               ┌──────┘   └──────┐
      │               │ 1               │ 1
      │               │ N               │ N
      │    ┌──────────┴───┐   ┌────────┴──────┐
      │    │leave_attachm │   │ leave_history │
      │    │──────────────│   │──────────────-│
      │    │PK id         │   │ PK id         │
      │    │FK request_id │   │ FK request_id │
      │    │file_name     │   │ action (ENUM) │
      │    │original_name │   │ FK action_by  │
      │    │file_path     │   │ old_status    │
      │    │file_type     │   │ new_status    │
      │    │file_size     │   │ note          │
      │    └──────────────┘   └───────────────┘
      │
      │     ┌──────────────┐     ┌──────────────┐
      │     │ leave_types  │     │  holidays    │
      │     │──────────────│     │──────────────│
      └─────│ PK id        │     │ PK id        │
            │ name         │     │ name         │
            │ code (UQ)    │     │ date (UQ)    │
            │ description  │     │ year         │
            │ default_days │     │ type (ENUM)  │
            │ req_med_cert │     │ description  │
            │ is_active    │     │              │
            └──────────────┘     └──────────────┘
```

---

## 📋 รายละเอียดแต่ละตาราง

### 1. `faculties` - คณะ / สำนัก / สถาบัน

| Column     | Type                                      | Constraint  | Description         |
|------------|-------------------------------------------|-------------|---------------------|
| id         | INT                                       | PK, AI      | รหัสคณะ             |
| name       | VARCHAR(150)                              | NOT NULL    | ชื่อคณะ             |
| code       | VARCHAR(50)                               | UNIQUE, NOT NULL | รหัสย่อ (เช่น EDU) |
| type       | ENUM('faculty','office','institute')      | DEFAULT 'faculty' | ประเภทหน่วยงาน |
| is_active  | BOOLEAN                                   | DEFAULT TRUE | สถานะใช้งาน        |

---

### 2. `departments` - สาขาวิชา / หน่วยงาน

| Column     | Type          | Constraint            | Description          |
|------------|---------------|-----------------------|----------------------|
| id         | INT           | PK, AI                | รหัสสาขา             |
| faculty_id | INT           | FK → faculties.id     | สังกัดคณะ            |
| name       | VARCHAR(150)  | NOT NULL              | ชื่อสาขา             |
| code       | VARCHAR(50)   | UNIQUE, NOT NULL      | รหัสย่อ              |
| is_active  | BOOLEAN       | DEFAULT TRUE          | สถานะใช้งาน          |

---

### 3. `users` - ผู้ใช้งาน / บุคลากร

| Column               | Type                              | Constraint               | Description                    |
|----------------------|-----------------------------------|--------------------------|--------------------------------|
| id                   | INT                               | PK, AI                   | รหัสผู้ใช้                     |
| employee_id          | VARCHAR(50)                       | UNIQUE, NOT NULL          | รหัสพนักงาน                    |
| email                | VARCHAR(100)                      | UNIQUE, NOT NULL          | อีเมล                         |
| password             | VARCHAR(255)                      | NOT NULL                  | รหัสผ่าน (bcrypt hashed)       |
| first_name           | VARCHAR(100)                      |                           | ชื่อ                           |
| last_name            | VARCHAR(100)                      |                           | นามสกุล                        |
| department_id        | INT                               | FK → departments.id      | สังกัดสาขา                     |
| position             | VARCHAR(100)                      |                           | ตำแหน่ง                        |
| role                 | ENUM('employee','head','admin')   | DEFAULT 'employee'        | บทบาท                          |
| supervisor_id        | INT                               | FK → users.id (self-ref) | หัวหน้า                        |
| phone                | VARCHAR(20)                       |                           | เบอร์โทร                       |
| profile_image        | VARCHAR(255)                      |                           | Path รูปโปรไฟล์                |
| start_date           | DATE                              |                           | วันเริ่มรับราชการ              |
| government_division  | VARCHAR(255)                      |                           | ส่วนราชการ                     |
| document_number      | VARCHAR(100)                      |                           | เลขหนังสือ                     |
| unit                 | VARCHAR(255)                      |                           | หน่วยงาน                       |
| affiliation          | VARCHAR(255)                      |                           | สังกัด (คณะ)                   |
| **is_active**        | BOOLEAN                           | DEFAULT TRUE              | ⭐ **Soft delete** แทนการลบจริง |

---

### 4. `leave_types` - ประเภทการลา

| Column               | Type          | Constraint         | Description                |
|----------------------|---------------|--------------------|----------------------------|
| id                   | INT           | PK, AI             | รหัสประเภทลา               |
| name                 | VARCHAR(100)  | NOT NULL           | ชื่อประเภท (เช่น ลาป่วย)  |
| code                 | VARCHAR(50)   | UNIQUE, NOT NULL   | รหัสย่อ (เช่น sick)        |
| description          | TEXT          |                    | คำอธิบาย                   |
| default_days         | INT           | NOT NULL, DEFAULT 0| จำนวนวันลาสูงสุดต่อปี      |
| requires_medical_cert| BOOLEAN       | DEFAULT FALSE      | ต้องใบรับรองแพทย์          |
| is_active            | BOOLEAN       | DEFAULT TRUE       | สถานะใช้งาน                |

**ข้อมูลเริ่มต้น 8 ประเภท:**
| code       | name              | default_days | requires_cert |
|------------|-------------------|:-------------|:-------------|
| sick       | ลาป่วย            | 60           | ✅            |
| personal   | ลากิจส่วนตัว      | 45           | ❌            |
| vacation   | ลาพักผ่อน         | 10           | ❌            |
| maternity  | ลาคลอดบุตร        | 90           | ❌            |
| paternity  | ลาช่วยภรรยาคลอด   | 15           | ❌            |
| childcare  | ลาเลี้ยงดูบุตร    | 150          | ❌            |
| ordination | ลาอุปสมบท/ฮัจย์   | 120          | ❌            |
| military   | ลาตรวจเลือก       | 60           | ❌            |

---

### 5. `leave_balances` - ยอดวันลาคงเหลือ ⭐ **ปรับปรุงใหม่**

| Column           | Type         | Constraint                          | Description                    |
|-----------------|--------------|-------------------------------------|--------------------------------|
| id              | INT          | PK, AI                              | รหัส                           |
| user_id         | INT          | FK → users.id                       | รหัสผู้ใช้                     |
| leave_type_id   | INT          | FK → leave_types.id                 | ประเภทการลา                    |
| year            | YEAR         | NOT NULL                            | ปีงบประมาณ                     |
| total_days      | DECIMAL(5,1) | NOT NULL, DEFAULT 0                 | วันลาทั้งหมดที่ได้รับ          |
| used_days       | DECIMAL(5,1) | NOT NULL, DEFAULT 0                 | วันลาที่ใช้ไปแล้ว              |
| carried_over_days| DECIMAL(5,1)| NOT NULL, DEFAULT 0                 | วันลาสะสมจากปีก่อน             |

**UNIQUE KEY:** `(user_id, leave_type_id, year)` — ป้องกันซ้ำซ้อน

> **🔑 ทำไมถึงปรับปรุง?**
> - **เดิม:** 1 แถว = 1 user โดยมี column `sick`, `personal`, `vacation`, ... (Denormalized)
> - **ใหม่:** 1 แถว = 1 user + 1 leave_type + 1 year (Normalized)
> - **ข้อดี:** เพิ่มประเภทลาใหม่ได้ทันทีโดยไม่ต้อง `ALTER TABLE`, รองรับการติดตามรายปี, คำนวณคงเหลือได้ง่าย: `total_days + carried_over_days - used_days`

---

### 6. `leave_requests` - คำขอลา

| Column          | Type                                                          | Constraint           | Description          |
|----------------|---------------------------------------------------------------|----------------------|----------------------|
| id             | INT                                                           | PK, AI               | รหัสคำขอ             |
| user_id        | INT                                                           | FK → users.id        | ผู้ขอลา              |
| leave_type_id  | INT                                                           | FK → leave_types.id  | ⭐ ประเภทการลา (FK)  |
| start_date     | DATE                                                          | NOT NULL             | วันเริ่มลา           |
| end_date       | DATE                                                          | NOT NULL             | วันสิ้นสุดลา         |
| total_days     | DECIMAL(5,1)                                                  | NOT NULL             | จำนวนวัน             |
| time_slot      | ENUM('full','morning','afternoon')                            | DEFAULT 'full'       | ช่วงเวลา             |
| reason         | TEXT                                                          |                      | เหตุผล               |
| contact_address| TEXT                                                          |                      | ที่อยู่ระหว่างลา     |
| contact_phone  | VARCHAR(20)                                                   |                      | เบอร์โทรระหว่างลา    |
| status         | ENUM('pending','approved','rejected','confirmed','cancelled') | DEFAULT 'pending'    | สถานะ                |
| approved_by    | INT                                                           | FK → users.id        | ผู้อนุมัติ            |
| approved_at    | TIMESTAMP                                                     | NULL                 | เวลาอนุมัติ           |
| rejection_reason| TEXT                                                         |                      | เหตุผลที่ปฏิเสธ      |
| confirmed_by   | INT                                                           | FK → users.id        | ผู้ยืนยัน             |
| confirmed_at   | TIMESTAMP                                                     | NULL                 | เวลายืนยัน            |
| confirmed_note | TEXT                                                          |                      | หมายเหตุ              |
| cancelled_at   | TIMESTAMP                                                     | NULL                 | ⭐ เวลายกเลิก         |
| cancel_reason  | TEXT                                                          |                      | ⭐ เหตุผลยกเลิก       |

> **🔑 ปรับปรุง:**
> 1. เปลี่ยน `leave_type VARCHAR(50)` → `leave_type_id INT FK` เพื่อ referential integrity
> 2. เปลี่ยน `total_days FLOAT` → `DECIMAL(5,1)` เพื่อความแม่นยำ
> 3. เพิ่มสถานะ `cancelled` และ fields สำหรับการยกเลิก

---

### 7. `leave_attachments` - ไฟล์แนบ

| Column           | Type          | Constraint                 | Description          |
|-----------------|---------------|----------------------------|----------------------|
| id              | INT           | PK, AI                     | รหัส                 |
| leave_request_id| INT           | FK → leave_requests.id     | คำขอลาที่เกี่ยวข้อง  |
| file_name       | VARCHAR(255)  | NOT NULL                   | ชื่อไฟล์ (ใน server) |
| original_name   | VARCHAR(255)  |                            | ⭐ ชื่อไฟล์ต้นฉบับ   |
| file_path       | VARCHAR(500)  | NOT NULL                   | Path ไฟล์            |
| file_type       | VARCHAR(100)  |                            | MIME type             |
| file_size       | INT           |                            | ขนาดไฟล์ (bytes)     |

---

### 8. `holidays` - วันหยุด

| Column      | Type                                          | Constraint     | Description        |
|------------|-----------------------------------------------|----------------|--------------------|
| id         | INT                                           | PK, AI         | รหัส               |
| name       | VARCHAR(200)                                  | NOT NULL       | ชื่อวันหยุด        |
| date       | DATE                                          | NOT NULL, UQ   | วันที่             |
| year       | YEAR                                          |                | ⭐ ปี (สำหรับ filter)|
| type       | ENUM('national','special','compensatory')     | DEFAULT 'national' | ⭐ ประเภทวันหยุด |
| description| TEXT                                          |                | คำอธิบาย           |

---

### 9. `notifications` - การแจ้งเตือน

| Column            | Type                                                                              | Constraint           | Description         |
|-------------------|-----------------------------------------------------------------------------------|----------------------|---------------------|
| id                | INT                                                                               | PK, AI               | รหัส                |
| user_id           | INT                                                                               | FK → users.id        | ผู้รับแจ้งเตือน    |
| type              | ENUM('leave_request','approval','rejection','confirmation','new_leave','cancellation','reminder') |  NOT NULL | ประเภท   |
| title             | VARCHAR(255)                                                                      | NOT NULL             | หัวข้อ              |
| message           | TEXT                                                                              | NOT NULL             | ข้อความ             |
| related_leave_id  | INT                                                                               | FK → leave_requests.id | คำขอลาที่เกี่ยวข้อง|
| is_read           | BOOLEAN                                                                           | DEFAULT FALSE        | อ่านแล้วหรือยัง    |
| read_at           | TIMESTAMP                                                                         | NULL                 | ⭐ เวลาที่อ่าน     |

---

### 10. `leave_history` - Audit Trail ⭐ **ตารางใหม่**

| Column           | Type                                                             | Constraint              | Description               |
|-----------------|------------------------------------------------------------------|-------------------------|---------------------------|
| id              | INT                                                              | PK, AI                   | รหัส                      |
| leave_request_id| INT                                                              | FK → leave_requests.id  | คำขอลาที่เกี่ยวข้อง       |
| action          | ENUM('created','approved','rejected','confirmed','cancelled','edited') | NOT NULL         | การกระทำ                  |
| action_by       | INT                                                              | FK → users.id           | ผู้กระทำ                  |
| old_status      | VARCHAR(20)                                                      |                         | สถานะก่อนเปลี่ยน          |
| new_status      | VARCHAR(20)                                                      |                         | สถานะหลังเปลี่ยน          |
| note            | TEXT                                                             |                         | หมายเหตุ                  |

> **ประโยชน์:** ติดตามย้อนหลังได้ว่าใครทำอะไร เมื่อไหร่ — สำคัญสำหรับระบบราชการ

---

## 🔄 Workflow การลา

```
 ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
 │           │     │           │     │           │     │           │
 │  Created  │────►│  Pending  │────►│ Approved  │────►│ Confirmed │
 │ (พนักงาน)│     │ (รอหัวหน้า│     │ (หัวหน้า  │     │ (Admin    │
 │           │     │  พิจารณา) │     │  อนุมัติ) │     │  ยืนยัน)  │
 └───────────┘     └─────┬─────┘     └───────────┘     └───────────┘
                         │
                         │ ปฏิเสธ
                         ▼
                   ┌───────────┐
                   │ Rejected  │
                   │ (พร้อม    │
                   │  เหตุผล)  │
                   └───────────┘

              * สามารถ "ยกเลิก" (Cancelled) ได้ทุกขั้นตอน
```

---

## 📐 Relationships Summary

| Parent         | Child            | Cardinality | FK Column        | Action           |
|---------------|------------------|-------------|------------------|------------------|
| faculties     | departments      | 1:N         | faculty_id       | ON DELETE SET NULL|
| departments   | users            | 1:N         | department_id    | ON DELETE SET NULL|
| users         | users (self)     | 1:N         | supervisor_id    | ON DELETE SET NULL|
| users         | leave_balances   | 1:N         | user_id          | ON DELETE CASCADE |
| users         | leave_requests   | 1:N         | user_id          | ON DELETE CASCADE |
| users         | notifications    | 1:N         | user_id          | ON DELETE CASCADE |
| leave_types   | leave_balances   | 1:N         | leave_type_id    | ON DELETE CASCADE |
| leave_types   | leave_requests   | 1:N         | leave_type_id    | ON DELETE RESTRICT|
| leave_requests| leave_attachments| 1:N         | leave_request_id | ON DELETE CASCADE |
| leave_requests| leave_history    | 1:N         | leave_request_id | ON DELETE CASCADE |
| leave_requests| notifications    | 1:N         | related_leave_id | ON DELETE SET NULL|

---

## 📊 Indexes Strategy

### Performance Indexes
| Table           | Index                          | Purpose                         |
|----------------|--------------------------------|---------------------------------|
| users          | idx_email                      | Login lookup                    |
| users          | idx_employee_id                | Employee search                 |
| users          | idx_role                       | Filter by role                  |
| users          | idx_is_active                  | Active user filter              |
| leave_requests | idx_user_id                    | User's leave history            |
| leave_requests | idx_status                     | Dashboard pending count         |
| leave_requests | idx_dates                      | Calendar / date range queries   |
| leave_requests | idx_created_at                 | Recent requests sorting         |
| leave_balances | uk_user_type_year              | Unique + lookup                 |
| notifications  | idx_user_unread                | Composite: unread per user      |
| holidays       | uk_holiday_date                | Unique date + lookup            |

---

## 🆚 เปรียบเทียบ Schema เก่า vs ใหม่

| หัวข้อ                     | Schema V1 (เดิม)                    | Schema V2 (ใหม่)                         |
|---------------------------|-------------------------------------|------------------------------------------|
| **leave_balances**        | Denormalized (1 row = 1 user, หลาย columns) | ✅ Normalized (1 row = 1 user + 1 type + 1 year) |
| **เพิ่มประเภทลาใหม่**     | ❌ ต้อง ALTER TABLE                   | ✅ INSERT ใน leave_types ได้เลย            |
| **ติดตามรายปี**           | ❌ ไม่มี year tracking                | ✅ แยก balance ตามปี                       |
| **leave_type ใน requests**| VARCHAR (ไม่มี FK)                   | ✅ FK → leave_types.id                    |
| **total_days**            | FLOAT (ปัดเศษไม่แม่น)               | ✅ DECIMAL(5,1) แม่นยำ                    |
| **Audit Trail**           | ❌ ไม่มี                              | ✅ ตาราง leave_history                     |
| **Soft Delete**           | ❌ DELETE จริง                        | ✅ is_active flag                          |
| **การยกเลิกลา**          | ❌ ไม่รองรับ                          | ✅ status='cancelled' + fields             |
| **วันหยุด**               | ไม่มี type/year                      | ✅ type ENUM + year column                 |
| **Notifications**         | ไม่มี read_at                        | ✅ read_at timestamp                       |
| **ไฟล์แนบ**               | ไม่มี original_name                  | ✅ original_name สำหรับชื่อไฟล์ไทย         |

---

## 💡 การคำนวณวันลาคงเหลือ

```sql
-- วันลาคงเหลือ = total_days + carried_over_days - used_days
SELECT
  u.first_name,
  u.last_name,
  lt.name AS leave_type_name,
  lb.total_days,
  lb.carried_over_days,
  lb.used_days,
  (lb.total_days + lb.carried_over_days - lb.used_days) AS remaining_days
FROM leave_balances lb
JOIN users u ON u.id = lb.user_id
JOIN leave_types lt ON lt.id = lb.leave_type_id
WHERE lb.year = YEAR(CURDATE())
  AND u.id = ?;
```

---

## 📁 ไฟล์ที่เกี่ยวข้อง

| ไฟล์                                  | Description                       |
|---------------------------------------|-----------------------------------|
| `server/database/schema_v2.sql`       | SQL Schema ใหม่                   |
| `server/database/schema.sql`          | SQL Schema เดิม (V1)             |
| `server/models/*.js`                  | Sequelize Models (ต้องอัปเดต)     |
| `server/models/index.js`             | Model Associations                |
| `server/config/database.js`          | Database connection config        |
