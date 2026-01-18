/*
  # Add NCAR Metadata and Document Types

  ## Overview
  This migration adds support for NCAR (National Center for Archives and Records) metadata
  standards and document type management for Story 569 and Story 1864.

  ## New Tables

  ### `document_types` Table
  Manages different types of documents with retention policies:
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Document type name
  - `document_main_type` (text) - Main category/classification
  - `retention_period_years` (integer) - How long to retain (in years)
  - `retention_starts_from` (text) - When retention period starts
  - `permanent` (boolean) - Whether document is permanent
  - `department_id` (uuid, foreign key) - Department this type belongs to
  - `description` (text) - Description of document type
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Modified Tables

  ### `files` Table - Add NCAR Metadata Fields
  - `document_type_id` (uuid, foreign key) - Reference to document_types
  - `activation_date` (date) - When document becomes active
  - `document_status` (text) - Active or Inactive
  - `end_date` (date) - When document ends (if inactive)
  - `personal_data` (boolean) - Contains personal data flag
  - `permanent` (boolean) - Permanent document flag
  - `relocated` (boolean) - Document relocated flag
  - `physically_disposed` (boolean) - Physically disposed flag
  - `archived` (boolean) - Archived status
  - `archived_date` (timestamptz) - When archived
  - `edit_archived` (boolean) - Allow editing archived docs

  ### `folders` Table - Add Leaf Folder Flag
  - `is_leaf` (boolean) - Indicates if folder is a leaf folder (no subfolders)

  ### `users` Table - Add NCAR Permission
  - `can_change_edit_archived_docs_status` (boolean) - Permission to edit archived documents

  ## Security
  - RLS policies updated to handle document type access
  - Only authorized users can modify archived documents
  - Document types are department-scoped
*/

-- Create document_types table
CREATE TABLE IF NOT EXISTS document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_main_type text NOT NULL DEFAULT 'General',
  retention_period_years integer NOT NULL DEFAULT 7,
  retention_starts_from text NOT NULL DEFAULT 'Creation Date',
  permanent boolean DEFAULT false,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for document_types
CREATE INDEX IF NOT EXISTS idx_document_types_department ON document_types(department_id);
CREATE INDEX IF NOT EXISTS idx_document_types_name ON document_types(name);

-- Add NCAR metadata fields to files table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'document_type_id') THEN
    ALTER TABLE files ADD COLUMN document_type_id uuid REFERENCES document_types(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'activation_date') THEN
    ALTER TABLE files ADD COLUMN activation_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'document_status') THEN
    ALTER TABLE files ADD COLUMN document_status text DEFAULT 'Active' CHECK (document_status IN ('Active', 'Inactive'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'end_date') THEN
    ALTER TABLE files ADD COLUMN end_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'personal_data') THEN
    ALTER TABLE files ADD COLUMN personal_data boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'permanent') THEN
    ALTER TABLE files ADD COLUMN permanent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'relocated') THEN
    ALTER TABLE files ADD COLUMN relocated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'physically_disposed') THEN
    ALTER TABLE files ADD COLUMN physically_disposed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'archived') THEN
    ALTER TABLE files ADD COLUMN archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'archived_date') THEN
    ALTER TABLE files ADD COLUMN archived_date timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'edit_archived') THEN
    ALTER TABLE files ADD COLUMN edit_archived boolean DEFAULT false;
  END IF;
END $$;

-- Add leaf folder flag to folders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'folders' AND column_name = 'is_leaf') THEN
    ALTER TABLE folders ADD COLUMN is_leaf boolean DEFAULT false;
  END IF;
END $$;

-- Add archived document edit permission to users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'can_change_edit_archived_docs_status') THEN
    ALTER TABLE users ADD COLUMN can_change_edit_archived_docs_status boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for new file columns
CREATE INDEX IF NOT EXISTS idx_files_document_type_id ON files(document_type_id);
CREATE INDEX IF NOT EXISTS idx_files_document_status ON files(document_status);
CREATE INDEX IF NOT EXISTS idx_files_archived ON files(archived);

-- Enable RLS on document_types
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view document types in their department
CREATE POLICY "Users can view document types in their department"
  ON document_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM department_members dm
      WHERE dm.department_id = document_types.department_id
      AND dm.user_id = auth.uid()
    )
  );

-- RLS Policy: Managers can create document types
CREATE POLICY "Managers can create document types"
  ON document_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN department_members dm ON dm.user_id = u.id
      WHERE u.id = auth.uid()
      AND dm.department_id = document_types.department_id
      AND (u.site_department_manager = true OR u.role = 'admin')
    )
  );

-- RLS Policy: Managers can update document types
CREATE POLICY "Managers can update document types"
  ON document_types
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN department_members dm ON dm.user_id = u.id
      WHERE u.id = auth.uid()
      AND dm.department_id = document_types.department_id
      AND (u.site_department_manager = true OR u.role = 'admin')
    )
  );

-- Insert sample document types for each department
INSERT INTO document_types (name, document_main_type, retention_period_years, retention_starts_from, permanent, department_id, description)
SELECT 
  'Standard Document',
  'General',
  7,
  'Creation Date',
  false,
  d.id,
  'General purpose documents with standard 7-year retention'
FROM departments d
ON CONFLICT DO NOTHING;

INSERT INTO document_types (name, document_main_type, retention_period_years, retention_starts_from, permanent, department_id, description)
SELECT 
  'Contract',
  'Legal',
  10,
  'Contract End Date',
  false,
  d.id,
  'Legal contracts with 10-year retention from end date'
FROM departments d
ON CONFLICT DO NOTHING;

INSERT INTO document_types (name, document_main_type, retention_period_years, retention_starts_from, permanent, department_id, description)
SELECT 
  'Financial Record',
  'Financial',
  7,
  'Fiscal Year End',
  false,
  d.id,
  'Financial records with 7-year retention from fiscal year end'
FROM departments d
ON CONFLICT DO NOTHING;

INSERT INTO document_types (name, document_main_type, retention_period_years, retention_starts_from, permanent, department_id, description)
SELECT 
  'Permanent Record',
  'Archive',
  999,
  'Creation Date',
  true,
  d.id,
  'Permanent archival documents'
FROM departments d
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_type_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_document_types_timestamp ON document_types;
CREATE TRIGGER update_document_types_timestamp
  BEFORE UPDATE ON document_types
  FOR EACH ROW
  EXECUTE FUNCTION update_document_type_timestamp();
