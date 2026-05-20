-- Seed data for testing the multi-tenant SaaS application
-- Run this in your Supabase SQL Editor to populate the demo data.

BEGIN;

-- 1. Insert a demo workspace with the slug 'luxe-nails' (required for the demo route)
INSERT INTO businesses (id, name, slug, email, phone, address, timezone, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'Luxe Nail Studio', 
  'luxe-nails', 
  'hello@luxenails.example.com', 
  '+1 555-0100', 
  '123 Main St, Miami FL', 
  'America/New_York', 
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert demo services linked to the business
INSERT INTO services (id, business_id, name, duration_mins, price, is_active)
VALUES 
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Classic Manicure 💅', 30, 35.00, true),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Gel Manicure ✨', 60, 55.00, true),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Full Set Acrylic 💎', 90, 75.00, true),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Pedicure 🦶', 60, 45.00, true),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Consultation 💬', 15, 0.00, true)
ON CONFLICT DO NOTHING;

-- 3. Insert demo availability (Open Monday-Saturday)
INSERT INTO availability (business_id, day_of_week, open_time, close_time)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 1, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 2, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 3, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 4, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 5, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 6, '10:00', '16:00')
ON CONFLICT DO NOTHING;

COMMIT;
