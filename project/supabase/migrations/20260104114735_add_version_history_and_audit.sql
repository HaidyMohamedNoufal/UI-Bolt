/*
  # Add Version History and Audit Logging System

  ## Overview
  This migration adds comprehensive version history tracking and audit logging for document updates.
  It enables users to upload new versions of documents while maintaining a complete version chain,
  preserving metadata, and logging all actions for compliance.

  ## New Tables
  
  ### `file_versions` Table
  Stores complete version history for all files:
  - `id` (uuid, primary key) - Unique identifier for this version record
  - `file_id` (uuid, foreign key to files) - Reference to the parent file
  - `version_number` (integer) - Version number (incremental)
  - `version_type` (text) - Type of version: 'major' or 'minor'
  - `file_url` (text) - URL/path to the versioned file content
  - `file_size` (bigint) - Size of this version in bytes
  - `uploaded_by` (uuid, foreign key to users) - User who uploaded this version
  - `uploaded_at` (timestamptz) - When this version was created
  - `change_notes` (text) - Optional notes about what changed in this version
  - `metadata` (jsonb) - Snapshot of file metadata at version creation time
  
  ### `audit_log` Table
  Comprehensive audit trail for all document operations:
  - `id` (uuid, primary key) - Unique identifier for audit entry
  - `entity_type` (text) - Type of entity: 'file', 'folder', 'user', etc.
  - `entity_id` (uuid) - ID of the affected entity
  - `action` (text) - Action performed: 'created', 'updated', 'deleted', 'version_uploaded', 'checked_out', 'checked_in', etc.
  - `user_id` (uuid, foreign key to users) - User who performed the action
  - `department_id` (uuid, foreign key to departments) - Department context
  - `details` (jsonb) - Additional details about the action
  - `ip_address` (text) - IP address of the user (for security)
  - `created_at` (timestamptz) - When the action occurred

  ## Version Logic
  
  ### Version Types:
  - **Minor Version**: Incremental updates (e.g., 1.1, 1.2, 1.3)
  - **Major Version**: Significant changes (e.g., 2.0, 3.0)
  
  ### Version Workflow:
  1. User uploads new version via "Upload New Version" action
  2. System validates permissions and locks
  3. Previous version is saved to `file_versions` table
  4. File record is updated with new content and incremented version
  5. Audit log entry is created
  6. User sees success message and refreshed details

  ## Security
  - RLS enabled on both tables
  - Users can only view versions of files they have access to
  - Only file owners and managers can create versions
  - Audit logs are read-only for regular users
  - Only admins and managers can view full audit logs
*/

-- Create file_versions table
CREATE TABLE IF NOT EXISTS file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  version_type text NOT NULL CHECK (version_type IN ('major', 'minor')),
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  change_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for file_versions
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_uploaded_by ON file_versions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_versions_uploaded_at ON file_versions(uploaded_at DESC);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_department_id ON audit_log(department_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Enable RLS on file_versions
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view versions of files they can access
CREATE POLICY "Users can view versions of accessible files"
  ON file_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files f
      WHERE f.id = file_versions.file_id
      AND (
        f.uploaded_by = auth.uid()
        OR f.confidentiality IN ('public', 'internal')
        OR EXISTS (
          SELECT 1 FROM users u
          INNER JOIN department_members dm ON dm.user_id = u.id
          WHERE u.id = auth.uid()
          AND dm.department_id = f.department_id
          AND (u.site_department_manager = true OR u.role = 'admin')
        )
      )
    )
  );

-- RLS Policy: Authorized users can create versions
CREATE POLICY "Authorized users can create versions"
  ON file_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM files f
      WHERE f.id = file_versions.file_id
      AND (
        f.uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users u
          INNER JOIN department_members dm ON dm.user_id = u.id
          WHERE u.id = auth.uid()
          AND dm.department_id = f.department_id
          AND (u.site_department_manager = true OR u.can_manage_dept_tasks = true)
        )
      )
    )
  );

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view audit logs for their department
CREATE POLICY "Users can view relevant audit logs"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      INNER JOIN department_members dm ON dm.user_id = u.id
      WHERE u.id = auth.uid()
      AND dm.department_id = audit_log.department_id
      AND (u.site_department_manager = true OR u.role = 'admin')
    )
  );

-- RLS Policy: Authenticated users can create audit logs
CREATE POLICY "Authenticated users can create audit logs"
  ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to automatically create audit log entry when file is updated
CREATE OR REPLACE FUNCTION log_file_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.version_number != NEW.version_number) THEN
    INSERT INTO audit_log (
      entity_type,
      entity_id,
      action,
      user_id,
      department_id,
      details
    ) VALUES (
      'file',
      NEW.id,
      'version_uploaded',
      NEW.uploaded_by,
      NEW.department_id,
      jsonb_build_object(
        'version_from', OLD.version_number,
        'version_to', NEW.version_number,
        'file_name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic audit logging
DROP TRIGGER IF EXISTS trigger_log_file_update ON files;
CREATE TRIGGER trigger_log_file_update
  AFTER UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION log_file_update();
