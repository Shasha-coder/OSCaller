-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 004: Retell AI Agents Table
-- Manages AI agents per country with phone numbers and configurations
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Create retell_agents table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.retell_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Retell identifiers
  agent_id TEXT NOT NULL, -- Retell's agent ID
  name TEXT NOT NULL,
  
  -- Country/Language configuration
  country_code TEXT NOT NULL, -- 'CA', 'US', 'FR'
  language TEXT NOT NULL DEFAULT 'en-US', -- Retell language code
  
  -- Phone number (E.164 format)
  phone_number TEXT NOT NULL,
  
  -- Voice settings
  voice_id TEXT DEFAULT 'retell-Cimo',
  voice_model TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_country_agent UNIQUE (country_code)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_retell_agents_country ON public.retell_agents(country_code);
CREATE INDEX IF NOT EXISTS idx_retell_agents_active ON public.retell_agents(is_active) WHERE is_active = true;

-- ── 2. Add call fields to service_requests ───────────────────────────────────
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS call_id TEXT,
  ADD COLUMN IF NOT EXISTS call_status TEXT,
  ADD COLUMN IF NOT EXISTS call_transcript TEXT,
  ADD COLUMN IF NOT EXISTS call_recording_url TEXT,
  ADD COLUMN IF NOT EXISTS call_analysis JSONB,
  ADD COLUMN IF NOT EXISTS call_summary TEXT,
  ADD COLUMN IF NOT EXISTS call_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS call_successful BOOLEAN;

-- Index for call lookups
CREATE INDEX IF NOT EXISTS idx_service_requests_call_id ON public.service_requests(call_id);

-- ── 3. RLS Policies ──────────────────────────────────────────────────────────
ALTER TABLE public.retell_agents ENABLE ROW LEVEL SECURITY;

-- Admin can manage agents (check is_admin function exists)
DROP POLICY IF EXISTS admin_manage_agents ON public.retell_agents;
CREATE POLICY admin_manage_agents ON public.retell_agents 
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Service role full access
DROP POLICY IF EXISTS service_role_agents ON public.retell_agents;
CREATE POLICY service_role_agents ON public.retell_agents 
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── 4. Enable Realtime ───────────────────────────────────────────────────────
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'retell_agents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE retell_agents;
  END IF;
END $$;

-- ── 5. Insert default agents (update with real Retell IDs later) ─────────────
INSERT INTO public.retell_agents (agent_id, name, country_code, language, phone_number, is_active)
VALUES 
  ('pending-ca', 'Aria (Canada)', 'CA', 'en-CA', '+1XXXXXXXXXX', false),
  ('pending-us', 'Aria (USA)', 'US', 'en-US', '+1XXXXXXXXXX', false)
ON CONFLICT (country_code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor, then update the agent_id and phone_number
-- with your actual Retell credentials
-- ══════════════════════════════════════════════════════════════════════════════
