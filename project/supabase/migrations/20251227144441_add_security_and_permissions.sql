/*
  # Add Security and Permission Fields

  1. Changes
    - Add permission fields to users table for department management
    - Add confidentiality_level to tasks for NCAR compliance
    - Add security clearance level to users
  
  2. Security
    - Tasks will be filtered by confidentiality level based on user clearance
    - Only users with site_department_manager or can_manage_dept_tasks can view department tasks
  
  3. Notes
    - Confidentiality levels: unclassified, internal, confidential, secret, top_secret
    - User clearance levels match confidentiality levels
*/

-- Add permission columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'site_department_manager'
  ) THEN
    ALTER TABLE users ADD COLUMN site_department_manager boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'can_manage_dept_tasks'
  ) THEN
    ALTER TABLE users ADD COLUMN can_manage_dept_tasks boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'security_clearance'
  ) THEN
    ALTER TABLE users ADD COLUMN security_clearance text DEFAULT 'internal';
  END IF;
END $$;

-- Add confidentiality_level to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'confidentiality_level'
  ) THEN
    ALTER TABLE tasks ADD COLUMN confidentiality_level text DEFAULT 'internal';
  END IF;
END $$;

-- Update existing tasks to have appropriate confidentiality levels
UPDATE tasks SET confidentiality_level = 'internal' WHERE confidentiality_level IS NULL;

-- Set some sample permissions for testing
UPDATE users SET 
  site_department_manager = true,
  can_manage_dept_tasks = true,
  security_clearance = 'secret'
WHERE role = 'admin';
