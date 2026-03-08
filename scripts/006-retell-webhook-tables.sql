-- ═══════════════════════════════════════════════════════════════════════════════
-- OSCaller - Retell Webhook Tables & Service Request Enhancements
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. retell_webhook_events - Stores every webhook event exactly once (idempotent)
CREATE TABLE IF NOT EXISTS public.retell_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  call_id TEXT NOT NULL,
  agent_id TEXT,
  request_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Unique index for idempotent event handling (prevents duplicate retries)
CREATE UNIQUE INDEX IF NOT EXISTS retell_webhook_events_unique_event
ON public.retell_webhook_events (event, call_id);

-- Index for querying unprocessed events
CREATE INDEX IF NOT EXISTS retell_webhook_events_unprocessed
ON public.retell_webhook_events (processed) WHERE processed = false;


-- 2. call_attempts - Tracks call lifecycle for each OSCaller request
CREATE TABLE IF NOT EXISTS public.call_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  call_id TEXT UNIQUE NOT NULL,
  agent_id TEXT,
  from_number TEXT,
  to_number TEXT,
  direction TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  disconnection_reason TEXT,
  duration_ms INTEGER,
  transcript TEXT,
  summary TEXT,
  call_analysis JSONB,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for request lookups
CREATE INDEX IF NOT EXISTS call_attempts_request_id ON public.call_attempts (request_id);
CREATE INDEX IF NOT EXISTS call_attempts_status ON public.call_attempts (status);


-- 3. call_retry_queue - For handling failed call retries
CREATE TABLE IF NOT EXISTS public.call_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  previous_call_id TEXT NOT NULL,
  retry_reason TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS call_retry_queue_status ON public.call_retry_queue (status);
CREATE INDEX IF NOT EXISTS call_retry_queue_next_retry ON public.call_retry_queue (next_retry_at) WHERE status = 'pending';


-- 4. Enhance service_requests table with additional call tracking fields
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS call_status TEXT,
  ADD COLUMN IF NOT EXISTS last_call_id TEXT,
  ADD COLUMN IF NOT EXISTS call_summary TEXT,
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS dispatch_status TEXT,
  ADD COLUMN IF NOT EXISTS ai_outcome TEXT,
  ADD COLUMN IF NOT EXISTS call_analysis JSONB,
  ADD COLUMN IF NOT EXISTS call_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS call_successful BOOLEAN,
  ADD COLUMN IF NOT EXISTS call_recording_url TEXT,
  ADD COLUMN IF NOT EXISTS call_transcript TEXT;


-- 5. Enable Row Level Security
ALTER TABLE public.retell_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_retry_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for webhook processing)
CREATE POLICY "Service role full access to retell_webhook_events" ON public.retell_webhook_events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to call_attempts" ON public.call_attempts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to call_retry_queue" ON public.call_retry_queue
  FOR ALL USING (true) WITH CHECK (true);
