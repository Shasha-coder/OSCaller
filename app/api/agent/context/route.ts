import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/agent/context?request_id=xxx
 *
 * Returns structured context for the ElevenLabs AI agent ("Alex").
 * Alex reads this to speak intelligently without re-asking the user for details.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const requestId = searchParams.get('request_id')

        if (!requestId) {
            return NextResponse.json({ error: 'Missing request_id query param' }, { status: 400 })
        }

        const db = createServerClient()

        // Get request with user info
        const { data: request, error } = await db
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (error || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // Get user info if available
        let user = null
        if (request.user_id) {
            const { data: userData } = await db
                .from('users')
                .select('full_name, phone, email')
                .eq('id', request.user_id)
                .single()
            user = userData
        }

        // Get timeline events
        const { data: events } = await db
            .from('request_events')
            .select('label, status, created_at')
            .eq('request_id', requestId)
            .order('created_at', { ascending: true })

        // Get assigned provider info
        let provider = null
        if (request.provider_id) {
            const { data: providerData } = await db
                .from('providers')
                .select('full_name, trade, tier')
                .eq('id', request.provider_id)
                .single()

            const { data: stats } = await db
                .from('provider_stats')
                .select('average_rating, completed_jobs, on_time_rate')
                .eq('provider_id', request.provider_id)
                .single()

            const { data: location } = await db
                .from('provider_locations')
                .select('lat, lng')
                .eq('provider_id', request.provider_id)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single()

            provider = {
                ...providerData,
                stats,
                location,
            }
        }

        // Get pending dispatch offers
        const { data: offers } = await db
            .from('dispatch_offers')
            .select('provider_id, status, distance_km, eta_minutes, quality_score')
            .eq('request_id', requestId)
            .in('status', ['pending', 'accepted'])

        // Build agent context
        const context = {
            request_id: request.id,
            user_name: user?.full_name || null,
            user_phone: user?.phone || null,

            // Location
            address: request.address,
            unit: request.unit_number || null,
            building: request.building_name || null,
            entry_instructions: request.entry_instructions || null,
            lat: request.lat,
            lng: request.lng,

            // Service
            service_category: request.service,
            emergency_level: request.emergency_level,
            issue_summary: request.description || null,

            // Status
            current_status: request.status,
            payment_status: request.payment_status,
            timeline: events || [],

            // Dispatch
            dispatch_status: request.status,
            provider: provider,
            candidate_offers: offers || [],

            // Timestamp
            created_at: request.created_at,
            context_generated_at: new Date().toISOString(),
        }

        return NextResponse.json(context)
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
