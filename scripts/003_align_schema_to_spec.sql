-- ═══════════════════════════════════════════════════════════════════════════════
-- OSCaller Schema Alignment Migration
-- Aligns database to dispatch pipeline spec
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. ENHANCE service_requests TABLE
--    Add fields for state machine, verification, pricing, GPS, and timestamps
-- ─────────────────────────────────────────────────────────────────────────────────

-- Service verification code (e.g., OS3460) - provider gives to client to confirm arrival
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS service_code VARCHAR(10);

-- Pricing
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS estimated_price_cents INTEGER DEFAULT 0;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS final_price_cents INTEGER;

-- Live GPS for client (streamed from their device)
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS client_lat DOUBLE PRECISION;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS client_lng DOUBLE PRECISION;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS client_location_updated_at TIMESTAMPTZ;

-- Live GPS for assigned provider (copied from provider_locations for quick access)
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS provider_lat DOUBLE PRECISION;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS provider_lng DOUBLE PRECISION;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS provider_location_updated_at TIMESTAMPTZ;

-- Critical timestamps for state machine
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS enroute_at TIMESTAMPTZ;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS arrival_confirmed_at TIMESTAMPTZ;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMPTZ;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMPTZ;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Cancellation/dispute metadata
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS cancelled_by TEXT; -- 'client', 'provider', 'system'

-- Dispatch metadata
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS dispatch_attempts INTEGER DEFAULT 0;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS current_offer_id TEXT;

-- Call session reference (call_records.id is TEXT)
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS call_record_id TEXT;

-- Create index on status for fast queries
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_technician ON service_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer ON service_requests(customer_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. ENHANCE dispatch_offers TABLE
--    Add offer sequencing and decline tracking
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE dispatch_offers ADD COLUMN IF NOT EXISTS offer_sequence INTEGER DEFAULT 1;
ALTER TABLE dispatch_offers ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE dispatch_offers ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMPTZ;

-- Create index for fast offer lookups
CREATE INDEX IF NOT EXISTS idx_dispatch_offers_request ON dispatch_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_offers_provider ON dispatch_offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_offers_status ON dispatch_offers(status);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. ENHANCE payments TABLE
--    Add pre-authorization (hold) model per spec
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE payments ADD COLUMN IF NOT EXISTS hold_amount_cents INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS final_amount_cents INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS hold_created_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_amount_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payout_cents INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. CREATE client_locations TABLE
--    GPS streaming history for clients (like provider_locations)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES service_requests(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_locations_user ON client_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_locations_request ON client_locations(request_id);
CREATE INDEX IF NOT EXISTS idx_client_locations_time ON client_locations(recorded_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. ENHANCE request_events TABLE
--    Add actor tracking for audit trail
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE request_events ADD COLUMN IF NOT EXISTS actor_type TEXT; -- 'client', 'provider', 'agent', 'system'
ALTER TABLE request_events ADD COLUMN IF NOT EXISTS actor_id TEXT;
ALTER TABLE request_events ADD COLUMN IF NOT EXISTS previous_status TEXT;
ALTER TABLE request_events ADD COLUMN IF NOT EXISTS new_status TEXT;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. CREATE STATUS ENUM COMMENT (for documentation)
--    Full state machine: draft → qualified → searching → assigned → enroute → 
--    arrived → in_progress → completed | cancelled | disputed
-- ─────────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN service_requests.status IS 
'Request lifecycle states:
- draft: Initial creation, incomplete info
- qualified: All info collected, ready for dispatch
- searching: Actively looking for provider (offers being sent)
- assigned: Provider accepted, not yet moving
- enroute: Provider is traveling to client
- arrived: Provider at location, waiting for code verification
- in_progress: Work has started (code verified)
- completed: Work finished, payment captured
- cancelled: Cancelled by client/provider/system
- disputed: Under review due to issue';

-- ─────────────────────────────────────────────────────────────────────────────────
-- 7. FUNCTION: Generate service verification code
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_service_code() 
RETURNS VARCHAR(10) AS $$
DECLARE
  code VARCHAR(10);
BEGIN
  -- Format: OS + 4 random digits (e.g., OS3460)
  code := 'OS' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 8. TRIGGER: Auto-generate service_code when status becomes 'assigned'
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_service_code_on_assign()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'assigned' AND (OLD.status IS NULL OR OLD.status != 'assigned') THEN
    IF NEW.service_code IS NULL THEN
      NEW.service_code := generate_service_code();
    END IF;
    NEW.assigned_at := NOW();
  END IF;
  
  -- Track other status timestamps
  IF NEW.status = 'enroute' AND OLD.status != 'enroute' THEN
    NEW.enroute_at := NOW();
  END IF;
  
  IF NEW.status = 'arrived' AND OLD.status != 'arrived' THEN
    NEW.arrival_confirmed_at := NOW();
  END IF;
  
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.work_started_at := NOW();
  END IF;
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.work_completed_at := NOW();
    NEW.completed_at := NOW();
  END IF;
  
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_code_on_assign ON service_requests;
CREATE TRIGGER trg_service_code_on_assign
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_service_code_on_assign();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 9. TRIGGER: Log status changes to request_events
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO request_events (
      request_id, 
      label, 
      status, 
      previous_status,
      new_status,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      'status_change',
      'active',
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'technician_id', NEW.technician_id,
        'service_code', NEW.service_code
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_status_change ON service_requests;
CREATE TRIGGER trg_log_status_change
  AFTER UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 10. FUNCTION: Find nearest available providers
--     Used by dispatch to get ranked provider list
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION find_nearest_providers(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_trade TEXT,
  p_radius_km DOUBLE PRECISION DEFAULT 25,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  provider_id UUID,
  full_name TEXT,
  phone TEXT,
  trade TEXT,
  distance_km DOUBLE PRECISION,
  eta_minutes DOUBLE PRECISION,
  quality_score DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS provider_id,
    p.full_name,
    p.phone,
    p.trade,
    -- Haversine distance in km
    (6371 * acos(
      cos(radians(p_lat)) * cos(radians(pl.lat)) * 
      cos(radians(pl.lng) - radians(p_lng)) + 
      sin(radians(p_lat)) * sin(radians(pl.lat))
    )) AS distance_km,
    -- Rough ETA: distance / 40km/h average speed * 60 minutes
    ((6371 * acos(
      cos(radians(p_lat)) * cos(radians(pl.lat)) * 
      cos(radians(pl.lng) - radians(p_lng)) + 
      sin(radians(p_lat)) * sin(radians(pl.lat))
    )) / 40) * 60 AS eta_minutes,
    -- Quality score from stats
    COALESCE(ps.average_rating, 5.0) * 0.4 + 
    COALESCE(ps.on_time_rate, 1.0) * 0.3 + 
    (1 - LEAST(COALESCE(ps.complaint_count, 0)::FLOAT / 10, 1)) * 0.3 AS quality_score,
    pl.lat,
    pl.lng
  FROM providers p
  JOIN provider_locations pl ON pl.provider_id = p.id
  LEFT JOIN provider_stats ps ON ps.provider_id = p.id
  LEFT JOIN provider_availability pa ON pa.provider_id = p.id
  WHERE 
    p.is_active = true
    AND p.trade = p_trade
    AND (pa.is_online = true OR pa.is_online IS NULL)
    -- Within radius
    AND (6371 * acos(
      cos(radians(p_lat)) * cos(radians(pl.lat)) * 
      cos(radians(pl.lng) - radians(p_lng)) + 
      sin(radians(p_lat)) * sin(radians(pl.lat))
    )) <= p_radius_km
    -- Has recent location (within 30 min)
    AND pl.recorded_at > NOW() - INTERVAL '30 minutes'
    -- Not currently on another job
    AND NOT EXISTS (
      SELECT 1 FROM service_requests sr 
      WHERE sr.technician_id = p.id 
      AND sr.status IN ('assigned', 'enroute', 'arrived', 'in_progress')
    )
  ORDER BY 
    quality_score DESC,
    distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────��──────────────────
-- 11. REALTIME: Enable realtime for key tables
--     Note: Run these individually. If table already exists in publication, skip it.
-- ─────────────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  -- service_requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'service_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
  END IF;
  
  -- dispatch_offers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'dispatch_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dispatch_offers;
  END IF;
  
  -- provider_locations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'provider_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE provider_locations;
  END IF;
  
  -- client_locations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'client_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE client_locations;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE - Schema now aligned with dispatch pipeline spec
-- ═══════════════════════════════════════════════════════════════════════════════
