-- ═══════════════════════════════════════════════════════════════════════════════
-- 004_fix_security_warnings.sql
-- Fixes RLS error on client_locations and function search_path warnings
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE RLS ON client_locations (fixes the ERROR)
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE client_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own locations" ON client_locations;
DROP POLICY IF EXISTS "Users can view own locations" ON client_locations;
DROP POLICY IF EXISTS "Service role full access client_locations" ON client_locations;

-- Users can insert/select their own location data
CREATE POLICY "Users can insert own locations"
  ON client_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own locations"
  ON client_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access client_locations"
  ON client_locations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. FIX FUNCTION search_path WARNINGS
--    Drop and recreate functions with SET search_path = public
-- ─────────────────────────────────────────────────────────────────────────────────

-- Drop policies that depend on is_admin() first
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all requests" ON service_requests;

-- Drop existing functions (required when changing return types or attributes)
DROP FUNCTION IF EXISTS generate_service_code();
DROP FUNCTION IF EXISTS set_service_code_on_assign() CASCADE;
DROP FUNCTION IF EXISTS log_status_change() CASCADE;
DROP FUNCTION IF EXISTS find_nearest_providers(DOUBLE PRECISION, DOUBLE PRECISION, TEXT, DOUBLE PRECISION, INTEGER);
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS is_admin();

-- Recreate generate_service_code
CREATE FUNCTION generate_service_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    code := 'OS' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.service_requests WHERE service_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$;

-- Recreate set_service_code_on_assign
CREATE FUNCTION set_service_code_on_assign()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'assigned' AND OLD.status != 'assigned' AND NEW.service_code IS NULL THEN
    NEW.service_code := generate_service_code();
    NEW.assigned_at := NOW();
  END IF;
  
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
  END IF;
  
  IF NEW.status IN ('cancelled', 'disputed') AND OLD.status NOT IN ('cancelled', 'disputed') THEN
    NEW.cancelled_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate log_status_change
CREATE FUNCTION log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.request_events (request_id, event_type, previous_status, new_status, metadata)
    VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      jsonb_build_object('changed_at', NOW())
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate find_nearest_providers
CREATE FUNCTION find_nearest_providers(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_service_type TEXT DEFAULT NULL,
  p_radius_km DOUBLE PRECISION DEFAULT 25,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  provider_id UUID,
  distance_km DOUBLE PRECISION,
  rating NUMERIC,
  total_jobs INTEGER,
  quality_score DOUBLE PRECISION
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS provider_id,
    (6371 * acos(
      cos(radians(p_lat)) * cos(radians(pl.lat)) *
      cos(radians(pl.lng) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(pl.lat))
    )) AS distance_km,
    COALESCE(ps.average_rating, 4.0) AS rating,
    COALESCE(ps.total_completed, 0) AS total_jobs,
    (
      COALESCE(ps.average_rating, 4.0) * 0.4 +
      (1 - LEAST((6371 * acos(
        cos(radians(p_lat)) * cos(radians(pl.lat)) *
        cos(radians(pl.lng) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(pl.lat))
      )) / p_radius_km, 1)) * 10 * 0.4 +
      LEAST(COALESCE(ps.total_completed, 0) / 100.0, 1) * 10 * 0.2
    ) AS quality_score
  FROM public.providers p
  JOIN public.provider_locations pl ON pl.provider_id = p.id
  LEFT JOIN public.provider_stats ps ON ps.provider_id = p.id
  LEFT JOIN public.provider_availability pa ON pa.provider_id = p.id
  WHERE p.status = 'active'
    AND p.is_verified = true
    AND (pa.is_available = true OR pa.is_available IS NULL)
    AND (p_service_type IS NULL OR p_service_type = ANY(p.service_types))
    AND (6371 * acos(
      cos(radians(p_lat)) * cos(radians(pl.lat)) *
      cos(radians(pl.lng) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(pl.lat))
    )) <= p_radius_km
  ORDER BY quality_score DESC
  LIMIT p_limit;
END;
$$;

-- Recreate update_updated_at
CREATE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate handle_updated_at
CREATE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate handle_new_user
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate is_admin
CREATE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Recreate admin policies that depended on is_admin()
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin() = true);

CREATE POLICY "Admins can read all requests"
  ON service_requests FOR SELECT
  TO authenticated
  USING (is_admin() = true);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. RECREATE TRIGGERS (dropped with CASCADE)
-- ─────────────────────────────────────────────────────────────────────────────────

-- Trigger for auto-generating service code and timestamps on status change
DROP TRIGGER IF EXISTS trg_set_service_code ON service_requests;
CREATE TRIGGER trg_set_service_code
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION set_service_code_on_assign();

-- Trigger for logging status changes to audit trail
DROP TRIGGER IF EXISTS trg_log_status_change ON service_requests;
CREATE TRIGGER trg_log_status_change
  AFTER UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- Trigger for handle_new_user on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. NOTE ON REMAINING WARNINGS
-- ─────────────────────────────────────────────────────────────────────────────────
-- 
-- The following warnings are INTENTIONAL and should NOT be fixed:
--
-- a) "Service role full access" policies on call_records and twilio_numbers
--    These are backend-only tables that need service_role access for Twilio webhooks.
--    The service_role key is only used server-side, never exposed to clients.
--
-- b) "auth_leaked_password_protection" 
--    This is an Auth setting, not a database issue. Enable it in Supabase Dashboard:
--    Authentication > Settings > Password Protection > Enable leaked password check
--
-- ─────────────────────────────────────────────────────────────────────────────────
