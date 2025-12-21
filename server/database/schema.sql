-- ========================================
-- Leave Management System - MySQL Schema
-- ========================================

-- Create database (run this first in phpMyAdmin)
CREATE DATABASE IF NOT EXISTS leave_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE leave_management;

-- ========================================
-- 1. Departments Table
-- ========================================
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================
-- 2. Users Table
-- ========================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  department_id INT,
  position VARCHAR(100),
  role ENUM('employee', 'head', 'admin') DEFAULT 'employee',
  supervisor_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_employee_id (employee_id),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- ========================================
-- 3. Leave Balances Table
-- ========================================
CREATE TABLE leave_balances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  sick INT DEFAULT 60,
  personal INT DEFAULT 45,
  vacation INT DEFAULT 10,
  maternity INT DEFAULT 90,
  paternity INT DEFAULT 15,
  childcare INT DEFAULT 150,
  ordination INT DEFAULT 120,
  military INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================
-- 4. Leave Types Table
-- ========================================
CREATE TABLE leave_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  default_days INT,
  requires_medical_cert BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB;

-- ========================================
-- 5. Leave Requests Table
-- ========================================
CREATE TABLE leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT,
  contact_address TEXT,
  contact_phone VARCHAR(20),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_leave_type (leave_type),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB;

-- ========================================
-- 6. Leave Attachments Table
-- ========================================
CREATE TABLE leave_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leave_request_id INT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
  INDEX idx_leave_request_id (leave_request_id)
) ENGINE=InnoDB;

-- ========================================
-- 7. Holidays Table
-- ========================================
CREATE TABLE holidays (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date)
) ENGINE=InnoDB;

-- ========================================
-- 8. Notifications Table
-- ========================================
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('leave_request', 'approval', 'rejection') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_leave_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_leave_id) REFERENCES leave_requests(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB;

-- ========================================
-- Seed Data: Default Leave Types
-- ========================================
INSERT INTO leave_types (name, code, description, default_days, requires_medical_cert) VALUES
('ลาป่วย', 'sick', 'ลาป่วยเนื่องจากเจ็บป่วย', 60, TRUE),
('ลากิจส่วนตัว', 'personal', 'ลากิจส่วนตัว', 45, FALSE),
('ลาพักผ่อน', 'vacation', 'ลาพักผ่อนประจำปี', 10, FALSE),
('ลาคลอดบุตร', 'maternity', 'ลาคลอดบุตรสำหรับพนักงานหญิง', 90, FALSE),
('ลาช่วยภรรยาคลอด', 'paternity', 'ลาช่วยภรรยาคลอดสำหรับพนักงานชาย', 15, FALSE),
('ลาเลี้ยงดูบุตร', 'childcare', 'ลาเลี้ยงดูบุตร', 150, FALSE),
('ลาอุปสมบท/ฮัจย์', 'ordination', 'ลาอุปสมบทหรือประกอบพิธีฮัจย์', 120, FALSE),
('ลาตรวจเลือก', 'military', 'ลาตรวจเลือกเข้ารับราชการทหาร', 60, FALSE);

-- ========================================
-- Seed Data: Default Department
-- ========================================
INSERT INTO departments (name, code) VALUES
('สำนักงานอธิการบดี', 'ADMIN'),
('คณะครุศาสตร์', 'EDU'),
('คณะมนุษยศาสตร์และสังคมศาสตร์', 'HUM'),
('คณะวิทยาศาสตร์', 'SCI'),
('คณะวิทยาการจัดการ', 'MNG');


-- Note: You need to hash the password properly before inserting
-- Use: const bcrypt = require('bcryptjs'); bcrypt.hashSync('admin123', 10);

-- ========================================
-- Create Leave Balance for Admin User
-- ========================================
INSERT INTO leave_balances (user_id, sick, personal, vacation, maternity, paternity, childcare, ordination, military)
VALUES (1, 60, 45, 10, 90, 15, 150, 120, 60);

-- ========================================
-- END OF SCHEMA
-- ========================================
