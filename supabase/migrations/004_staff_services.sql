BEGIN;

-- 1. Create mapping table between services and team members
CREATE TABLE service_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, team_member_id)
);

-- Enable RLS and add basic policy for the mapping table
ALTER TABLE service_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view service team members" 
  ON service_team_members FOR SELECT 
  USING (true);

-- 2. Extend availability table to support staff-specific hours
ALTER TABLE availability 
ADD COLUMN team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE;

-- If team_member_id is NULL, it represents general business hours.
-- If team_member_id is populated, it represents that specific staff member's hours.

-- 3. Insert baseline mapping (assume all staff can do all services initially to preserve existing flow)
INSERT INTO service_team_members (business_id, service_id, team_member_id)
SELECT 
  s.business_id, 
  s.id as service_id, 
  t.id as team_member_id
FROM services s
JOIN team_members t ON s.business_id = t.business_id
WHERE t.is_active = true
ON CONFLICT DO NOTHING;

-- 4. Set some basic staff-specific availability for existing employees
-- (Copying the business availability as a default for all employees)
INSERT INTO availability (business_id, day_of_week, open_time, close_time, team_member_id)
SELECT 
  a.business_id, 
  a.day_of_week, 
  a.open_time, 
  a.close_time, 
  t.id as team_member_id
FROM availability a
JOIN team_members t ON a.business_id = t.business_id
WHERE a.team_member_id IS NULL AND t.is_active = true
ON CONFLICT DO NOTHING;

COMMIT;
