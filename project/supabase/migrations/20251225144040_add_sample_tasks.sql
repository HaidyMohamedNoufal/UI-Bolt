/*
  # Add Sample Task Data

  ## Overview
  This migration adds sample task data for development and testing purposes.

  ## 1. Sample Data
  - 10 sample tasks with various statuses, priorities, and due dates
  - Tasks include different types: bug fixes, features, reviews, documentation

  ## 2. Important Notes
  - This is test data for demonstration purposes
  - Tasks are not assigned to specific users (assigned_to is NULL)
  - Due dates are set relative to current date
*/

INSERT INTO tasks (id, title, description, department_id, due_date, status, priority, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111112',
    'Review Q4 Financial Report',
    'Review and approve the Q4 financial report before board meeting',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '3 days',
    'pending',
    'high',
    now() - interval '2 days'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'Update Employee Handbook',
    'Update handbook with new remote work policies',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '7 days',
    'in_progress',
    'medium',
    now() - interval '5 days'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'Organize Team Building Event',
    'Plan and organize quarterly team building event',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '14 days',
    'pending',
    'low',
    now() - interval '1 day'
  ),
  (
    '44444444-4444-4444-4444-444444444445',
    'Prepare Budget Forecast',
    'Create detailed budget forecast for 2025',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '5 days',
    'in_progress',
    'high',
    now() - interval '10 days'
  ),
  (
    '55555555-5555-5555-5555-555555555556',
    'Archive Old Documents',
    'Move documents older than 2 years to archive',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '21 days',
    'pending',
    'low',
    now() - interval '3 days'
  ),
  (
    '66666666-6666-6666-6666-666666666667',
    'Security Audit',
    'Conduct quarterly security audit of all systems',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '2 days',
    'pending',
    'high',
    now() - interval '1 day'
  ),
  (
    '77777777-7777-7777-7777-777777777778',
    'Update Architecture Documentation',
    'Update system architecture diagrams and documentation',
    '22222222-2222-2222-2222-222222222222',
    NULL,
    'pending',
    'medium',
    now() - interval '7 days'
  ),
  (
    '88888888-8888-8888-8888-888888888889',
    'Client Meeting Preparation',
    'Prepare presentation materials for upcoming client meeting',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '1 day',
    'in_progress',
    'high',
    now() - interval '2 days'
  ),
  (
    '99999999-9999-9999-9999-99999999999a',
    'Code Review - New Feature',
    'Review pull request for new dashboard feature',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '1 day',
    'completed',
    'medium',
    now() - interval '5 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa0b',
    'Setup New Employee Accounts',
    'Create accounts and access for 3 new team members',
    '22222222-2222-2222-2222-222222222222',
    now() + interval '2 days',
    'pending',
    'medium',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;