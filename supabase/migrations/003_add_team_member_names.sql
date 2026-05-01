BEGIN;

-- ============================================================================
-- 1. SCHEMA UPDATE
-- Add first_name and last_name, initially allowing NULL to prevent errors 
-- on existing rows.
-- ============================================================================
ALTER TABLE team_members 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- ============================================================================
-- 2. UPDATE EXISTING DATA
-- Set safe default values for any existing rows in the team_members table.
-- Assuming previously seeded Luxe Nails and Zen Spa team members.
-- ============================================================================
UPDATE team_members SET first_name = 'Luxe', last_name = 'Owner' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE team_members SET first_name = 'Sarah', last_name = 'Nails' WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE team_members SET first_name = 'Jessica', last_name = 'Nails' WHERE id = '10000000-0000-0000-0000-000000000003';

UPDATE team_members SET first_name = 'Zen', last_name = 'Owner' WHERE id = '20000000-0000-0000-0000-000000000001';
UPDATE team_members SET first_name = 'Michael', last_name = 'Massage' WHERE id = '20000000-0000-0000-0000-000000000002';
UPDATE team_members SET first_name = 'Emma', last_name = 'Facials' WHERE id = '20000000-0000-0000-0000-000000000003';

-- Catch-all for any other existing rows not explicitly named above
UPDATE team_members SET first_name = 'Staff', last_name = 'Member' WHERE first_name IS NULL;

-- ============================================================================
-- 3. ENFORCE NOT NULL
-- Now that all rows have data, we can safely enforce the NOT NULL constraint.
-- ============================================================================
ALTER TABLE team_members 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- ============================================================================
-- 4. INSERT NEW SAMPLE SEED DATA
-- Adding additional staff to businesses using realistic names.
-- First, ensure the dummy user accounts exist in Auth (so foreign keys pass)
-- ============================================================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, instance_id)
VALUES 
  ('00000000-0000-0000-0000-000000000007', 'mia.williams@example.com', '', now(), '{}', '{}', now(), now(), '', '', '', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-000000000008', 'david.chen@example.com', '', now(), '{}', '{}', now(), now(), '', '', '', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_members (id, user_id, business_id, role, is_active, first_name, last_name)
VALUES 
  -- New Employee for Luxe Nails (business b1111111...)
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'b1111111-1111-1111-1111-111111111111', 'employee', true, 'Mia', 'Williams'),
  
  -- New Employee for Zen Spa (business b2222222...)
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008', 'b2222222-2222-2222-2222-222222222222', 'employee', true, 'David', 'Chen')
ON CONFLICT (id) DO NOTHING;

COMMIT;
