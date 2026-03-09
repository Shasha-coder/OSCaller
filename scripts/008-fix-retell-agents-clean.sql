-- Fix retell_agents table: drop old constraint, add service_line, create proper index

-- 1. Drop old unique constraint that only allowed one agent per country
ALTER TABLE public.retell_agents 
DROP CONSTRAINT IF EXISTS unique_country_agent;

-- 2. Add service_line column if missing
ALTER TABLE public.retell_agents 
ADD COLUMN IF NOT EXISTS service_line TEXT DEFAULT 'general';

-- 3. Update existing rows to have service_line = 'general'
UPDATE public.retell_agents 
SET service_line = 'general' 
WHERE service_line IS NULL;

-- 4. Drop old index if exists
DROP INDEX IF EXISTS retell_agents_country_service;

-- 5. Create new unique index on (country_code, service_line) for active agents
CREATE UNIQUE INDEX retell_agents_country_service 
ON public.retell_agents (country_code, service_line) 
WHERE is_active = true;

-- 6. Show current state
SELECT * FROM public.retell_agents;
