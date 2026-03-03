-- ══════════════════════════════════════════════════════════════
-- OSCaller Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ══════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Providers ──
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  trade TEXT NOT NULL CHECK (trade IN ('plumbing','electrical','hvac','locksmith','appliance','roofing','glass','pest')),
  tier TEXT NOT NULL DEFAULT 'probation' CHECK (tier IN ('probation','standard','verified_emergency')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Requests (Jobs) ──
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_apartment BOOLEAN DEFAULT FALSE,
  building_name TEXT,
  unit_number TEXT,
  entry_instructions TEXT,
  service TEXT NOT NULL CHECK (service IN ('plumbing','electrical','hvac','locksmith','appliance','roofing','glass','pest')),
  emergency_level TEXT NOT NULL CHECK (emergency_level IN ('emergency','urgent','standard')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','searching','expanding','found','pre-authorized','en-route','arrived','completed','cancelled')),
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  payment_status TEXT NOT NULL DEFAULT 'none' CHECK (payment_status IN ('none','authorized','captured','refunded','pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Request Events (Timeline) ──
CREATE TABLE IF NOT EXISTS request_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('complete','active','pending')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_request_events_request_id ON request_events(request_id);

-- ── Provider Locations ──
CREATE TABLE IF NOT EXISTS provider_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_locations_provider ON provider_locations(provider_id);

-- ── Provider Availability ──
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID UNIQUE NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  schedule JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Provider Stats ──
CREATE TABLE IF NOT EXISTS provider_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID UNIQUE NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  total_jobs INT DEFAULT 0,
  completed_jobs INT DEFAULT 0,
  on_time_rate DOUBLE PRECISION DEFAULT 1.0,
  average_rating DOUBLE PRECISION DEFAULT 5.0,
  complaint_count INT DEFAULT 0,
  clean_streak INT DEFAULT 0,
  near_miss_tokens INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reviews ──
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments ──
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none','authorized','captured','refunded','pending')),
  captured_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Disputes ──
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved_refund','resolved_no_refund','resolved_redispatch')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Dispatch Offers (Race Protocol) ──
CREATE TABLE IF NOT EXISTS dispatch_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired','near_miss')),
  distance_km DOUBLE PRECISION,
  eta_minutes DOUBLE PRECISION,
  quality_score DOUBLE PRECISION,
  offered_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  reservation_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_dispatch_offers_request ON dispatch_offers(request_id);
CREATE INDEX idx_dispatch_offers_provider ON dispatch_offers(provider_id);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_offers ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use this)
-- Users can read their own data
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own requests" ON requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create requests" ON requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own request events" ON request_events FOR SELECT
  USING (request_id IN (SELECT id FROM requests WHERE user_id = auth.uid()));

CREATE POLICY "Public read providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Public read provider stats" ON provider_stats FOR SELECT USING (true);

CREATE POLICY "Users can read own payments" ON payments FOR SELECT
  USING (request_id IN (SELECT id FROM requests WHERE user_id = auth.uid()));

CREATE POLICY "Users can read own disputes" ON disputes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own reviews" ON reviews FOR SELECT
  USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- AUTO-UPDATE TIMESTAMPS
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_providers_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_provider_stats_updated_at BEFORE UPDATE ON provider_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_provider_availability_updated_at BEFORE UPDATE ON provider_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- SEED DATA (Demo providers)
-- ══════════════════════════════════════════════════════════════

INSERT INTO providers (full_name, trade, tier, is_active) VALUES
  ('Peter M.', 'plumbing', 'verified_emergency', true),
  ('Sarah K.', 'electrical', 'verified_emergency', true),
  ('David R.', 'hvac', 'standard', true),
  ('Lisa T.', 'locksmith', 'verified_emergency', true),
  ('Mike J.', 'plumbing', 'probation', true),
  ('Anna W.', 'electrical', 'standard', true)
ON CONFLICT DO NOTHING;

-- Add stats for seed providers
INSERT INTO provider_stats (provider_id, total_jobs, completed_jobs, on_time_rate, average_rating, complaint_count, clean_streak)
SELECT id, 218, 215, 0.97, 4.8, 1, 42 FROM providers WHERE full_name = 'Peter M.'
ON CONFLICT DO NOTHING;

INSERT INTO provider_stats (provider_id, total_jobs, completed_jobs, on_time_rate, average_rating, complaint_count, clean_streak)
SELECT id, 156, 150, 0.95, 4.7, 2, 28 FROM providers WHERE full_name = 'Sarah K.'
ON CONFLICT DO NOTHING;

INSERT INTO provider_stats (provider_id, total_jobs, completed_jobs, on_time_rate, average_rating, complaint_count, clean_streak)
SELECT id, 89, 85, 0.93, 4.5, 3, 15 FROM providers WHERE full_name = 'David R.'
ON CONFLICT DO NOTHING;

INSERT INTO provider_stats (provider_id, total_jobs, completed_jobs, on_time_rate, average_rating, complaint_count, clean_streak)
SELECT id, 312, 310, 0.99, 4.9, 0, 67 FROM providers WHERE full_name = 'Lisa T.'
ON CONFLICT DO NOTHING;

-- Add availability for seed providers
INSERT INTO provider_availability (provider_id, is_online)
SELECT id, true FROM providers WHERE is_active = true
ON CONFLICT DO NOTHING;

-- Add locations for seed providers (NYC area)
INSERT INTO provider_locations (provider_id, lat, lng)
SELECT id, 40.7220, -73.998 FROM providers WHERE full_name = 'Peter M.'
ON CONFLICT DO NOTHING;

INSERT INTO provider_locations (provider_id, lat, lng)
SELECT id, 40.7180, -74.010 FROM providers WHERE full_name = 'Sarah K.'
ON CONFLICT DO NOTHING;

INSERT INTO provider_locations (provider_id, lat, lng)
SELECT id, 40.7300, -73.990 FROM providers WHERE full_name = 'David R.'
ON CONFLICT DO NOTHING;

INSERT INTO provider_locations (provider_id, lat, lng)
SELECT id, 40.7100, -74.015 FROM providers WHERE full_name = 'Lisa T.'
ON CONFLICT DO NOTHING;
