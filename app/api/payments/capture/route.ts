import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
    : null

/**
 * POST /api/payments/capture — Capture a pre-authorized payment on arrival
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { request_id, amount_cents } = body

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        const { data: payment } = await db
            .from('payments')
            .select('*')
            .eq('request_id', request_id)
            .eq('status', 'authorized')
            .single()

        if (!payment) {
            return NextResponse.json({ error: 'No authorized payment found' }, { status: 404 })
        }

        // Capture via Stripe
        if (stripe && payment.stripe_payment_intent_id) {
            await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
                amount_to_capture: amount_cents || payment.amount_cents,
            })
        }

        // Update DB
        await db.from('payments')
            .update({
                status: 'captured',
                amount_cents: amount_cents || payment.amount_cents,
                captured_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

        await db.from('requests')
            .update({ payment_status: 'captured' })
            .eq('id', request_id)

        return NextResponse.json({ captured: true, amount_cents: amount_cents || payment.amount_cents })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
