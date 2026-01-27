-- Migration to add user profile fields
-- Run this in your MySQL database

-- Add new columns for government/organization info
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS government_division VARCHAR(255) NULL COMMENT 'ส่วนราชการ',
ADD COLUMN IF NOT EXISTS document_number VARCHAR(100) NULL COMMENT 'ที่ (เลขหนังสือ เช่น อว 0624.2/)',
ADD COLUMN IF NOT EXISTS unit VARCHAR(255) NULL COMMENT 'หน่วยงาน', 
ADD COLUMN IF NOT EXISTS affiliation VARCHAR(255) NULL COMMENT 'สังกัด (คณะ)';

-- Done!
SELECT 'User profile fields added successfully!' as message;
