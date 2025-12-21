# 🐬 MySQL Database Setup Guide

## Prerequisites

- MySQL Server 5.7+ or 8.0+ installed
- phpMyAdmin (already available on university server)
- Node.js 14+ and npm

---

## Step 1: Create Database using phpMyAdmin

### Option A: Run SQL File (Recommended)

1. Open **phpMyAdmin** in your browser
2. Click on **"New"** or select an existing database
3. Go to the **"SQL"** tab
4. Copy the entire content from `server/database/schema.sql`
5. Paste into the SQL text area
6. Click **"Go"** to execute
7. ✅ Database `leave_management` with 7 tables will be created

### Option B: Manual Creation

If you prefer to create tables manually:

1. Create a new database named `leave_management`
2. Set charset to `utf8mb4`
3. Import the SQL file or create tables one by one

---

## Step 2: Configure Environment Variables

1. Navigate to `server` folder
2. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` file with your MySQL credentials:

   ```env
   # MySQL Database Configuration
   DB_HOST=localhost          # Your MySQL host
   DB_PORT=3306              # MySQL port (default: 3306)
   DB_NAME=leave_management  # Database name
   DB_USER=root              # Your MySQL username
   DB_PASSWORD=              # Your MySQL password (if any)

   # JWT Secret (change this!)
   JWT_SECRET=your-super-secret-jwt-key-change-this

   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Important:** Change `JWT_SECRET` to a random string for security

---

## Step 3: Create Admin User

After creating the database, you need to create the first admin user.

### Method 1: Using SQL (phpMyAdmin)

1. Open **phpMyAdmin**
2. Select `leave_management` database
3. Go to **SQL** tab
4. Run this SQL to create admin with password `admin123`:

```sql
-- Hash password first (use bcrypt online tool or Node.js)
-- Password: admin123
-- Hashed: $2a$10$XOPbrlUPQdwdJUpSrIF6X.LTR3RXsLy5rrvzRXE3.nJYSXX6Z0lK6

INSERT INTO users (employee_id, email, password, first_name, last_name, department_id, position, role)
VALUES ('ADMIN001', 'admin@bru.ac.th', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LTR3RXsLy5rrvzRXE3.nJYSXX6Z0lK6', 'Admin', 'System', 1, 'ผู้ดูแลระบบ', 'admin');

-- Get the user ID (usually 1 for first user)
INSERT INTO leave_balances (user_id, sick, personal, vacation, maternity, paternity, childcare, ordination, military)
VALUES (1, 60, 45, 10, 90, 15, 150, 120, 60);
```

### Method 2: Using Registration API

Once the server is running, you can register via API:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "employeeId": "ADMIN001",
  "email": "admin@bru.ac.th",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "System",
  "position": "ผู้ดูแลระบบ",
  "role": "admin",
  "departmentId": 1
}
```

---

## Step 4: Install Dependencies

```bash
cd server
npm install
```

This will install:

- ✅ `mysql2` - MySQL driver
- ✅ `sequelize` - SQL ORM
- ✅ All other dependencies

---

## Step 5: Test Database Connection

Run the server:

```bash
npm run dev
```

You should see:

```
✅ MySQL connection established successfully
Server running on port 5000
```

If you see errors:

- ❌ **"Access denied"**: Check DB_USER and DB_PASSWORD in `.env`
- ❌ **"Unknown database"**: Database not created, go back to Step 1
- ❌ **"Cannot connect"**: Check if MySQL server is running

---

## Step 6: Verify Tables

In phpMyAdmin, you should see these 7 tables:

1. ✅ `departments`
2. ✅ `users`
3. ✅ `leave_balances`
4. ✅ `leave_types`
5. ✅ `leave_requests`
6. ✅ `leave_attachments`
7. ✅ `holidays`

---

## Step 7: Seed Initial Data (Optional)

If tables are empty, you can insert default data:

```sql
-- Insert default departments
INSERT INTO departments (name, code) VALUES
('สำนักงานอธิการบดี', 'ADMIN'),
('คณะครุศาสตร์', 'EDU'),
('คณะมนุษยศาสตร์และสังคมศาสตร์', 'HUM'),
('คณะวิทยาศาสตร์', 'SCI'),
('คณะวิทยาการจัดการ', 'MNG');

-- Insert default leave types
INSERT INTO leave_types (name, code, description, default_days, requires_medical_cert) VALUES
('ลาป่วย', 'sick', 'ลาป่วยเนื่องจากเจ็บป่วย', 60, TRUE),
('ลากิจส่วนตัว', 'personal', 'ลากิจส่วนตัว', 45, FALSE),
('ลาพักผ่อน', 'vacation', 'ลาพักผ่อนประจำปี', 10, FALSE),
('ลาคลอดบุตร', 'maternity', 'ลาคลอดบุตรสำหรับพนักงานหญิง', 90, FALSE),
('ลาช่วยภรรยาคลอด', 'paternity', 'ลาช่วยภรรยาคลอดสำหรับพนักงานชาย', 15, FALSE),
('ลาเลี้ยงดูบุตร', 'childcare', 'ลาเลี้ยงดูบุตร', 150, FALSE),
('ลาอุปสมบท/ฮัจย์', 'ordination', 'ลาอุปสมบทหรือประกอบพิธีฮัจย์', 120, FALSE),
('ลาตรวจเลือก', 'military', 'ลาตรวจเลือกเข้ารับราชการทหาร', 60, FALSE);
```

---

## Common Issues & Solutions

### Issue: "Unknown database 'leave_management'"

**Solution:** Create the database first in phpMyAdmin

### Issue: "Access denied for user"

**Solution:** Check MySQL username/password in `.env`

### Issue: "Cannot find module 'mysql2'"

**Solution:** Run `npm install` in server folder

### Issue: "Port 5000 already in use"

**Solution:** Change PORT in `.env` to another port (e.g., 5001)

---

## Testing the Migration

### 1. Test Login

```bash
POST http://localhost:5000/api/auth/login
{
  "email": "admin@bru.ac.th",
  "password": "admin123"
}
```

### 2. Test Create User

Login to frontend as admin, go to User Management

### 3. Test Leave Request

Login as employee, create a leave request

---

## Production Deployment

When deploying to production:

1. **Update `.env`:**

   ```env
   NODE_ENV=production
   DB_HOST=your-production-mysql-host
   DB_NAME=leave_management
   DB_USER=your-production-user
   DB_PASSWORD=your-strong-password
   JWT_SECRET=your-very-long-random-secret
   ```

2. **Security:**

   - Use strong DB password
   - Enable SSL for MySQL connection
   - Set proper CORS settings

3. **Backup:**
   - Regular database backups using phpMyAdmin export
   - Or use `mysqldump` command

---

## Migration Complete! ✅

Your Leave Management System is now running on **MySQL** instead of MongoDB.

All features should work the same:

- ✅ Authentication
- ✅ Leave Requests
- ✅ Approvals
- ✅ Reports
- ✅ User Management
- ✅ PDF Generation

Need help? Check the logs or contact the developer.
