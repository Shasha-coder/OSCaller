import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
    : null

/**
 * POST /api/payments/authorize — Create a Stripe pre-authorization hold
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { request_id, amount_cents = 10000, currency = 'usd' } = body

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        // Verify request exists
        const { data: request } = await db
            .from('requests')
            .select('id, status')
            .eq('id', request_id)
            .single()

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        let paymentIntentId: string | null = null

        if (stripe) {
            // Create Stripe PaymentIntent with manual capture (pre-auth hold)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount_cents,
                currency,
                capture_method: 'manual', // Authorization hold — captured later
                metadata: { request_id },
            })
            paymentIntentId = paymentIntent.id
        }

        // Store in DB
        const { data: payment, error } = await db
            .from('payments')
            .insert({
                request_id,
                stripe_payment_intent_id: paymentIntentId,
                amount_cents,
                currency,
                status: 'authorized',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Update request payment status
        await db.from('requests')
            .update({ payment_status: 'authorized' })
            .eq('id', request_id)

        return NextResponse.json({
            payment,
            client_secret: stripe && paymentIntentId
                ? (await stripe.paymentIntents.retrieve(paymentIntentId)).client_secret
                : null,
            message: 'Authorization hold created. Will be captured on arrival.',
        })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
