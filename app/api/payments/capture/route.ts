import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
    : null

/**
 * POST /api/payments/capture — Capture payment on service completion
 * 
 * Called when service is marked complete.
 * Can capture full hold amount or partial (if final price differs).
 * 
 * Body: { request_id, final_amount_cents?, tip_cents?, platform_fee_cents? }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { request_id, final_amount_cents, tip_cents = 0, platform_fee_cents } = body

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        // Verify request is completed
        const { data: request } = await db
            .from('service_requests')
            .select('id, status, estimated_price_cents')
            .eq('id', request_id)
            .single()

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        if (request.status !== 'completed') {
            return NextResponse.json(
                { error: 'Can only capture payment for completed requests' },
                { status: 400 }
            )
        }

        // Get authorized payment
        const { data: payment } = await db
            .from('payments')
            .select('*')
            .eq('request_id', request_id)
            .eq('status', 'authorized')
            .single()

        if (!payment) {
            return NextResponse.json({ error: 'No authorized payment found' }, { status: 404 })
        }

        // Calculate final amounts
        const captureAmount = final_amount_cents || payment.hold_amount_cents || payment.amount_cents
        const totalWithTip = captureAmount + tip_cents
        const fee = platform_fee_cents || Math.round(captureAmount * 0.15) // 15% default platform fee

        // Capture via Stripe
        if (stripe && payment.stripe_payment_intent_id) {
            await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
                amount_to_capture: Math.min(totalWithTip, payment.hold_amount_cents || totalWithTip),
            })
        }

        // Update payments table with breakdown
        await db.from('payments')
            .update({
                status: 'captured',
                amount_cents: captureAmount,
                tip_cents: tip_cents,
                platform_fee_cents: fee,
                provider_payout_cents: captureAmount + tip_cents - fee,
                captured_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

        // Update service_requests with final price
        await db.from('service_requests')
            .update({ 
                final_price_cents: captureAmount,
            })
            .eq('id', request_id)

        // Log event
        await db.from('request_events').insert({
            request_id,
            label: `Payment captured: $${(totalWithTip / 100).toFixed(2)}${tip_cents > 0 ? ` (incl. $${(tip_cents / 100).toFixed(2)} tip)` : ''}`,
            status: 'completed',
            actor_type: 'system',
        })

        return NextResponse.json({ 
            captured: true, 
            amount_cents: captureAmount,
            tip_cents,
            platform_fee_cents: fee,
            provider_payout_cents: captureAmount + tip_cents - fee,
            total_charged_cents: totalWithTip,
        })
    } catch (err) {
        console.error('[v0] Payment capture error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
