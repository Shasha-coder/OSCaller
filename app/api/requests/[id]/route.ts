import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET  /api/requests/[id] — Get request details with events
 * PATCH /api/requests/[id] — Update request status
 */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        // Get timeline events
        const { data: events } = await db
            .from('request_events')
            .select('*')
            .eq('request_id', id)
            .order('created_at', { ascending: true })

        // Get assigned provider if any
        let provider = null
        if (request.provider_id) {
            const { data: providerData } = await db
                .from('providers')
                .select('*, provider_stats(*)')
                .eq('id', request.provider_id)
                .single()
            provider = providerData
        }

        return NextResponse.json({ request, events: events || [], provider })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { status, provider_id, payment_status } = body

        const db = createServerClient()

        const updates: Record<string, unknown> = {}
        if (status) updates.status = status
        if (provider_id) updates.provider_id = provider_id
        if (payment_status) updates.payment_status = payment_status

        const { data, error } = await db
            .from('requests')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Add a timeline event for the status change
        if (status) {
            const statusLabels: Record<string, string> = {
                searching: 'Searching within 5 km...',
                expanding: 'Expanding to 7 km...',
                found: 'Pro found!',
                'pre-authorized': '✅ Pre-authorized',
                'en-route': 'Pro en route',
                arrived: 'Pro arrived',
                completed: 'Job completed',
                cancelled: 'Request cancelled',
            }

            await db.from('request_events').insert({
                request_id: id,
                label: statusLabels[status] || status,
                status: 'active',
            })

            // Mark previous events as complete
            await db.from('request_events')
                .update({ status: 'complete' })
                .eq('request_id', id)
                .neq('status', 'active')
                .lt('created_at', new Date().toISOString())
        }

        return NextResponse.json({ request: data })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
