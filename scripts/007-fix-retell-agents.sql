-- Fix retell_agents table - add missing columns if they don't exist

-- Add service_line column if missing
ALTER TABLE public.retell_agents
  ADD COLUMN IF NOT EXISTS service_line TEXT;

-- Add other columns that might be missing
ALTER TABLE public.retell_agents
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Aria',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop and recreate the unique index to include service_line
DROP INDEX IF EXISTS retell_agents_country_service;

CREATE UNIQUE INDEX IF NOT EXISTS retell_agents_country_service 
ON public.retell_agents (country_code, service_line) WHERE is_active = true;

-- Seed initial agent configurations (update existing or insert new)
INSERT INTO public.retell_agents (country_code, service_line, agent_id, phone_number, language, name, is_active)
VALUES
  ('CA', 'general', 'REPLACE_WITH_AGENT_ID', 'REPLACE_WITH_PHONE', 'en-US', 'Aria', true),
  ('US', 'general', 'REPLACE_WITH_AGENT_ID', 'REPLACE_WITH_PHONE', 'en-US', 'Aria', true)
ON CONFLICT (country_code, service_line) WHERE is_active = true DO UPDATE SET
  agent_id = EXCLUDED.agent_id,
  phone_number = EXCLUDED.phone_number,
  language = EXCLUDED.language,
  name = EXCLUDED.name;
