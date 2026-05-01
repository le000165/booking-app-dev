-- ============================================================================
-- MIGRATION 005: Separate Employee Schedules from Business Hours
-- ============================================================================
-- BEFORE: availability table (team_member_id nullable) mixed business hours
--         and staff hours in one table with an overloaded nullable FK.
-- AFTER:  availability table = business operating hours only (no team_member_id).
--         employee_schedules  = per-staff weekly hours.
-- ============================================================================

BEGIN;

-- 1. Create dedicated employee_schedules table
CREATE TABLE IF NOT EXISTS employee_schedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  day_of_week    INT  NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_employee_day UNIQUE(team_member_id, day_of_week)
);

CREATE INDEX idx_emp_schedules_member  ON employee_schedules(team_member_id);
CREATE INDEX idx_emp_schedules_business ON employee_schedules(business_id, day_of_week);

-- 2. RLS
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view employee schedules"
  ON employee_schedules FOR SELECT USING (true);

CREATE POLICY "Team: manage employee schedules"
  ON employee_schedules FOR ALL
  USING (business_id IN (SELECT get_my_business_ids()))
  WITH CHECK (business_id IN (SELECT get_my_business_ids()));

-- 3. Migrate any existing staff-level rows from the old availability table
--    into employee_schedules (these are rows where team_member_id IS NOT NULL).
INSERT INTO employee_schedules (business_id, team_member_id, day_of_week, start_time, end_time)
SELECT business_id, team_member_id, day_of_week, open_time, close_time
FROM availability
WHERE team_member_id IS NOT NULL
ON CONFLICT (team_member_id, day_of_week) DO NOTHING;

-- 4. Seed Sarah Nails (10000000-0000-0000-0000-000000000002) with schedules
--    matching current business hours so she is bookable immediately.
--    Business is Mon-Fri 09:00-18:00 and Sat 10:00-16:00.
INSERT INTO employee_schedules (business_id, team_member_id, day_of_week, start_time, end_time)
VALUES
  ('b1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000002', 1, '09:00', '18:00'),
  ('b1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000002', 2, '09:00', '18:00'),
  ('b1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000002', 3, '09:00', '18:00'),
  ('b1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000002', 4, '09:00', '18:00'),
  ('b1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000002', 5, '09:00', '18:00'),
  ('b1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000002', 6, '10:00', '16:00')
ON CONFLICT (team_member_id, day_of_week) DO NOTHING;

-- Also seed Jessica Nails (10000000-0000-0000-0000-000000000003) if she exists
INSERT INTO employee_schedules (business_id, team_member_id, day_of_week, start_time, end_time)
SELECT
  'b1111111-1111-1111-1111-111111111111',
  '10000000-0000-0000-0000-000000000003',
  a.day_of_week,
  a.open_time,
  a.close_time
FROM availability a
WHERE a.business_id = 'b1111111-1111-1111-1111-111111111111'
  AND a.team_member_id IS NULL
  AND EXISTS (
    SELECT 1 FROM team_members
    WHERE id = '10000000-0000-0000-0000-000000000003' AND is_active = true
  )
ON CONFLICT (team_member_id, day_of_week) DO NOTHING;

-- 5. Remove the team_member_id column from availability so it is purely
--    business operating hours going forward.
--    (Safe: we've already migrated the data above.)
ALTER TABLE availability DROP COLUMN IF EXISTS team_member_id;

-- 6. Clean up: restore the unique constraint that was removed when
--    team_member_id was added (it originally was unique on business_id + day_of_week).
ALTER TABLE availability
  DROP CONSTRAINT IF EXISTS unique_business_day;

ALTER TABLE availability
  ADD CONSTRAINT unique_business_day UNIQUE (business_id, day_of_week);

COMMIT;
