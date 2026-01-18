/*
  # Add Sample Test Data

  ## Overview
  This migration adds sample test data for development and testing purposes.

  ## 1. Sample Data
  - 1 company (Acme Corporation)
  - 1 department (Engineering)
  - 12 sample files with various statuses, confidentiality levels, and file types
  - Files include PDFs, images, spreadsheets, videos, and documents

  ## 2. Important Notes
  - This is test data for demonstration purposes
  - All files use placeholder URLs
  - User references are set to NULL since we don't have auth users yet
*/

-- Insert sample company
INSERT INTO companies (id, name, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample department
INSERT INTO departments (id, company_id, name, created_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Engineering', now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample files
INSERT INTO files (id, name, file_type, file_size, file_url, department_id, status, confidentiality, tags, created_at, modified_at)
VALUES
  (
    'f1111111-1111-1111-1111-111111111111',
    'Q4 Financial Report.pdf',
    'pdf',
    2516582,
    'https://example.com/files/q4-report.pdf',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    'confidential',
    ARRAY['finance', 'report'],
    now() - interval '15 days',
    now() - interval '15 days'
  ),
  (
    'f2222222-2222-2222-2222-222222222222',
    'Product Launch Presentation.pptx',
    'pptx',
    6029312,
    'https://example.com/files/product-launch.pptx',
    '22222222-2222-2222-2222-222222222222',
    'review',
    'internal',
    ARRAY['marketing', 'presentation'],
    now() - interval '14 days',
    now() - interval '14 days'
  ),
  (
    'f3333333-3333-3333-3333-333333333333',
    'Team Photo 2024.jpg',
    'jpg',
    3355443,
    'https://example.com/files/team-photo.jpg',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    'public',
    ARRAY['team', 'photo'],
    now() - interval '13 days',
    now() - interval '13 days'
  ),
  (
    'f4444444-4444-4444-4444-444444444444',
    'Sales Data Q1.xlsx',
    'xlsx',
    1572864,
    'https://example.com/files/sales-q1.xlsx',
    '22222222-2222-2222-2222-222222222222',
    'draft',
    'internal',
    ARRAY['sales', 'data'],
    now() - interval '12 days',
    now() - interval '12 days'
  ),
  (
    'f5555555-5555-5555-5555-555555555555',
    'Training Video.mp4',
    'mp4',
    47185920,
    'https://example.com/files/training.mp4',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    'internal',
    ARRAY['training', 'video'],
    now() - interval '11 days',
    now() - interval '11 days'
  ),
  (
    'f6666666-6666-6666-6666-666666666666',
    'Meeting Notes.docx',
    'docx',
    245760,
    'https://example.com/files/meeting-notes.docx',
    '22222222-2222-2222-2222-222222222222',
    'draft',
    'internal',
    ARRAY['meeting', 'notes'],
    now() - interval '10 days',
    now() - interval '10 days'
  ),
  (
    'f7777777-7777-7777-7777-777777777777',
    'Architecture Diagram.png',
    'png',
    2867200,
    'https://example.com/files/architecture.png',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    'internal',
    ARRAY['architecture', 'diagram'],
    now() - interval '9 days',
    now() - interval '9 days'
  ),
  (
    'f8888888-8888-8888-8888-888888888888',
    'Budget Forecast 2025.xlsx',
    'xlsx',
    891289,
    'https://example.com/files/budget-2025.xlsx',
    '22222222-2222-2222-2222-222222222222',
    'review',
    'confidential',
    ARRAY['budget', 'finance'],
    now() - interval '8 days',
    now() - interval '8 days'
  ),
  (
    'f9999999-9999-9999-9999-999999999999',
    'Company Logo Assets.zip',
    'zip',
    5242880,
    'https://example.com/files/logo-assets.zip',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    'public',
    ARRAY['branding', 'design'],
    now() - interval '7 days',
    now() - interval '7 days'
  ),
  (
    'faaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Employee Handbook.pdf',
    'pdf',
    4194304,
    'https://example.com/files/handbook.pdf',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    'internal',
    ARRAY['hr', 'handbook'],
    now() - interval '6 days',
    now() - interval '6 days'
  ),
  (
    'fbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Project Timeline.xlsx',
    'xlsx',
    734003,
    'https://example.com/files/timeline.xlsx',
    '22222222-2222-2222-2222-222222222222',
    'draft',
    'internal',
    ARRAY['project', 'planning'],
    now() - interval '5 days',
    now() - interval '5 days'
  ),
  (
    'fccccccc-cccc-cccc-cccc-cccccccccccc',
    'Security Policy.pdf',
    'pdf',
    1048576,
    'https://example.com/files/security.pdf',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    'restricted',
    ARRAY['security', 'policy'],
    now() - interval '4 days',
    now() - interval '4 days'
  )
ON CONFLICT (id) DO NOTHING;