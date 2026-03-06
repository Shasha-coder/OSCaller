import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
    : null

/**
 * POST /api/payments/authorize — Create a Stripe pre-authorization hold
 * 
 * Called AFTER provider accepts (per spec: don't charge to search).
 * Creates a hold that's captured only after service completion.
 * 
 * Body: { request_id, amount_cents?, currency?, customer_id? }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { request_id, amount_cents = 5000, currency = 'usd', customer_id } = body

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        // Verify request exists and is assigned
        const { data: request } = await db
            .from('service_requests')
            .select('id, status, customer_id, estimated_price_cents')
            .eq('id', request_id)
            .single()

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        if (!['assigned', 'enroute'].includes(request.status || '')) {
            return NextResponse.json(
                { error: 'Can only authorize payment after provider is assigned' },
                { status: 400 }
            )
        }

        // Use estimated price if available, otherwise use provided amount
        const holdAmount = request.estimated_price_cents || amount_cents
        const now = new Date()
        const holdExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

        let paymentIntentId: string | null = null
        let clientSecret: string | null = null

        if (stripe) {
            // Create Stripe PaymentIntent with manual capture (pre-auth hold)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: holdAmount,
                currency,
                capture_method: 'manual', // Authorization hold — captured later
                metadata: { 
                    request_id,
                    customer_id: customer_id || request.customer_id || '',
                },
            })
            paymentIntentId = paymentIntent.id
            clientSecret = paymentIntent.client_secret
        }

        // Store in payments table with enhanced fields
        const { data: payment, error } = await db
            .from('payments')
            .insert({
                request_id,
                user_id: customer_id || request.customer_id,
                stripe_payment_intent_id: paymentIntentId,
                amount_cents: holdAmount,
                hold_amount_cents: holdAmount,
                hold_created_at: now.toISOString(),
                hold_expires_at: holdExpiresAt.toISOString(),
                currency,
                status: 'authorized',
            })
            .select()
            .single()

        if (error) {
            console.error('[v0] Payment insert error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update service_requests with estimated price if not set
        await db.from('service_requests')
            .update({ 
                estimated_price_cents: holdAmount,
            })
            .eq('id', request_id)

        // Log event
        await db.from('request_events').insert({
            request_id,
            label: `Payment hold created: $${(holdAmount / 100).toFixed(2)}`,
            status: 'completed',
            actor_type: 'system',
        })

        return NextResponse.json({
            success: true,
            payment_id: payment.id,
            hold_amount_cents: holdAmount,
            hold_expires_at: holdExpiresAt.toISOString(),
            client_secret: clientSecret,
            message: 'Authorization hold created. Will be captured on service completion.',
        })
    } catch (err) {
        console.error('[v0] Payment authorize error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
