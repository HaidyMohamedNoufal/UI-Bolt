/*
  # Add Edit Offline (Checkout) System to Files

  ## Overview
  This migration adds Alfresco-style "Edit Offline" functionality, allowing users to check out
  files for offline editing. When checked out, files are locked to prevent concurrent modifications.

  ## Changes to `files` Table
  
  ### New Columns:
  - `checked_out` (boolean) - Whether the file is currently checked out
  - `checked_out_by` (uuid, foreign key to users) - User who has the file checked out
  - `checked_out_at` (timestamptz) - When the file was checked out
  - `checkout_notes` (text) - Optional notes about why the file was checked out
  - `version_number` (integer) - Version tracking for the file
  
  ## Checkout Workflow:
  
  1. **Check Out (Edit Offline)**:
     - User downloads the file
     - File is locked (checked_out = true)
     - Other users can view but cannot edit
  
  2. **Check In**:
     - User uploads new version
     - File is unlocked (checked_out = false)
     - Version number increments
  
  3. **Cancel Checkout**:
     - File is unlocked without changes
     - No version change
  
  ## Security:
  - Only the user who checked out a file can check it back in or cancel checkout
  - Managers can force cancel checkout if needed (using can_manage_dept_tasks or site_department_manager)
  - Users cannot modify checked-out files unless they own the checkout
*/

-- Add checkout fields to files table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'checked_out'
  ) THEN
    ALTER TABLE files ADD COLUMN checked_out boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'checked_out_by'
  ) THEN
    ALTER TABLE files ADD COLUMN checked_out_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'checked_out_at'
  ) THEN
    ALTER TABLE files ADD COLUMN checked_out_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'checkout_notes'
  ) THEN
    ALTER TABLE files ADD COLUMN checkout_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'version_number'
  ) THEN
    ALTER TABLE files ADD COLUMN version_number integer DEFAULT 1;
  END IF;
END $$;

-- Create index for checkout queries
CREATE INDEX IF NOT EXISTS idx_files_checked_out ON files(checked_out) WHERE checked_out = true;
CREATE INDEX IF NOT EXISTS idx_files_checked_out_by ON files(checked_out_by);

-- Add RLS policy: Prevent modifications to checked-out files by others
CREATE POLICY "Prevent edit of checked-out files by non-owners"
  ON files
  FOR UPDATE
  TO authenticated
  USING (
    NOT checked_out OR 
    checked_out_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN department_members dm ON dm.user_id = u.id
      WHERE u.id = auth.uid()
      AND dm.department_id = files.department_id
      AND (u.site_department_manager = true OR u.can_manage_dept_tasks = true)
    )
  );
