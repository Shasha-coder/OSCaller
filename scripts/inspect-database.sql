-- Database State Inspector for OSCaller
-- Run this in your SQL editor and share the output

-- 1. List all tables
SELECT 'TABLES' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. retell_agents structure and data
SELECT 'RETELL_AGENTS_COLUMNS' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'retell_agents'
ORDER BY ordinal_position;

SELECT 'RETELL_AGENTS_DATA' as section;
SELECT * FROM public.retell_agents;

-- 3. retell_agents constraints
SELECT 'RETELL_AGENTS_CONSTRAINTS' as section;
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'retell_agents';

-- 4. retell_webhook_events structure
SELECT 'RETELL_WEBHOOK_EVENTS_COLUMNS' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'retell_webhook_events'
ORDER BY ordinal_position;

-- 5. call_attempts structure
SELECT 'CALL_ATTEMPTS_COLUMNS' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'call_attempts'
ORDER BY ordinal_position;

-- 6. service_requests retell columns
SELECT 'SERVICE_REQUESTS_RETELL_COLUMNS' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'service_requests'
  AND column_name LIKE '%call%' OR column_name LIKE '%retell%'
ORDER BY ordinal_position;

-- 7. providers table structure (for dispatch)
SELECT 'PROVIDERS_COLUMNS' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'providers'
ORDER BY ordinal_position;

-- 8. Count of test providers
SELECT 'PROVIDERS_COUNT' as section;
SELECT COUNT(*) as total_providers FROM public.providers;
