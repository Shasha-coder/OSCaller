-- ══════════════════════════════════════════════════════════════
-- Seed Test Providers for Retell AI Testing
-- This creates dummy providers in multiple locations for testing
-- the "call nearest provider" feature
-- ══════════════════════════════════════════════════════════════

-- Clear existing test data (optional - comment out if you want to keep existing)
-- DELETE FROM provider_locations WHERE provider_id IN (SELECT id FROM providers WHERE email LIKE '%@test.oscaller.com');
-- DELETE FROM provider_availability WHERE provider_id IN (SELECT id FROM providers WHERE email LIKE '%@test.oscaller.com');
-- DELETE FROM provider_stats WHERE provider_id IN (SELECT id FROM providers WHERE email LIKE '%@test.oscaller.com');
-- DELETE FROM providers WHERE email LIKE '%@test.oscaller.com';

-- ── Test Providers (Various Trades & Locations) ──

-- Toronto Area Providers
INSERT INTO providers (id, full_name, email, phone, trade, tier, is_active, country, languages) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Plumber', 'john@test.oscaller.com', '+14165551001', 'plumbing', 'verified_emergency', true, 'CA', ARRAY['en']),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Electric', 'sarah@test.oscaller.com', '+14165551002', 'electrical', 'verified_emergency', true, 'CA', ARRAY['en', 'fr']),
  ('33333333-3333-3333-3333-333333333333', 'Mike HVAC', 'mike@test.oscaller.com', '+14165551003', 'hvac', 'standard', true, 'CA', ARRAY['en']),
  ('44444444-4444-4444-4444-444444444444', 'Lisa Locksmith', 'lisa@test.oscaller.com', '+14165551004', 'locksmith', 'verified_emergency', true, 'CA', ARRAY['en', 'es'])
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active;

-- NYC Area Providers  
INSERT INTO providers (id, full_name, email, phone, trade, tier, is_active, country, languages) VALUES
  ('55555555-5555-5555-5555-555555555555', 'Tony Plumber NYC', 'tony@test.oscaller.com', '+12125551001', 'plumbing', 'verified_emergency', true, 'US', ARRAY['en', 'es']),
  ('66666666-6666-6666-6666-666666666666', 'Maria Electric NYC', 'maria@test.oscaller.com', '+12125551002', 'electrical', 'standard', true, 'US', ARRAY['en', 'es']),
  ('77777777-7777-7777-7777-777777777777', 'Bob HVAC NYC', 'bob@test.oscaller.com', '+12125551003', 'hvac', 'verified_emergency', true, 'US', ARRAY['en'])
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active;

-- ── Provider Stats (Good ratings for testing) ──
INSERT INTO provider_stats (provider_id, total_jobs, completed_jobs, on_time_rate, average_rating, complaint_count, clean_streak, near_miss_tokens) VALUES
  ('11111111-1111-1111-1111-111111111111', 250, 245, 0.98, 4.9, 0, 50, 0),
  ('22222222-2222-2222-2222-222222222222', 180, 175, 0.96, 4.8, 1, 35, 0),
  ('33333333-3333-3333-3333-333333333333', 120, 115, 0.94, 4.6, 2, 20, 0),
  ('44444444-4444-4444-4444-444444444444', 300, 298, 0.99, 4.95, 0, 75, 1),
  ('55555555-5555-5555-5555-555555555555', 200, 195, 0.97, 4.85, 1, 40, 0),
  ('66666666-6666-6666-6666-666666666666', 90, 85, 0.92, 4.5, 3, 15, 0),
  ('77777777-7777-7777-7777-777777777777', 150, 145, 0.95, 4.7, 1, 30, 0)
ON CONFLICT (provider_id) DO UPDATE SET 
  total_jobs = EXCLUDED.total_jobs,
  completed_jobs = EXCLUDED.completed_jobs,
  average_rating = EXCLUDED.average_rating;

-- ── Provider Availability (All online) ──
INSERT INTO provider_availability (provider_id, is_online, schedule) VALUES
  ('11111111-1111-1111-1111-111111111111', true, '{"mon": "08:00-20:00", "tue": "08:00-20:00", "wed": "08:00-20:00", "thu": "08:00-20:00", "fri": "08:00-20:00", "sat": "09:00-17:00", "sun": "emergency_only"}'),
  ('22222222-2222-2222-2222-222222222222', true, '{"mon": "07:00-19:00", "tue": "07:00-19:00", "wed": "07:00-19:00", "thu": "07:00-19:00", "fri": "07:00-19:00"}'),
  ('33333333-3333-3333-3333-333333333333', true, '{"mon": "09:00-18:00", "tue": "09:00-18:00", "wed": "09:00-18:00", "thu": "09:00-18:00", "fri": "09:00-18:00"}'),
  ('44444444-4444-4444-4444-444444444444', true, '{"24/7": true}'),
  ('55555555-5555-5555-5555-555555555555', true, '{"mon": "06:00-22:00", "tue": "06:00-22:00", "wed": "06:00-22:00", "thu": "06:00-22:00", "fri": "06:00-22:00", "sat": "08:00-20:00", "sun": "08:00-20:00"}'),
  ('66666666-6666-6666-6666-666666666666', true, '{"mon": "08:00-18:00", "tue": "08:00-18:00", "wed": "08:00-18:00", "thu": "08:00-18:00", "fri": "08:00-18:00"}'),
  ('77777777-7777-7777-7777-777777777777', true, '{"24/7": true}')
ON CONFLICT (provider_id) DO UPDATE SET 
  is_online = true;

-- ── Provider Locations (Realistic coordinates) ──

-- Toronto Downtown (43.6532° N, 79.3832° W)
INSERT INTO provider_locations (provider_id, lat, lng, heading, speed, recorded_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 43.6510, -79.3470, 90, 0, NOW()),   -- East Toronto
  ('22222222-2222-2222-2222-222222222222', 43.6580, -79.3800, 180, 0, NOW()),  -- Downtown
  ('33333333-3333-3333-3333-333333333333', 43.6700, -79.4100, 270, 0, NOW()),  -- West Toronto
  ('44444444-4444-4444-4444-444444444444', 43.6450, -79.4000, 0, 0, NOW());    -- South Toronto

-- NYC Manhattan (40.7128° N, 74.0060° W)
INSERT INTO provider_locations (provider_id, lat, lng, heading, speed, recorded_at) VALUES
  ('55555555-5555-5555-5555-555555555555', 40.7580, -73.9855, 180, 0, NOW()),  -- Midtown
  ('66666666-6666-6666-6666-666666666666', 40.7128, -74.0060, 90, 0, NOW()),   -- Lower Manhattan
  ('77777777-7777-7777-7777-777777777777', 40.7831, -73.9712, 270, 0, NOW());  -- Upper East Side

-- ══════════════════════════════════════════════════════════════
-- Verify the seed data
-- ══════════════════════════════════════════════════════════════
-- SELECT 
--   p.full_name, 
--   p.trade, 
--   p.country,
--   ps.average_rating,
--   pa.is_online,
--   pl.lat, 
--   pl.lng
-- FROM providers p
-- LEFT JOIN provider_stats ps ON ps.provider_id = p.id
-- LEFT JOIN provider_availability pa ON pa.provider_id = p.id
-- LEFT JOIN provider_locations pl ON pl.provider_id = p.id
-- WHERE p.email LIKE '%@test.oscaller.com'
-- ORDER BY p.country, p.trade;
