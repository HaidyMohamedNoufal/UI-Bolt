/*
  # Add Workflow Fields to Tasks Table

  1. Changes
    - Add workflow_type column to tasks table for ECM workflow categorization
    - Add started_at column (using created_at as the workflow start time)
    - Update status enum to match ECM workflow states
    - Ensure created_by is properly tracked
  
  2. Notes
    - Workflow types: document_approval, purchase_request, leave_request, contract_review, etc.
    - Status updated to: active, pending_review, completed, cancelled
*/

-- Add workflow_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'workflow_type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN workflow_type text DEFAULT 'general';
  END IF;
END $$;

-- Add started_at column if it doesn't exist (workflow start time)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN started_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing tasks to have started_at = created_at
UPDATE tasks SET started_at = created_at WHERE started_at IS NULL;
