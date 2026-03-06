// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/retell/webhook - Receive call events from Retell AI
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { redis } from '@/lib/redis'

// Retell webhook event types
interface RetellWebhookEvent {
  event: 'call_started' | 'call_ended' | 'call_analyzed'
  call: {
    call_id: string
    agent_id: string
    call_type: 'phone_call' | 'web_call'
    call_status: 'registered' | 'ongoing' | 'ended' | 'error'
    from_number?: string
    to_number?: string
    direction?: 'inbound' | 'outbound'
    start_timestamp?: number
    end_timestamp?: number
    transcript?: string
    transcript_object?: Array<{
      role: 'agent' | 'user'
      content: string
    }>
    recording_url?: string
    public_log_url?: string
    disconnection_reason?: string
    call_analysis?: {
      call_summary?: string
      user_sentiment?: 'Negative' | 'Neutral' | 'Positive'
      call_successful?: boolean
      custom_analysis_data?: Record<string, unknown>
    }
    metadata?: {
      request_id?: string
      country?: string
      source?: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const event: RetellWebhookEvent = await request.json()
    const { call } = event

    console.log(`[Retell Webhook] ${event.event} for call ${call.call_id}`)

    const db = createServerClient()
    const requestId = call.metadata?.request_id

    switch (event.event) {
      case 'call_started': {
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
            .update({ call_status: 'active' })
            .eq('id', requestId)

          await db.from('request_events').insert({
            request_id: requestId,
            label: 'AI agent connected',
            status: 'active',
            actor_type: 'agent',
            metadata: JSON.stringify({
              call_id: call.call_id,
              agent_id: call.agent_id,
            }),
          })
        }
        break
      }

      case 'call_ended': {
        // Update Redis session
        await redis.set(
          `call:${call.call_id}`,
          JSON.stringify({
            call_id: call.call_id,
            status: 'ended',
            ended_at: new Date().toISOString(),
            disconnection_reason: call.disconnection_reason,
            transcript: call.transcript,
          }),
          { ex: 86400 } // Keep for 24 hours
        )

        // Update service_request
        if (requestId) {
          await db
            .from('service_requests')
            .update({
              call_status: 'ended',
              call_transcript: call.transcript,
              call_recording_url: call.recording_url,
            })
            .eq('id', requestId)

          // Calculate duration
          const durationMs = call.end_timestamp && call.start_timestamp
            ? call.end_timestamp - call.start_timestamp
            : 0
          const durationSec = Math.round(durationMs / 1000)

          await db.from('request_events').insert({
            request_id: requestId,
            label: `Call ended (${durationSec}s)`,
            status: 'complete',
            actor_type: 'agent',
            metadata: JSON.stringify({
              call_id: call.call_id,
              duration_seconds: durationSec,
              disconnection_reason: call.disconnection_reason,
            }),
          })
        }
        break
      }

      case 'call_analyzed': {
        // Store call analysis
        if (requestId && call.call_analysis) {
          await db
            .from('service_requests')
            .update({
              call_analysis: call.call_analysis,
              call_summary: call.call_analysis.call_summary,
              call_sentiment: call.call_analysis.user_sentiment,
              call_successful: call.call_analysis.call_successful,
            })
            .eq('id', requestId)

          // Log analysis
          await db.from('request_events').insert({
            request_id: requestId,
            label: `Call ${call.call_analysis.call_successful ? 'successful' : 'needs review'}`,
            status: 'complete',
            actor_type: 'system',
            metadata: JSON.stringify(call.call_analysis),
          })
        }

        // Store transcript
        if (call.transcript_object?.length) {
          await redis.set(
            `call:${call.call_id}:transcript`,
            JSON.stringify(call.transcript_object),
            { ex: 604800 } // 7 days
          )
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Retell Webhook Error]', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'retell-webhook',
    timestamp: new Date().toISOString(),
  })
}
