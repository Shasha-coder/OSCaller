// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/retell/webhook - Production-ready Retell AI webhook handler
// Features: Signature verification, idempotent processing, retry handling
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { redis } from '@/lib/redis'
import { verifyRetellWebhookSignature } from '@/lib/retell/verify-webhook'
import { findProviders, createDispatchOffers } from '@/lib/dispatch'

export const dynamic = 'force-dynamic'

type RetellWebhookPayload = {
  event: 'call_started' | 'call_ended' | 'call_analyzed' | 'transcript_updated'
  call: {
    call_id: string
    agent_id?: string
    call_type?: string
    from_number?: string
    to_number?: string
    direction?: string
    start_timestamp?: number | string
    end_timestamp?: number | string
    duration_ms?: number
    disconnection_reason?: string
    transcript?: string
    transcript_with_tool_calls?: string
    transcript_object?: Array<{ role: 'agent' | 'user'; content: string }>
    recording_url?: string
    public_log_url?: string
    metadata?: Record<string, unknown>
    call_analysis?: {
      call_summary?: string
      user_sentiment?: 'Negative' | 'Neutral' | 'Positive'
      call_successful?: boolean
      custom_analysis_data?: Record<string, unknown>
      booked?: boolean
      dispatch_confirmed?: boolean
      escalation_required?: boolean
      customer_unreachable?: boolean
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

// GET - Health check for Retell to verify endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'retell-webhook',
    version: '2.0',
    timestamp: new Date().toISOString(),
  })
}

// POST - Main webhook handler
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-retell-signature')

  let body: RetellWebhookPayload
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify webhook signature using Retell SDK
  // Uses RETELL_API_KEY (the key with webhook badge in Retell dashboard)
  const isValid = verifyRetellWebhookSignature({
    rawBody,
    signature,
    apiKey: process.env.RETELL_API_KEY,
  })

  if (!isValid) {
    console.error('[Retell Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = body.event
  const call = body.call
  const callId = call?.call_id

  if (!event || !callId) {
    return NextResponse.json({ error: 'Missing event or call.call_id' }, { status: 400 })
  }

  const requestId = typeof call?.metadata?.request_id === 'string' 
    ? call.metadata.request_id 
    : null

  console.log(`[Retell Webhook] ${event} for call ${callId}${requestId ? ` (request: ${requestId})` : ''}`)

  const db = createServerClient()

  // Idempotent raw event insert (upsert to handle retries)
  const { error: insertError } = await db
    .from('retell_webhook_events')
    .upsert(
      {
        event,
        call_id: callId,
        agent_id: call.agent_id ?? null,
        request_id: requestId,
        payload: body,
        processed: false,
      },
      {
        onConflict: 'event,call_id',
        ignoreDuplicates: false,
      }
    )

  if (insertError) {
    console.error('[Retell Webhook] Failed to persist event:', insertError)
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
  }

  // Respond fast to Retell (within 10 second requirement), process async
  queueMicrotask(async () => {
    try {
      await processRetellWebhook(body)
    } catch (err) {
      console.error('[Retell Webhook] Async processing failed:', err)
      await db
        .from('retell_webhook_events')
        .update({
          processing_error: err instanceof Error ? err.message : 'Unknown processing error',
        })
        .eq('event', event)
        .eq('call_id', callId)
    }
  })

  return new NextResponse(null, { status: 204 })
}

// ─── Event Processing ───────────────────────────────────────────────────────────

async function processRetellWebhook(payload: RetellWebhookPayload) {
  const { event, call } = payload
  const callId = call.call_id
  const requestId = typeof call?.metadata?.request_id === 'string' 
    ? call.metadata.request_id 
    : null

  switch (event) {
    case 'call_started':
      await handleCallStarted(call, requestId)
      break
    case 'call_ended':
      await handleCallEnded(call, requestId)
      break
    case 'call_analyzed':
      await handleCallAnalyzed(call, requestId)
      break
    case 'transcript_updated':
      await handleTranscriptUpdated(call, requestId)
      break
    default:
      console.warn('[Retell Webhook] Unhandled event:', event)
  }

  // Mark event as processed
  const db = createServerClient()
  await db
    .from('retell_webhook_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      processing_error: null,
    })
    .eq('event', event)
    .eq('call_id', callId)
}

async function handleCallStarted(
  call: RetellWebhookPayload['call'],
  requestId: string | null
) {
  const db = createServerClient()

  // Upsert to call_attempts
  await db.from('call_attempts').upsert(
    {
      request_id: requestId ?? 'unknown',
      call_id: call.call_id,
      agent_id: call.agent_id ?? null,
      from_number: call.from_number ?? null,
      to_number: call.to_number ?? null,
      direction: call.direction ?? null,
      status: 'connected',
      started_at: normalizeTimestamp(call.start_timestamp),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'call_id' }
  )

  // Update Redis session
  const session = await redis.get(`call:${call.call_id}`)
  if (session) {
    const parsed = JSON.parse(session as string)
    await redis.set(
      `call:${call.call_id}`,
      JSON.stringify({ ...parsed, status: 'active' }),
      { ex: 3600 }
    )
  }

  // Update service_request
  if (requestId) {
    await db
      .from('service_requests')
      .update({ 
        call_status: 'connected', 
        last_call_id: call.call_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    await db.from('request_events').insert({
      request_id: requestId,
      label: 'Aria connected to customer',
      status: 'active',
      actor_type: 'agent',
      metadata: JSON.stringify({
        call_id: call.call_id,
        agent_id: call.agent_id,
      }),
    })
  }
}

async function handleCallEnded(
  call: RetellWebhookPayload['call'],
  requestId: string | null
) {
  const db = createServerClient()
  const disconnectionReason = typeof call.disconnection_reason === 'string'
    ? call.disconnection_reason
    : null

  const mappedStatus = mapDisconnectionReasonToStatus(disconnectionReason)
  const durationMs = typeof call.duration_ms === 'number' ? call.duration_ms : null

  // Upsert to call_attempts
  await db.from('call_attempts').upsert(
    {
      request_id: requestId ?? 'unknown',
      call_id: call.call_id,
      agent_id: call.agent_id ?? null,
      from_number: call.from_number ?? null,
      to_number: call.to_number ?? null,
      direction: call.direction ?? null,
      status: mappedStatus,
      disconnection_reason: disconnectionReason,
      duration_ms: durationMs,
      ended_at: normalizeTimestamp(call.end_timestamp) ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'call_id' }
  )

  // Update Redis session
  await redis.set(
    `call:${call.call_id}`,
    JSON.stringify({
      call_id: call.call_id,
      status: 'ended',
      ended_at: new Date().toISOString(),
      disconnection_reason: disconnectionReason,
      transcript: call.transcript,
    }),
    { ex: 86400 } // Keep for 24 hours
  )

  // Update service_request
  if (requestId) {
    const durationSec = durationMs ? Math.round(durationMs / 1000) : 0

    await db
      .from('service_requests')
      .update({
        call_status: mappedStatus,
        last_call_id: call.call_id,
        call_recording_url: call.recording_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    await db.from('request_events').insert({
      request_id: requestId,
      label: `Call ended (${durationSec}s)`,
      status: 'complete',
      actor_type: 'agent',
      metadata: JSON.stringify({
        call_id: call.call_id,
        duration_seconds: durationSec,
        disconnection_reason: disconnectionReason,
      }),
    })
  }

  // Schedule retry for failed connections
  if (
    requestId &&
    ['dial_no_answer', 'dial_busy', 'dial_failed'].includes(disconnectionReason ?? '')
  ) {
    await scheduleRetry(requestId, call.call_id, disconnectionReason ?? 'unknown')
  }
}

async function handleCallAnalyzed(
  call: RetellWebhookPayload['call'],
  requestId: string | null
) {
  const db = createServerClient()
  const transcript = typeof call.transcript === 'string' ? call.transcript : null
  const callAnalysis = call.call_analysis ?? null

  const summary = callAnalysis?.call_summary ?? null
  const sentiment = callAnalysis?.user_sentiment ?? null
  const successful = callAnalysis?.call_successful ?? null

  // Update call_attempts with analysis
  await db.from('call_attempts').upsert(
    {
      request_id: requestId ?? 'unknown',
      call_id: call.call_id,
      transcript,
      summary,
      call_analysis: callAnalysis,
      status: 'analyzed',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'call_id' }
  )

  // Update service_request
  if (requestId) {
    const aiOutcome = inferAiOutcome(callAnalysis)

    await db
      .from('service_requests')
      .update({
        call_status: 'analyzed',
        ai_outcome: aiOutcome,
        call_summary: summary,
        call_transcript: transcript,
        transcript: transcript,
        call_analysis: callAnalysis,
        call_sentiment: sentiment,
        call_successful: successful,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    await db.from('request_events').insert({
      request_id: requestId,
      label: successful ? 'Call successful - ready for dispatch' : 'Call needs review',
      status: 'complete',
      actor_type: 'system',
      metadata: JSON.stringify(callAnalysis),
    })

    // Store transcript for later retrieval
    if (call.transcript_object?.length) {
      await redis.set(
        `call:${call.call_id}:transcript`,
        JSON.stringify(call.transcript_object),
        { ex: 604800 } // 7 days
      )
    }

    // Trigger provider dispatch if call confirmed service need
    if (successful || callAnalysis?.dispatch_confirmed) {
      await maybeDispatchProvider({
        requestId,
        callId: call.call_id,
        callAnalysis,
        transcript,
      })
    }
  }
}

async function handleTranscriptUpdated(
  call: RetellWebhookPayload['call'],
  requestId: string | null
) {
  const transcript = typeof call.transcript_with_tool_calls === 'string'
    ? call.transcript_with_tool_calls
    : typeof call.transcript === 'string'
    ? call.transcript
    : null

  if (!transcript) return

  const db = createServerClient()

  await db
    .from('call_attempts')
    .update({
      transcript,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', call.call_id)

  if (requestId) {
    await db
      .from('service_requests')
      .update({
        transcript,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────────────

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null

  if (typeof value === 'string') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  if (typeof value === 'number') {
    // Handle both seconds and milliseconds
    const ms = value < 10_000_000_000 ? value * 1000 : value
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  return null
}

function mapDisconnectionReasonToStatus(reason: string | null): string {
  switch (reason) {
    case 'dial_no_answer':
      return 'no_answer'
    case 'dial_busy':
      return 'busy'
    case 'dial_failed':
      return 'failed'
    case 'voicemail':
      return 'voicemail'
    case 'agent_hangup':
    case 'user_hangup':
      return 'completed'
    default:
      return 'ended'
  }
}

function inferAiOutcome(callAnalysis: RetellWebhookPayload['call']['call_analysis']): string {
  if (!callAnalysis) return 'unknown'

  if (callAnalysis.booked === true) return 'booked'
  if (callAnalysis.dispatch_confirmed === true) return 'dispatch_confirmed'
  if (callAnalysis.call_successful === true) return 'service_confirmed'
  if (callAnalysis.escalation_required === true) return 'escalation_required'
  if (callAnalysis.customer_unreachable === true) return 'customer_unreachable'

  return 'review_needed'
}

async function scheduleRetry(
  requestId: string,
  previousCallId: string,
  reason: string
) {
  const db = createServerClient()

  // Check existing retries
  const { data: existing } = await db
    .from('call_retry_queue')
    .select('retry_count, max_retries')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .limit(1)

  const retryCount = (existing?.[0]?.retry_count ?? 0) + 1
  const maxRetries = existing?.[0]?.max_retries ?? 3

  if (retryCount > maxRetries) {
    console.log(`[Retell Webhook] Max retries exceeded for request ${requestId}`)
    await db
      .from('service_requests')
      .update({
        call_status: 'failed_all_attempts',
        ai_outcome: 'customer_unreachable',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
    return
  }

  // Schedule retry with exponential backoff (30s, 60s, 120s)
  const delayMs = 30000 * Math.pow(2, retryCount - 1)
  const nextRetryAt = new Date(Date.now() + delayMs).toISOString()

  await db.from('call_retry_queue').insert({
    request_id: requestId,
    previous_call_id: previousCallId,
    retry_reason: reason,
    retry_count: retryCount,
    max_retries: maxRetries,
    status: 'pending',
    next_retry_at: nextRetryAt,
  })

  console.log(`[Retell Webhook] Scheduled retry ${retryCount}/${maxRetries} for request ${requestId} at ${nextRetryAt}`)
}

async function maybeDispatchProvider(args: {
  requestId: string
  callId: string
  callAnalysis: RetellWebhookPayload['call']['call_analysis']
  transcript: string | null
}) {
  const { requestId, callId, callAnalysis } = args
  const db = createServerClient()

  console.log(`[Retell Webhook] Dispatch trigger for request ${requestId}`)

  // Get service request details
  const { data: request } = await db
    .from('service_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!request) {
    console.error(`[Retell Webhook] Request ${requestId} not found`)
    return
  }

  // Only dispatch if not already assigned
  if (request.status === 'assigned' || request.provider_id) {
    console.log(`[Retell Webhook] Request ${requestId} already has provider`)
    return
  }

  // Update dispatch status
  await db
    .from('service_requests')
    .update({
      dispatch_status: 'searching',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  // Find nearest providers based on request location
  if (request.lat && request.lng && request.service_type) {
    try {
      const providers = await findProviders({
        trade: request.service_type,
        lat: request.lat,
        lng: request.lng,
        radiusKm: 15,
        emergencyLevel: request.urgency || 'standard',
        limit: 5,
      })

      if (providers.length > 0) {
        // Create dispatch offers
        await createDispatchOffers(requestId, providers)
        
        await db
          .from('service_requests')
          .update({
            status: 'searching',
            dispatch_status: 'offers_sent',
            dispatch_attempts: providers.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId)

        await db.from('request_events').insert({
          request_id: requestId,
          label: `Finding provider (${providers.length} available)`,
          status: 'active',
          actor_type: 'system',
          metadata: JSON.stringify({
            call_id: callId,
            providers_found: providers.length,
            nearest_eta: providers[0]?.etaMinutes,
          }),
        })
      } else {
        await db
          .from('service_requests')
          .update({
            dispatch_status: 'no_providers',
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId)
      }
    } catch (error) {
      console.error('[Retell Webhook] Provider search failed:', error)
      await db
        .from('service_requests')
        .update({
          dispatch_status: 'search_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
    }
  }
}
