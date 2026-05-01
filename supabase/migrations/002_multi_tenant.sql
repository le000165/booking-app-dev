-- ============================================================================
-- MULTI-TENANT SAAS MIGRATION
-- Version: 002_multi_tenant
-- Migrates from Phase 1 single-business to full multi-tenant SaaS
--
-- IMPORTANT: Run this AFTER the original schema.sql has been applied.
-- This is an additive migration — no data is dropped.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND THE BUSINESSES TABLE
-- ────────────────────────────────────────────────────────────────────────────

-- Add slug for URL routing (e.g., /luxe-nails/book)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add owner reference (the Supabase Auth user who created the business)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add additional SaaS fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for slug-based lookups (customer booking routes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. TEAM MEMBERS TABLE (Auth ↔ Business junction)
-- ────────────────────────────────────────────────────────────────────────────
-- This is the core multi-tenant bridge. Every authenticated action is
-- scoped through this table.

CREATE TYPE team_role AS ENUM ('owner', 'admin', 'employee');

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT unique_user_per_business UNIQUE(user_id, business_id)
);

CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_business ON team_members(business_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. ADD EMPLOYEE ASSIGNMENT TO APPOINTMENTS (optional but useful)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES team_members(id);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. HELPER FUNCTION: Get authenticated user's business IDs
-- ────────────────────────────────────────────────────────────────────────────
-- Used by RLS policies. Avoids repeating the subquery everywhere.

CREATE OR REPLACE FUNCTION get_my_business_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id
  FROM team_members
  WHERE user_id = auth.uid()
    AND is_active = true;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 5. DROP OLD RLS POLICIES (replace with tenant-aware versions)
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can view businesses" ON businesses;
DROP POLICY IF EXISTS "Public can view active services" ON services;
DROP POLICY IF EXISTS "Public can view availability" ON availability;
DROP POLICY IF EXISTS "Public can create appointments" ON appointments;


-- ────────────────────────────────────────────────────────────────────────────
-- 6. NEW RLS POLICIES — BUSINESSES
-- ────────────────────────────────────────────────────────────────────────────

-- Anyone can see active businesses (public booking pages)
CREATE POLICY "Public: view active businesses"
  ON businesses FOR SELECT
  USING (is_active = true);

-- Only the owner can update their own business
CREATE POLICY "Owner: update own business"
  ON businesses FOR UPDATE
  USING (owner_id = auth.uid());

-- Authenticated users can create a business (SaaS registration)
CREATE POLICY "Auth: create business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ────────────────────────────────────────────────────────────────────────────
-- 7. NEW RLS POLICIES — TEAM MEMBERS
-- ────────────────────────────────────────────────────────────────────────────

-- Users can see their own team memberships
CREATE POLICY "Users: view own memberships"
  ON team_members FOR SELECT
  USING (user_id = auth.uid());

-- Admins/owners can see all team members for their business
CREATE POLICY "Admin: view team members"
  ON team_members FOR SELECT
  USING (business_id IN (SELECT get_my_business_ids()));

-- Only owners/admins can invite team members
CREATE POLICY "Admin: insert team members"
  ON team_members FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners can update/remove team members
CREATE POLICY "Owner: manage team members"
  ON team_members FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM team_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owner: delete team members"
  ON team_members FOR DELETE
  USING (
    business_id IN (
      SELECT business_id FROM team_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- 8. NEW RLS POLICIES — SERVICES
-- ────────────────────────────────────────────────────────────────────────────

-- Public can view active services (for booking pages)
CREATE POLICY "Public: view active services"
  ON services FOR SELECT
  USING (is_active = true);

-- Team members can manage services for their business
CREATE POLICY "Team: manage services"
  ON services FOR ALL
  USING (business_id IN (SELECT get_my_business_ids()))
  WITH CHECK (business_id IN (SELECT get_my_business_ids()));


-- ────────────────────────────────────────────────────────────────────────────
-- 9. NEW RLS POLICIES — AVAILABILITY
-- ────────────────────────────────────────────────────────────────────────────

-- Public can read availability (for booking pages)
CREATE POLICY "Public: view availability"
  ON availability FOR SELECT
  USING (true);

-- Only team members can manage availability
CREATE POLICY "Team: manage availability"
  ON availability FOR ALL
  USING (business_id IN (SELECT get_my_business_ids()))
  WITH CHECK (business_id IN (SELECT get_my_business_ids()));


-- ────────────────────────────────────────────────────────────────────────────
-- 10. NEW RLS POLICIES — APPOINTMENTS
-- ────────────────────────────────────────────────────────────────────────────

-- Public can create appointments (no login required for customers)
CREATE POLICY "Public: create appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

-- Team members can view appointments for their business
CREATE POLICY "Team: view appointments"
  ON appointments FOR SELECT
  USING (business_id IN (SELECT get_my_business_ids()));

-- Admins/owners can update appointments (confirm, cancel)
CREATE POLICY "Admin: update appointments"
  ON appointments FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Public can view their OWN appointment by email (for confirmation page)
CREATE POLICY "Customer: view own appointment"
  ON appointments FOR SELECT
  USING (customer_email = current_setting('request.headers')::json->>'x-customer-email');


-- ────────────────────────────────────────────────────────────────────────────
-- 11. ADDITIONAL INDEXES FOR MULTI-TENANT PERFORMANCE
-- ────────────────────────────────────────────────────────────────────────────

-- Composite index: appointments by business + date range (slot generation)
CREATE INDEX IF NOT EXISTS idx_appointments_business_range
  ON appointments(business_id, start_time, end_time)
  WHERE status != 'cancelled';

-- Composite index: services by business + active flag
CREATE INDEX IF NOT EXISTS idx_services_business_active
  ON services(business_id)
  WHERE is_active = true;

-- Composite index: team members lookup by user
CREATE INDEX IF NOT EXISTS idx_team_user_active
  ON team_members(user_id, business_id)
  WHERE is_active = true;


COMMIT;
