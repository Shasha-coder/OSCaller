import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * POST /api/agent/webhook — ElevenLabs conversation event webhook
 *
 * Receives events from the ElevenLabs Conversational AI and updates
 * request status accordingly.
 *
 * Expected headers:
 * - x-elevenlabs-signature: HMAC signature for verification
 * - x-idempotency-key: Unique key to prevent duplicate processing
 */

function verifySignature(body: string, signature: string | null, secret: string): boolean {
    if (!signature || !secret) return false
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// Simple in-memory idempotency (use Redis/Upstash in production)
const processedKeys = new Set<string>()

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()
        const signature = req.headers.get('x-elevenlabs-signature')
        const idempotencyKey = req.headers.get('x-idempotency-key')

        // 1. Verify webhook signature
        const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET
        if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // 2. Check idempotency
        if (idempotencyKey) {
            if (processedKeys.has(idempotencyKey)) {
                return NextResponse.json({ status: 'already_processed' })
            }
            processedKeys.add(idempotencyKey)
            // Clean old keys (cap at 10k)
            if (processedKeys.size > 10000) {
                const iterator = processedKeys.values()
                for (let i = 0; i < 5000; i++) {
                    processedKeys.delete(iterator.next().value!)
                }
            }
        }

        // 3. Parse event
        const event = JSON.parse(rawBody)
        const { type, request_id, data } = event

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        // 4. Handle event types (using service_requests table)
        switch (type) {
            case 'conversation.started':
                await db.from('request_events').insert({
                    request_id,
                    label: 'AI agent connected',
                    status: 'active',
                    actor_type: 'agent',
                    metadata: JSON.stringify({ agent_id: data?.agent_id }),
                })
                break

            case 'conversation.status_update':
                if (data?.status) {
                    // Map to our state machine statuses
                    const statusMap: Record<string, string> = {
                        'searching': 'searching',
                        'found': 'assigned',
                        'en-route': 'enroute',
                        'arrived': 'arrived',
                        'in-progress': 'in_progress',
                        'completed': 'completed',
                        'cancelled': 'cancelled',
                    }
                    const mappedStatus = statusMap[data.status] || data.status

                    await db.from('service_requests')
                        .update({ status: mappedStatus })
                        .eq('id', request_id)

                    await db.from('request_events').insert({
                        request_id,
                        label: data.label || `Status: ${mappedStatus}`,
                        status: 'active',
                        actor_type: 'agent',
                        new_status: mappedStatus,
                        metadata: JSON.stringify(data),
                    })
                }
                break

            case 'conversation.provider_found':
                if (data?.provider_id) {
                    await db.from('service_requests')
                        .update({ 
                            status: 'assigned', 
                            provider_id: data.provider_id,
                            assigned_at: new Date().toISOString(),
                        })
                        .eq('id', request_id)

                    await db.from('request_events').insert({
                        request_id,
                        label: `Assigned: ${data.provider_name || 'Provider'} (${data.rating || ''}★, ${data.jobs || ''} jobs)`,
                        status: 'active',
                        actor_type: 'agent',
                        new_status: 'assigned',
                        metadata: JSON.stringify(data),
                    })
                }
                break

            case 'conversation.ended':
                await db.from('request_events').insert({
                    request_id,
                    label: 'AI agent disconnected',
                    status: 'complete',
                    actor_type: 'agent',
                    metadata: JSON.stringify({ duration_seconds: data?.duration }),
                })
                break

            default:
                // Log unknown events
                await db.from('request_events').insert({
                    request_id,
                    label: `Agent event: ${type}`,
                    status: 'active',
                    actor_type: 'agent',
                    metadata: JSON.stringify(event),
                })
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
