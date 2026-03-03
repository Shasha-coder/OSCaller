import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
    : null

/**
 * POST /api/payments/refund — Refund / release hold
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { request_id, reason } = body

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        const { data: payment } = await db
            .from('payments')
            .select('*')
            .eq('request_id', request_id)
            .in('status', ['authorized', 'captured'])
            .single()

        if (!payment) {
            return NextResponse.json({ error: 'No refundable payment found' }, { status: 404 })
        }

        if (stripe && payment.stripe_payment_intent_id) {
            if (payment.status === 'authorized') {
                // Cancel the hold
                await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
            } else {
                // Refund captured payment
                await stripe.refunds.create({
                    payment_intent: payment.stripe_payment_intent_id,
                    reason: 'requested_by_customer',
                })
            }
        }

        await db.from('payments')
            .update({ status: 'refunded', refunded_at: new Date().toISOString() })
            .eq('id', payment.id)

        await db.from('requests')
            .update({ payment_status: 'refunded' })
            .eq('id', request_id)

        return NextResponse.json({
            refunded: true,
            message: reason || 'Payment refunded successfully.',
        })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
