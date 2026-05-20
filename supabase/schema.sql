-- Phase 1: Minimal Vero Booking Schema
-- Businesses (Multi-tenant)
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Services offered by businesses
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_mins INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_services_business_id ON services(business_id);

-- Business hours (Availability)
CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  CONSTRAINT unique_business_day UNIQUE(business_id, day_of_week)
);
CREATE INDEX idx_availability_business_id ON availability(business_id);

-- Appointments (Bookings)
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fetching a business's appointments to check overlaps
CREATE INDEX idx_appointments_business_start ON appointments(business_id, start_time);

-- Prevent double booking using a GIST exclusion constraint.
-- Requires the btree_gist extension.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments ADD CONSTRAINT prevent_double_booking 
EXCLUDE USING gist (
  business_id WITH =, 
  tstzrange(start_time, end_time) WITH &&
) WHERE (status != 'cancelled');

-- RLS Config (Optional but recommended for Supabase)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active services and availability
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view availability" ON availability FOR SELECT USING (true);
CREATE POLICY "Public can view businesses" ON businesses FOR SELECT USING (true);
-- To allow public to create appointments, we'll allow insert. In a real app, you might restrict to authenticated users or anonymus sessions.
CREATE POLICY "Public can create appointments" ON appointments FOR INSERT WITH CHECK (true);
