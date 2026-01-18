/*
  # Add Vacation Requests Feature

  ## Overview
  This migration creates a vacation request system that allows employees to submit vacation requests
  with supporting documents. Managers can approve or reject these requests based on their department role.

  ## New Tables
  
  ### `vacation_requests`
  - `id` (uuid, primary key) - Unique identifier for the vacation request
  - `submitted_by` (uuid, foreign key to users) - Employee submitting the request
  - `manager_id` (uuid, foreign key to users) - Manager assigned to review the request
  - `department_id` (uuid, foreign key to departments) - Department of the employee
  - `start_date` (date) - Vacation start date
  - `end_date` (date) - Vacation end date
  - `reason` (text) - Reason for vacation request
  - `document_url` (text, nullable) - URL to uploaded supporting document
  - `status` (text) - Request status: 'pending', 'approved', 'rejected'
  - `created_at` (timestamptz) - When the request was submitted
  - `reviewed_at` (timestamptz, nullable) - When the manager reviewed the request
  - `review_notes` (text, nullable) - Manager's notes on the decision

  ## Security (RLS Policies)
  
  ### Employee Permissions:
  - **Submit Request**: Any authenticated user can create vacation requests for themselves
  - **View Own Requests**: Users can view their own vacation requests
  - **Update Own Pending Requests**: Users can update their own requests that are still pending
  
  ### Manager Permissions:
  - **View Department Requests**: Managers (site_department_manager or can_manage_dept_tasks) can view all requests in their department
  - **Approve/Reject Requests**: Managers can update request status and add review notes for department requests

  ## Role System (Alfresco-based)
  
  The vacation request system uses the existing role system:
  - `role`: 'admin' or 'user' (in users table)
  - `site_department_manager`: boolean flag indicating department manager
  - `can_manage_dept_tasks`: boolean flag indicating task management permission
  
  Users with `site_department_manager = true` OR `can_manage_dept_tasks = true` are considered managers
  and have approval rights for their department's vacation requests.
*/

-- Create vacation_requests table
CREATE TABLE IF NOT EXISTS vacation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  document_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  review_notes text,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own vacation requests
CREATE POLICY "Users can view own vacation requests"
  ON vacation_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = submitted_by);

-- Policy: Managers can view all department vacation requests
CREATE POLICY "Managers can view department vacation requests"
  ON vacation_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN department_members dm ON dm.user_id = u.id
      WHERE u.id = auth.uid()
      AND dm.department_id = vacation_requests.department_id
      AND (u.site_department_manager = true OR u.can_manage_dept_tasks = true)
    )
  );

-- Policy: Users can create vacation requests for themselves
CREATE POLICY "Users can create vacation requests"
  ON vacation_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Policy: Users can update their own pending vacation requests
CREATE POLICY "Users can update own pending requests"
  ON vacation_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = submitted_by 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = submitted_by 
    AND status = 'pending'
  );

-- Policy: Managers can update vacation requests in their department
CREATE POLICY "Managers can review department vacation requests"
  ON vacation_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN department_members dm ON dm.user_id = u.id
      WHERE u.id = auth.uid()
      AND dm.department_id = vacation_requests.department_id
      AND (u.site_department_manager = true OR u.can_manage_dept_tasks = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN department_members dm ON dm.user_id = u.id
      WHERE u.id = auth.uid()
      AND dm.department_id = vacation_requests.department_id
      AND (u.site_department_manager = true OR u.can_manage_dept_tasks = true)
    )
  );

-- Policy: Users can delete their own pending vacation requests
CREATE POLICY "Users can delete own pending requests"
  ON vacation_requests
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = submitted_by 
    AND status = 'pending'
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vacation_requests_submitted_by ON vacation_requests(submitted_by);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_department_id ON vacation_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON vacation_requests(status);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_manager_id ON vacation_requests(manager_id);
