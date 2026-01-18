/*
  # Create ECM Application Schema

  ## Overview
  This migration creates the complete database schema for an Enterprise Content Management (ECM) SaaS application.

  ## 1. New Tables
  
  ### `companies`
  - `id` (uuid, primary key) - Unique company identifier
  - `name` (text) - Company name
  - `logo_url` (text, nullable) - Company logo URL
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `departments`
  - `id` (uuid, primary key) - Unique department identifier
  - `company_id` (uuid, foreign key) - Reference to company
  - `name` (text) - Department name
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `users`
  - `id` (uuid, primary key) - Unique user identifier (matches auth.users.id)
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `avatar_url` (text, nullable) - User avatar URL
  - `role` (text) - User role (admin or user)
  - `company_id` (uuid, foreign key) - Reference to company
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `department_members`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Reference to user
  - `department_id` (uuid, foreign key) - Reference to department
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `folders`
  - `id` (uuid, primary key) - Unique folder identifier
  - `name` (text) - Folder name
  - `parent_id` (uuid, nullable, foreign key) - Parent folder reference
  - `department_id` (uuid, foreign key) - Department reference
  - `created_by` (uuid, foreign key) - User who created the folder
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `files`
  - `id` (uuid, primary key) - Unique file identifier
  - `name` (text) - File name
  - `file_type` (text) - File type/extension
  - `file_size` (bigint) - File size in bytes
  - `file_url` (text) - File storage URL
  - `folder_id` (uuid, nullable, foreign key) - Parent folder reference
  - `department_id` (uuid, foreign key) - Department reference
  - `uploaded_by` (uuid, foreign key) - User who uploaded the file
  - `status` (text) - Document status (draft, review, approved, archived)
  - `confidentiality` (text) - Confidentiality level (public, internal, confidential, restricted)
  - `tags` (text[]) - Array of tags
  - `created_at` (timestamptz) - Creation timestamp
  - `modified_at` (timestamptz) - Last modification timestamp
  
  ### `recent_activity`
  - `id` (uuid, primary key) - Unique activity identifier
  - `user_id` (uuid, foreign key) - User who performed the action
  - `department_id` (uuid, foreign key) - Department reference
  - `activity_type` (text) - Type of activity (upload, download, edit, delete, share)
  - `entity_type` (text) - Type of entity (file, folder)
  - `entity_id` (uuid) - Reference to file or folder
  - `entity_name` (text) - Name of the entity
  - `description` (text) - Activity description
  - `created_at` (timestamptz) - Timestamp of activity
  
  ### `tasks`
  - `id` (uuid, primary key) - Unique task identifier
  - `title` (text) - Task title
  - `description` (text, nullable) - Task description
  - `assigned_to` (uuid, foreign key) - User assigned to the task
  - `department_id` (uuid, foreign key) - Department reference
  - `due_date` (timestamptz, nullable) - Task due date
  - `status` (text) - Task status (pending, in_progress, completed)
  - `priority` (text) - Task priority (low, medium, high)
  - `created_by` (uuid, foreign key) - User who created the task
  - `created_at` (timestamptz) - Creation timestamp
  - `completed_at` (timestamptz, nullable) - Completion timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users to access their company/department data
  - Restrict admin-only actions to users with admin role
  
  ## 3. Important Notes
  - All timestamps use timestamptz for proper timezone handling
  - Foreign key constraints ensure data integrity
  - RLS policies enforce multi-tenancy at company/department level
  - User roles determine access to admin features
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create department_members table
CREATE TABLE IF NOT EXISTS department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_url text NOT NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  confidentiality text NOT NULL DEFAULT 'internal' CHECK (confidentiality IN ('public', 'internal', 'confidential', 'restricted')),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create recent_activity table
CREATE TABLE IF NOT EXISTS recent_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('upload', 'download', 'edit', 'delete', 'share', 'create_folder')),
  entity_type text NOT NULL CHECK (entity_type IN ('file', 'folder')),
  entity_id uuid NOT NULL,
  entity_name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recent_activity ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  due_date timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for departments
CREATE POLICY "Users can view departments they belong to"
  ON departments FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert departments in their company"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update departments in their company"
  ON departments FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for users
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update users in their company"
  ON users FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for department_members
CREATE POLICY "Users can view department members in their departments"
  ON department_members FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage department members"
  ON department_members FOR ALL
  TO authenticated
  USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN users u ON d.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN users u ON d.company_id = u.company_id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- RLS Policies for folders
CREATE POLICY "Users can view folders in their departments"
  ON folders FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create folders in their departments"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update folders they created"
  ON folders FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete folders they created"
  ON folders FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for files
CREATE POLICY "Users can view files in their departments"
  ON files FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their departments"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files they uploaded"
  ON files FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete files they uploaded"
  ON files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- RLS Policies for recent_activity
CREATE POLICY "Users can view activity in their departments"
  ON recent_activity FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity records"
  ON recent_activity FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their departments"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their departments"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks assigned to them"
  ON tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid())
  WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_department_members_user_id ON department_members(user_id);
CREATE INDEX IF NOT EXISTS idx_department_members_department_id ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_folders_department_id ON folders(department_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_department_id ON files(department_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_recent_activity_department_id ON recent_activity(department_id);
CREATE INDEX IF NOT EXISTS idx_recent_activity_created_at ON recent_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);