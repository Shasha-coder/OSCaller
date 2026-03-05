-- ══════════════════════════════════════════════════════════════
-- Migration 001: Add language, country, and media support
-- Enables multilingual AI orchestration and per-country routing
-- ══════════════════════════════════════════════════════════════

-- ── Users: add locale and country ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(3) DEFAULT 'US';

-- ── Providers: add locale, spoken languages array, and country ──
ALTER TABLE providers ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['en'];
ALTER TABLE providers ADD COLUMN IF NOT EXISTS country VARCHAR(3) DEFAULT 'US';

-- ── Requests: add client locale, country, media urls, and image analysis ──
ALTER TABLE requests ADD COLUMN IF NOT EXISTS client_locale VARCHAR(10) DEFAULT 'en';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS country VARCHAR(3) DEFAULT 'US';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS media_urls TEXT[];
ALTER TABLE requests ADD COLUMN IF NOT EXISTS image_analysis TEXT;

-- ── Twilio number pool for multi-country routing ──
CREATE TABLE IF NOT EXISTS twilio_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL UNIQUE,
  country_code VARCHAR(3) NOT NULL,
  capabilities JSONB DEFAULT '{"voice": true, "sms": true}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_to TEXT,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_twilio_numbers_country ON twilio_numbers(country_code);
CREATE INDEX IF NOT EXISTS idx_twilio_numbers_active ON twilio_numbers(is_active) WHERE is_active = TRUE;

-- ── Call records: track every AI call with language context ──
CREATE TABLE IF NOT EXISTS call_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('client_inbound', 'client_outbound', 'provider_outbound')),
  participant_role TEXT NOT NULL CHECK (participant_role IN ('client', 'provider')),
  participant_id UUID,
  twilio_call_sid TEXT,
  twilio_number_id UUID REFERENCES twilio_numbers(id),
  agent_session_id TEXT,
  language_used VARCHAR(10),
  recording_url TEXT,
  transcript JSONB,
  duration_seconds INT,
  call_status TEXT DEFAULT 'initiated' CHECK (call_status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_call_records_request ON call_records(request_id);
CREATE INDEX IF NOT EXISTS idx_call_records_participant ON call_records(participant_id);

-- Enable RLS on new tables
ALTER TABLE twilio_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;

-- Service role can access everything; these are admin-only tables
CREATE POLICY "Service role full access twilio_numbers" ON twilio_numbers FOR ALL USING (true);
CREATE POLICY "Service role full access call_records" ON call_records FOR ALL USING (true);
