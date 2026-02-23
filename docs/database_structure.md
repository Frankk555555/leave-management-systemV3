# โครงสร้างตารางฐานข้อมูล - ระบบบริหารการลา V2

## 1. ตาราง faculties (คณะ / สำนัก / สถาบัน)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SMALLINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขประจำตัวคณะ |
| name | VARCHAR(100) | NOT NULL | ชื่อคณะ/สำนัก |
| code | VARCHAR(20) | NOT NULL, UNIQUE | รหัสคณะ (เช่น EDU, SCI) |
| type | ENUM('faculty','office','institute') | DEFAULT 'faculty' | ประเภท: คณะ/สำนัก/สถาบัน |
| is_active | TINYINT(1) | DEFAULT 1 | สถานะใช้งาน |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

---

## 2. ตาราง departments (สาขาวิชา / หน่วยงาน)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SMALLINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขประจำตัวสาขา/แผนก |
| faculty_id | SMALLINT UNSIGNED | FOREIGN KEY → faculties(id) | รหัสคณะที่สังกัด |
| name | VARCHAR(100) | NOT NULL | ชื่อสาขา/แผนก |
| code | VARCHAR(20) | NOT NULL, UNIQUE | รหัสสาขา/แผนก |
| is_active | TINYINT(1) | DEFAULT 1 | สถานะใช้งาน |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

---

## 3. ตาราง users (ผู้ใช้งาน / บุคลากร)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขประจำตัวผู้ใช้ |
| employee_id | VARCHAR(20) | NOT NULL, UNIQUE | รหัสพนักงาน |
| email | VARCHAR(80) | NOT NULL, UNIQUE | อีเมล |
| password | CHAR(60) | NOT NULL | รหัสผ่าน (bcrypt hash 60 chars) |
| first_name | VARCHAR(50) | | ชื่อ |
| last_name | VARCHAR(50) | | นามสกุล |
| department_id | SMALLINT UNSIGNED | FOREIGN KEY → departments(id) | รหัสสาขา/แผนกที่สังกัด |
| position | VARCHAR(80) | | ตำแหน่ง |
| role | ENUM('employee','head','admin') | DEFAULT 'employee' | บทบาท: พนักงาน/หัวหน้า/ผู้ดูแล |
| supervisor_id | INT UNSIGNED | FOREIGN KEY → users(id) | รหัสหัวหน้างาน (Self-ref FK) |
| phone | VARCHAR(15) | | เบอร์โทรศัพท์ |
| profile_image | VARCHAR(150) | | เส้นทางรูปโปรไฟล์ |
| start_date | DATE | | วันที่เริ่มรับราชการ |
| government_division | VARCHAR(100) | | ส่วนราชการ |
| document_number | VARCHAR(50) | | ที่ (เลขหนังสือ) |
| unit | VARCHAR(100) | | หน่วยงาน |
| affiliation | VARCHAR(100) | | สังกัด (คณะ) |
| is_active | TINYINT(1) | DEFAULT 1 | สถานะใช้งาน (Soft delete) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

---

## 4. ตาราง leave_types (ประเภทการลา)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | TINYINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขประเภทลา |
| name | VARCHAR(60) | NOT NULL | ชื่อประเภทลา (เช่น ลาป่วย) |
| code | VARCHAR(20) | NOT NULL, UNIQUE | รหัสประเภทลา (เช่น sick) |
| description | VARCHAR(200) | | คำอธิบายประเภทลา |
| default_days | SMALLINT UNSIGNED | NOT NULL, DEFAULT 0 | จำนวนวันลาสูงสุดต่อปี (0=ไม่จำกัด) |
| requires_medical_cert | TINYINT(1) | DEFAULT 0 | ต้องแนบใบรับรองแพทย์หรือไม่ |
| is_active | TINYINT(1) | DEFAULT 1 | สถานะใช้งาน |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

---

## 5. ตาราง leave_balances (ยอดวันลาคงเหลือ)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขรายการ |
| user_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → users(id) | รหัสผู้ใช้ |
| leave_type_id | TINYINT UNSIGNED | NOT NULL, FOREIGN KEY → leave_types(id) | รหัสประเภทลา |
| year | YEAR | NOT NULL | ปีงบประมาณ |
| total_days | DECIMAL(4,1) | NOT NULL, DEFAULT 0 | จำนวนวันลาทั้งหมดที่ได้รับ |
| used_days | DECIMAL(4,1) | NOT NULL, DEFAULT 0 | จำนวนวันลาที่ใช้ไปแล้ว |
| carried_over_days | DECIMAL(4,1) | NOT NULL, DEFAULT 0 | จำนวนวันลาสะสมจากปีก่อน |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

> **UNIQUE KEY:** uk_user_type_year (user_id, leave_type_id, year) — ป้องกันข้อมูลซ้ำ 1 คน + 1 ประเภทลา + 1 ปี = 1 แถว

---

## 6. ตาราง leave_requests (คำขอลา)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขคำขอลา |
| user_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → users(id) | รหัสผู้ยื่นคำขอ |
| leave_type_id | TINYINT UNSIGNED | NOT NULL, FOREIGN KEY → leave_types(id) | รหัสประเภทลา |
| start_date | DATE | NOT NULL | วันที่เริ่มลา |
| end_date | DATE | NOT NULL | วันที่สิ้นสุดลา |
| total_days | DECIMAL(4,1) | NOT NULL | จำนวนวันลา (รองรับครึ่งวัน 0.5) |
| time_slot | ENUM('full','morning','afternoon') | DEFAULT 'full' | ช่วงเวลา: เต็มวัน/ครึ่งเช้า/ครึ่งบ่าย |
| reason | VARCHAR(500) | | เหตุผลการลา |
| contact_address | VARCHAR(300) | | ที่อยู่ระหว่างลา |
| contact_phone | VARCHAR(15) | | เบอร์โทรระหว่างลา |
| status | ENUM('pending','approved','rejected','confirmed','cancelled') | DEFAULT 'pending' | สถานะคำขอลา |
| approved_by | INT UNSIGNED | FOREIGN KEY → users(id) | รหัสผู้อนุมัติ (head) |
| approved_at | TIMESTAMP | NULL | วันที่อนุมัติ |
| rejection_reason | VARCHAR(500) | | เหตุผลที่ปฏิเสธ |
| confirmed_by | INT UNSIGNED | FOREIGN KEY → users(id) | รหัสผู้ยืนยัน (admin) |
| confirmed_at | TIMESTAMP | NULL | วันที่ยืนยัน |
| confirmed_note | VARCHAR(500) | | หมายเหตุการยืนยัน |
| cancelled_at | TIMESTAMP | NULL | วันที่ยกเลิก |
| cancel_reason | VARCHAR(500) | | เหตุผลการยกเลิก |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

---

## 7. ตาราง leave_attachments (ไฟล์แนบคำขอลา)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขไฟล์แนบ |
| leave_request_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → leave_requests(id) | รหัสคำขอลาที่แนบ |
| file_name | VARCHAR(100) | NOT NULL | ชื่อไฟล์ที่เก็บในระบบ |
| original_name | VARCHAR(150) | | ชื่อไฟล์ต้นฉบับ |
| file_path | VARCHAR(255) | NOT NULL | เส้นทางไฟล์ |
| file_type | VARCHAR(50) | | ประเภทไฟล์ (MIME type) |
| file_size | INT UNSIGNED | | ขนาดไฟล์ (bytes) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |

---

## 8. ตาราง holidays (วันหยุดราชการ)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SMALLINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขวันหยุด |
| name | VARCHAR(120) | NOT NULL | ชื่อวันหยุด |
| date | DATE | NOT NULL, UNIQUE | วันที่หยุด |
| year | YEAR | | ปีของวันหยุด |
| type | ENUM('national','special','compensatory') | DEFAULT 'national' | ประเภท: ราชการ/พิเศษ/วันชดเชย |
| description | VARCHAR(255) | | คำอธิบาย |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

---

## 9. ตาราง notifications (การแจ้งเตือน)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขการแจ้งเตือน |
| user_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → users(id) | รหัสผู้รับแจ้งเตือน |
| type | ENUM('leave_request','approval','rejection','confirmation','new_leave','cancellation','reminder') | NOT NULL | ประเภทแจ้งเตือน |
| title | VARCHAR(100) | NOT NULL | หัวข้อแจ้งเตือน |
| message | VARCHAR(500) | NOT NULL | ข้อความแจ้งเตือน |
| related_leave_id | INT UNSIGNED | FOREIGN KEY → leave_requests(id) | รหัสคำขอลาที่เกี่ยวข้อง |
| is_read | TINYINT(1) | DEFAULT 0 | สถานะอ่านแล้ว |
| read_at | TIMESTAMP | NULL | เวลาที่อ่าน |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

---

## 10. ตาราง leave_history (ประวัติการเปลี่ยนแปลง - Audit Trail)

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | หมายเลขประวัติ |
| leave_request_id | INT UNSIGNED | NOT NULL, FOREIGN KEY → leave_requests(id) | รหัสคำขอลา |
| action | ENUM('created','approved','rejected','confirmed','cancelled','edited') | NOT NULL | การกระทำ |
| action_by | INT UNSIGNED | FOREIGN KEY → users(id) | รหัสผู้กระทำ |
| old_status | ENUM('pending','approved','rejected','confirmed','cancelled') | | สถานะเดิม |
| new_status | ENUM('pending','approved','rejected','confirmed','cancelled') | | สถานะใหม่ |
| note | VARCHAR(500) | | หมายเหตุเพิ่มเติม |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | วันที่บันทึก |

---

## ความสัมพันธ์ระหว่างตาราง (Relationships)

```
faculties ──1:N──► departments ──1:N──► users
                                         │
                                         ├──1:N──► leave_balances ◄──N:1── leave_types
                                         │
                                         ├──1:N──► leave_requests ◄──N:1── leave_types
                                         │              │
                                         │              ├──1:N──► leave_attachments
                                         │              ├──1:N──► leave_history
                                         │              └──1:N──► notifications
                                         │
                                         └── supervisor_id (Self-referencing FK)
```
