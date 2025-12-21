-- ============================================
-- Create Admin User for Testing
-- Run this in phpMyAdmin after importing schema.sql
-- ============================================

-- First, check if admin already exists
SELECT * FROM users WHERE email = 'admin@bru.ac.th';

-- If no admin exists, create one
-- Password: admin123
-- This hash was generated using bcrypt with salt rounds = 10

INSERT INTO users (employee_id, email, password, first_name, last_name, department_id, position, role) 
VALUES (
  'ADMIN001', 
  'admin@bru.ac.th', 
  '$2a$10$YourActualBcryptHashHere', -- ⚠️ This needs to be replaced with actual hash
  'Admin', 
  'System', 
  1, 
  'ผู้ดูแลระบบ', 
  'admin'
);

-- Create leave balance for admin (get the user_id that was just created)
INSERT INTO leave_balances (user_id, sick, personal, vacation, maternity, paternity, childcare, ordination, military)
VALUES (LAST_INSERT_ID(), 60, 45, 10, 90, 15, 150, 120, 60);

-- ============================================
-- IMPORTANT: Password Hashing
-- ============================================
-- The password hash above is a placeholder.
-- You need to generate the actual bcrypt hash.
-- 
-- Option 1: Use online bcrypt generator
-- Go to: https://bcrypt-generator.com/
-- Input: admin123
-- Rounds: 10
-- Copy the hash and replace above
--
-- Option 2: Use Node.js script (create hash.js):
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('admin123', 10);
-- console.log(hash);
-- Run: node hash.js
-- ============================================
