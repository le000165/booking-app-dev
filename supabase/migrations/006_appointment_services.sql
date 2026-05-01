-- ============================================================================
-- MIGRATION 006: Multi-Service Appointments
-- ============================================================================
-- Adds a join table so one appointment can reference multiple services.
-- The appointments.service_id column is kept for backward compatibility
-- and will hold the first (primary) selected service.
-- ============================================================================

BEGIN;

-- 1. Create the join table
CREATE TABLE IF NOT EXISTS appointment_services (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id     UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_appt_service UNIQUE(appointment_id, service_id)
);

CREATE INDEX idx_appt_svc_appointment ON appointment_services(appointment_id);
CREATE INDEX idx_appt_svc_service     ON appointment_services(service_id);
CREATE INDEX idx_appt_svc_business    ON appointment_services(business_id);

-- 2. RLS
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Public can read (needed for any future display of booked services)
CREATE POLICY "Public: view appointment services"
  ON appointment_services FOR SELECT
  USING (true);

-- Public can insert (needed when customer completes booking)
CREATE POLICY "Public: create appointment services"
  ON appointment_services FOR INSERT
  WITH CHECK (true);

-- Team members can manage records for their business
CREATE POLICY "Team: manage appointment services"
  ON appointment_services FOR ALL
  USING (business_id IN (SELECT get_my_business_ids()))
  WITH CHECK (business_id IN (SELECT get_my_business_ids()));

-- 3. Migrate existing single-service appointments into the join table
INSERT INTO appointment_services (appointment_id, service_id, business_id)
SELECT id, service_id, business_id
FROM appointments
WHERE service_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
