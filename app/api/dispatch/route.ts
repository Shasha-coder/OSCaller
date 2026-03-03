import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { findProviders, createDispatchOffers } from '@/lib/dispatch'
import type { ServiceType } from '@/lib/supabase/types'

/**
 * POST /api/dispatch — Trigger dispatch for a request
 * Finds, ranks, and creates offers for nearby providers
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { request_id } = body

        if (!request_id) {
            return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
        }

        const db = createServerClient()

        // Get the request
        const { data: request, error } = await db
            .from('requests')
            .select('*')
            .eq('id', request_id)
            .single()

        if (error || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        if (!request.lat || !request.lng) {
            return NextResponse.json({ error: 'Request missing coordinates' }, { status: 400 })
        }

        // Update status to searching
        await db.from('requests')
            .update({ status: 'searching' })
            .eq('id', request_id)

        await db.from('request_events').insert({
            request_id,
            label: 'Searching within 5 km...',
            status: 'active',
        })

        // Find and rank providers — start with 5km
        let candidates = await findProviders({
            trade: request.service as ServiceType,
            lat: request.lat,
            lng: request.lng,
            radiusKm: 5,
            emergencyLevel: request.emergency_level,
        })

        // Expand if no results
        if (candidates.length === 0) {
            await db.from('requests')
                .update({ status: 'expanding' })
                .eq('id', request_id)

            await db.from('request_events').insert({
                request_id,
                label: 'Expanding to 10 km...',
                status: 'active',
            })

            candidates = await findProviders({
                trade: request.service as ServiceType,
                lat: request.lat,
                lng: request.lng,
                radiusKm: 10,
                emergencyLevel: request.emergency_level,
            })
        }

        if (candidates.length === 0) {
            return NextResponse.json({
                dispatched: false,
                message: 'No available providers found. Request queued.',
                candidates: [],
            })
        }

        // Create dispatch offers (race protocol)
        await createDispatchOffers(request_id, candidates)

        return NextResponse.json({
            dispatched: true,
            candidates_count: candidates.length,
            top_provider: {
                name: candidates[0].provider.full_name,
                rating: candidates[0].stats.average_rating,
                jobs: candidates[0].stats.completed_jobs,
                eta: candidates[0].etaMinutes,
                distance_km: candidates[0].distanceKm,
                quality_score: candidates[0].qualityScore,
            },
        })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
