/*
  # Add Public Read Policies for Development Testing

  ## Overview
  Adds permissive read policies to allow viewing data during development without authentication.
  These policies should be removed or restricted in production.

  ## Changes
  1. Files Table
    - Add policy to allow public read access
  
  2. Folders Table
    - Add policy to allow public read access
  
  3. Tasks Table
    - Add policy to allow public read access
  
  4. Companies Table
    - Add policy to allow public read access
  
  5. Departments Table
    - Add policy to allow public read access

  ## Security Notes
  - These are DEVELOPMENT ONLY policies
  - Remove these policies before production deployment
  - Write operations still require authentication
*/

-- Allow public read access to files
CREATE POLICY "Public read access for files"
  ON files FOR SELECT
  TO public
  USING (true);

-- Allow public read access to folders
CREATE POLICY "Public read access for folders"
  ON folders FOR SELECT
  TO public
  USING (true);

-- Allow public read access to tasks
CREATE POLICY "Public read access for tasks"
  ON tasks FOR SELECT
  TO public
  USING (true);

-- Allow public read access to companies
CREATE POLICY "Public read access for companies"
  ON companies FOR SELECT
  TO public
  USING (true);

-- Allow public read access to departments
CREATE POLICY "Public read access for departments"
  ON departments FOR SELECT
  TO public
  USING (true);

-- Allow public read access to recent_activity
CREATE POLICY "Public read access for recent_activity"
  ON recent_activity FOR SELECT
  TO public
  USING (true);

-- Allow public read access to batch_scan_sessions
CREATE POLICY "Public read access for batch_scan_sessions"
  ON batch_scan_sessions FOR SELECT
  TO public
  USING (true);

-- Allow public read access to scanned_documents
CREATE POLICY "Public read access for scanned_documents"
  ON scanned_documents FOR SELECT
  TO public
  USING (true);