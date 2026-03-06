import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { findProviders, createDispatchOffers, updateRequestStatus } from '@/lib/dispatch'
import type { ServiceType } from '@/lib/supabase/types'

/**
 * POST /api/dispatch — Trigger dispatch for a request
 * Finds, ranks, and creates offers for nearby providers
 * Uses service_requests table with full state machine
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { request_id } = body

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        // Get the request from service_requests
        const { data: request, error } = await db
            .from('service_requests')
            .select('*')
            .eq('id', request_id)
            .single()

        if (error || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // Use client_lat/lng or fall back to lat/lng
        const lat = request.client_lat || request.lat
        const lng = request.client_lng || request.lng

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Request missing coordinates' }, { status: 400 })
        }

        // Update status to searching
        await updateRequestStatus(request_id, 'searching', 'system')

        await db.from('request_events').insert({
            request_id,
            label: 'Searching within 5 km...',
            status: 'active',
            actor_type: 'system',
            new_status: 'searching',
        })

        // Find and rank providers — start with 5km
        let candidates = await findProviders({
            trade: request.service as ServiceType,
            lat,
            lng,
            radiusKm: 5,
            emergencyLevel: request.priority,
        })

        // Expand if no results
        if (candidates.length === 0) {
            await db.from('request_events').insert({
                request_id,
                label: 'Expanding search to 10 km...',
                status: 'active',
                actor_type: 'system',
            })

            candidates = await findProviders({
                trade: request.service as ServiceType,
                lat,
                lng,
                radiusKm: 10,
                emergencyLevel: request.priority,
            })
        }

        // Expand further if still no results
        if (candidates.length === 0) {
            await db.from('request_events').insert({
                request_id,
                label: 'Expanding search to 20 km...',
                status: 'active',
                actor_type: 'system',
            })

            candidates = await findProviders({
                trade: request.service as ServiceType,
                lat,
                lng,
                radiusKm: 20,
                emergencyLevel: request.priority,
            })
        }

        if (candidates.length === 0) {
            await db.from('request_events').insert({
                request_id,
                label: 'No providers available. Queued for retry.',
                status: 'active',
                actor_type: 'system',
            })

            return NextResponse.json({
                dispatched: false,
                message: 'No available providers found. Request queued.',
                candidates: [],
            })
        }

        // Create dispatch offers (race protocol)
        const offerIds = await createDispatchOffers(request_id, candidates)

        return NextResponse.json({
            dispatched: true,
            candidates_count: candidates.length,
            offer_ids: offerIds,
            top_provider: {
                id: candidates[0].provider.id,
                name: candidates[0].provider.full_name,
                rating: candidates[0].stats.average_rating,
                jobs: candidates[0].stats.completed_jobs,
                eta_minutes: candidates[0].etaMinutes,
                distance_km: candidates[0].distanceKm,
                quality_score: candidates[0].qualityScore,
            },
        })
    } catch (err) {
        console.error('[v0] Dispatch error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
