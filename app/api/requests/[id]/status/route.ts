import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { updateRequestStatus } from '@/lib/dispatch'

/**
 * GET /api/requests/[id]/status — Get current request status and details
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params
        const db = createServerClient()

        const { data: request, error } = await db
            .from('service_requests')
            .select(`
                id, status, service_code, eta_minutes,
                customer_name, address, service, priority, description,
                client_lat, client_lng, client_location_updated_at,
                provider_lat, provider_lng, provider_location_updated_at,
                provider_id, estimated_price_cents, final_price_cents,
                assigned_at, enroute_at, arrival_confirmed_at, 
                work_started_at, work_completed_at, cancelled_at,
                cancellation_reason, cancelled_by,
                created_at
            `)
            .eq('id', requestId)
            .single()

        if (error || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // If provider assigned, fetch provider details
        let provider = null
        if (request.provider_id) {
            const { data: providerData } = await db
                .from('providers')
                .select('id, full_name, trade, tier, phone, languages')
                .eq('id', request.provider_id)
                .single()

            const { data: stats } = await db
                .from('provider_stats')
                .select('average_rating, completed_jobs, on_time_rate')
                .eq('provider_id', request.provider_id)
                .single()

            provider = {
                ...providerData,
                rating: stats?.average_rating || 5,
                jobs: stats?.completed_jobs || 0,
                on_time_rate: stats?.on_time_rate || 1,
            }
        }

        return NextResponse.json({
            request: {
                ...request,
                provider,
            },
        })
    } catch (err) {
        console.error('[v0] Status fetch error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PUT /api/requests/[id]/status — Update request status
 * 
 * Validates state machine transitions and updates appropriate timestamps.
 * 
 * Body: { status, actor_type?, actor_id?, reason?, cancelled_by? }
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params
        const body = await req.json()
        const { status, actor_type = 'system', actor_id, reason, cancelled_by } = body

        if (!status) {
            return NextResponse.json({ error: 'Missing status' }, { status: 400 })
        }

        const validStatuses = [
            'draft', 'qualified', 'searching', 'assigned', 
            'enroute', 'arrived', 'in_progress', 'completed', 
            'cancelled', 'disputed'
        ]

        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            )
        }

        const result = await updateRequestStatus(
            requestId,
            status,
            actor_type,
            actor_id,
            { reason, cancelledBy: cancelled_by }
        )

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            new_status: status,
            message: `Status updated to ${status}`,
        })
    } catch (err) {
        console.error('[v0] Status update error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
