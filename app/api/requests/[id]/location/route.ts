import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/requests/[id]/location — Update client GPS location
 * 
 * Called by client app every 10-20 seconds while request is active.
 * Updates both service_requests (latest) and client_locations (history).
 * 
 * Body: { lat, lng, accuracy?, user_id? }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params
        const body = await req.json()
        const { lat, lng, accuracy, user_id } = body

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
        }

        const db = createServerClient()
        const now = new Date().toISOString()

        // 1. Update service_requests with latest client location
        const { error: updateError } = await db
            .from('service_requests')
            .update({
                client_lat: lat,
                client_lng: lng,
                client_location_updated_at: now,
            })
            .eq('id', requestId)

        if (updateError) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // 2. Store in client_locations history (optional but good for auditing)
        if (user_id) {
            await db.from('client_locations').insert({
                user_id,
                request_id: requestId,
                lat,
                lng,
                accuracy: accuracy || null,
                recorded_at: now,
            })
        }

        return NextResponse.json({ 
            success: true, 
            recorded_at: now,
        })
    } catch (err) {
        console.error('[v0] Client location update error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/requests/[id]/location — Get current locations for tracking
 * 
 * Returns both client and provider locations for real-time map display.
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
                client_lat, client_lng, client_location_updated_at,
                provider_lat, provider_lng, provider_location_updated_at,
                provider_id, status, eta_minutes
            `)
            .eq('id', requestId)
            .single()

        if (error || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        return NextResponse.json({
            client: {
                lat: request.client_lat,
                lng: request.client_lng,
                updated_at: request.client_location_updated_at,
            },
            provider: request.provider_id ? {
                lat: request.provider_lat,
                lng: request.provider_lng,
                updated_at: request.provider_location_updated_at,
            } : null,
            status: request.status,
            eta_minutes: request.eta_minutes,
        })
    } catch (err) {
        console.error('[v0] Location fetch error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
