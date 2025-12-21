# ระบบบริหารการลา (Leave Management System) V3

ระบบจัดการวันลาสำหรับองค์กร พัฒนาด้วย **React + Express + MySQL (Sequelize ORM)**

> 🆕 **V3 Updates:** เปลี่ยนจาก MongoDB เป็น MySQL, ปรับปรุง UI, รองรับภาษาไทยครบถ้วน

## 📋 ความต้องการระบบ

- **Node.js** v18+ ([ดาวน์โหลด](https://nodejs.org/))
- **MySQL** 8.0+ ([ดาวน์โหลด](https://dev.mysql.com/downloads/mysql/)) หรือใช้ XAMPP/WAMP
- **Git** ([ดาวน์โหลด](https://git-scm.com/))

---

## 🚀 ขั้นตอนการติดตั้ง

### 1. Clone โปรเจค

```bash
git clone https://github.com/Frankk555555/leave-management-systemV3.git
cd leave-management-systemV3
```

### 2. ติดตั้ง Dependencies

```bash
# ติดตั้ง Backend
cd server
npm install

# ติดตั้ง Frontend
cd ../client
npm install
```

### 3. ตั้งค่าฐานข้อมูล MySQL

#### 3.1 สร้างฐานข้อมูล

```sql
CREATE DATABASE leave_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3.2 Import Schema

```bash
mysql -u root -p leave_management < server/database/schema.sql
```

หรือใช้ phpMyAdmin นำเข้าไฟล์ `server/database/schema.sql`

### 4. ตั้งค่า Environment Variables

#### Backend (server/.env)

สร้างไฟล์ `server/.env`:

```env
# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=leave_management
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Secret - สร้างค่าสุ่มเอง
JWT_SECRET=your-super-secret-key-here

# Server Port
PORT=5000

# Email (สำหรับแจ้งเตือน) - ใช้ Gmail App Password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# N8N API Key (สำหรับ Weekly Report)
N8N_API_KEY=your-n8n-api-key
```

### 5. สร้าง Admin Account

```bash
cd server
mysql -u root -p leave_management < database/create_admin.sql
```

หรือใช้ phpMyAdmin นำเข้าไฟล์ `server/database/create_admin.sql`

**Admin Login:**

- Email: `admin@company.com`
- Password: `123456`

### 6. รันระบบ

```bash
# Terminal 1 - รัน Backend
cd server
npm run dev

# Terminal 2 - รัน Frontend
cd client
npm run dev
```

### 7. เปิดใช้งาน

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## � โครงสร้างโปรเจค

```
leave-management-systemV3/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React Context (Auth)
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Express Backend
│   ├── config/             # Database config
│   ├── controllers/        # Route controllers
│   ├── database/           # SQL schema & seeds
│   ├── fonts/              # Thai fonts for PDF
│   ├── middleware/         # Auth & upload middleware
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts
│   ├── services/           # Business logic
│   └── package.json
├── docs/                   # Documentation & diagrams
└── README.md
```

---

## 🔑 ฟีเจอร์หลัก

- ✅ ยื่นคำขอลา 8 ประเภท (ลาป่วย, ลากิจ, พักร้อน, ฯลฯ)
- ✅ รองรับลาครึ่งวัน (เช้า/บ่าย)
- ✅ อนุมัติ/ปฏิเสธคำขอ (หัวหน้า/Admin)
- ✅ แนบไฟล์หลักฐาน (รองรับชื่อไฟล์ภาษาไทย)
- ✅ แจ้งเตือนในระบบ + Email อัตโนมัติ
- ✅ รายงานสถิติ + Export Excel/PDF (รองรับภาษาไทย)
- ✅ ปฏิทินทีม
- ✅ จัดการวันหยุด
- ✅ Weekly Report อัตโนมัติ (n8n)

---

## 🗃️ ฐานข้อมูล MySQL

### ตารางหลัก

| ตาราง               | คำอธิบาย        |
| ------------------- | --------------- |
| `users`             | ข้อมูลผู้ใช้งาน |
| `departments`       | แผนก            |
| `leave_types`       | ประเภทการลา     |
| `leave_requests`    | คำขอลา          |
| `leave_attachments` | ไฟล์แนบ         |
| `leave_balances`    | ยอดวันลาคงเหลือ |
| `holidays`          | วันหยุดประจำปี  |
| `notifications`     | การแจ้งเตือน    |

---

## 📧 ตั้งค่า Email (Gmail)

1. เปิด [Google Account Security](https://myaccount.google.com/security)
2. เปิด **2-Step Verification**
3. ไปที่ **App passwords**
4. สร้าง App password สำหรับ "Mail"
5. นำ password ที่ได้ไปใส่ใน `EMAIL_PASS`

---

## ❓ ปัญหาที่พบบ่อย

### MySQL Connection Error

- ตรวจสอบ MySQL service กำลังทำงาน
- ตรวจสอบ username/password ใน `.env`
- ตรวจสอบชื่อฐานข้อมูลถูกต้อง

### ภาษาไทยแสดงผิดเพี้ยน

- ตรวจสอบ Database ใช้ charset `utf8mb4`
- ตรวจสอบ collation เป็น `utf8mb4_unicode_ci`

### Email ไม่ส่ง

- ตรวจสอบ App Password ถูกต้อง
- ต้องเปิด 2-Step Verification ก่อน

### Port ถูกใช้งานอยู่แล้ว

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

---

## 📄 License

MIT License

---

## 👨‍💻 พัฒนาโดย

ระบบจัดการวันลา เวอร์ชัน 3.0 - MySQL Edition
