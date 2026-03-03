import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/requests/[id]/cancel — Cancel a request with fee logic
 *
 * Rules:
 * - Before provider "en-route": release hold, no fee
 * - After travel started: charge $25 inconvenience fee
 */

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const db = createServerClient()

        const { data: request, error } = await db
            .from('requests')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        if (request.status === 'completed' || request.status === 'cancelled') {
            return NextResponse.json({ error: 'Request already completed or cancelled' }, { status: 400 })
        }

        const travelStarted = ['en-route', 'arrived'].includes(request.status)
        const cancellationFee = travelStarted ? 2500 : 0 // $25.00 in cents

        // Update request status
        await db.from('requests')
            .update({
                status: 'cancelled',
                payment_status: travelStarted ? 'captured' : 'refunded',
            })
            .eq('id', id)

        // Add cancellation event
        await db.from('request_events').insert({
            request_id: id,
            label: travelStarted
                ? `Cancelled after travel — $${(cancellationFee / 100).toFixed(2)} inconvenience fee`
                : 'Cancelled — no charge',
            status: 'active',
            metadata: { cancellation_fee_cents: cancellationFee },
        })

        // If there was a payment hold
        if (request.payment_status === 'authorized') {
            const { data: payment } = await db
                .from('payments')
                .select('*')
                .eq('request_id', id)
                .eq('status', 'authorized')
                .single()

            if (payment) {
                if (travelStarted) {
                    // Capture the inconvenience fee amount
                    await db.from('payments')
                        .update({ status: 'captured', amount_cents: cancellationFee, captured_at: new Date().toISOString() })
                        .eq('id', payment.id)
                    // TODO: Stripe capture with reduced amount
                } else {
                    // Release the hold
                    await db.from('payments')
                        .update({ status: 'refunded', refunded_at: new Date().toISOString() })
                        .eq('id', payment.id)
                    // TODO: Stripe cancel payment intent
                }
            }
        }

        // Expire any pending dispatch offers
        await db.from('dispatch_offers')
            .update({ status: 'expired' })
            .eq('request_id', id)
            .eq('status', 'pending')

        return NextResponse.json({
            cancelled: true,
            fee_cents: cancellationFee,
            message: travelStarted
                ? 'Cancelled. A $25 inconvenience fee has been charged.'
                : 'Cancelled. No charge applied.',
        })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
