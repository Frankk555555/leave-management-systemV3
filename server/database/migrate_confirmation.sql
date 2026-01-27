-- Migration to add 'confirmed' status to leave_requests
-- Run this in your MySQL database

-- Step 1: Update leave_requests status ENUM
ALTER TABLE leave_requests 
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'confirmed') DEFAULT 'pending';

-- Step 2: Add new columns for confirmation tracking
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS confirmed_by INT NULL,
ADD COLUMN IF NOT EXISTS confirmed_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS confirmed_note TEXT NULL;

-- Step 3: Update notifications type ENUM
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('leave_request', 'approval', 'rejection', 'confirmation', 'new_leave') NOT NULL;

-- Done!
SELECT 'Migration completed successfully!' as message;
