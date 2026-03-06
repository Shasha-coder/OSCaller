import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { haversineKm } from '@/lib/dispatch'

/**
 * PUT /api/providers/[id]/location — Update provider GPS location
 * 
 * Called by provider app every 5-15 seconds while enroute/on job.
 * Also updates service_requests with provider location + recalculates ETA.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: providerId } = await params
        const body = await req.json()
        const { lat, lng, heading, speed, request_id } = body

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Missing lat or lng' }, { status: 400 })
        }

        const db = createServerClient()
        const now = new Date().toISOString()

        // 1. Insert into provider_locations (history)
        const { data, error } = await db
            .from('provider_locations')
            .insert({
                provider_id: providerId,
                lat,
                lng,
                heading: heading || null,
                speed: speed || null,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // 2. If there's an active request, update service_requests with provider location
        if (request_id) {
            // Get client location for ETA calculation
            const { data: request } = await db
                .from('service_requests')
                .select('client_lat, client_lng, status')
                .eq('id', request_id)
                .eq('provider_id', providerId)
                .single()

            if (request && ['assigned', 'enroute'].includes(request.status || '')) {
                let eta_minutes = null
                
                // Recalculate ETA if we have client location
                if (request.client_lat && request.client_lng) {
                    const distanceKm = haversineKm(lat, lng, request.client_lat, request.client_lng)
                    // Average city speed ~25 km/h + 2 min buffer
                    eta_minutes = Math.max(1, Math.round((distanceKm / 25) * 60 + 2))
                }

                await db.from('service_requests')
                    .update({
                        provider_lat: lat,
                        provider_lng: lng,
                        provider_location_updated_at: now,
                        ...(eta_minutes !== null && { eta_minutes }),
                    })
                    .eq('id', request_id)
            }
        } else {
            // No specific request - check if provider has any active assignment
            const { data: activeRequest } = await db
                .from('service_requests')
                .select('id, client_lat, client_lng, status')
                .eq('provider_id', providerId)
                .in('status', ['assigned', 'enroute', 'arrived', 'in_progress'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (activeRequest) {
                let eta_minutes = null
                
                if (activeRequest.client_lat && activeRequest.client_lng && 
                    ['assigned', 'enroute'].includes(activeRequest.status || '')) {
                    const distanceKm = haversineKm(lat, lng, activeRequest.client_lat, activeRequest.client_lng)
                    eta_minutes = Math.max(1, Math.round((distanceKm / 25) * 60 + 2))
                }

                await db.from('service_requests')
                    .update({
                        provider_lat: lat,
                        provider_lng: lng,
                        provider_location_updated_at: now,
                        ...(eta_minutes !== null && { eta_minutes }),
                    })
                    .eq('id', activeRequest.id)
            }
        }

        return NextResponse.json({ 
            success: true,
            location: data,
            recorded_at: now,
        })
    } catch (err) {
        console.error('[v0] Provider location update error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
