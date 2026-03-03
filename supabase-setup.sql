-- ╔══════════════════════════════════════════════════════════════╗
-- ║  OSCaller — Supabase Setup SQL                              ║
-- ║  Run this in the Supabase SQL Editor                        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── 1. Profiles table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'technician', 'customer')),
  trade TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  services TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Service requests table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_requests (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  service TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('emergency', 'urgent', 'standard')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  technician_id UUID REFERENCES public.profiles(id),
  technician_name TEXT,
  eta_minutes INTEGER,
  amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─── 3. Request events timeline ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT REFERENCES public.service_requests(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. Enable RLS ──────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_events ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- RLS: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS: Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: Admins can read all requests
CREATE POLICY "Admins can read all requests" ON public.service_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: Technicians can read their assigned requests
CREATE POLICY "Technicians can read assigned requests" ON public.service_requests
  FOR SELECT USING (technician_id = auth.uid());

-- RLS: Customers can read their own requests
CREATE POLICY "Customers can read own requests" ON public.service_requests
  FOR SELECT USING (customer_id = auth.uid());

-- RLS: Service role bypass (for API routes)
CREATE POLICY "Service role full access profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access requests" ON public.service_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access events" ON public.request_events
  FOR ALL USING (auth.role() = 'service_role');

-- ─── 5. Auto-update updated_at trigger ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 6. Create admin user profile ────────────────────────────
-- NOTE: First create the admin user in Supabase Auth Dashboard:
--   Email: ai.paons@gmail.com
--   Password: Desh0011/**
-- Then get the user ID and run:
-- (Replace 'YOUR_ADMIN_USER_ID' with the actual UUID from Auth > Users)

-- INSERT INTO public.profiles (id, name, email, role, created_at)
-- VALUES ('YOUR_ADMIN_USER_ID', 'Admin', 'ai.paons@gmail.com', 'admin', NOW());

-- ─── 7. Auto-create profile on signup ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 8. Indexes for performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_trade ON public.profiles(trade);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_technician ON public.service_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_requests_service ON public.service_requests(service);
CREATE INDEX IF NOT EXISTS idx_request_events_request ON public.request_events(request_id);
