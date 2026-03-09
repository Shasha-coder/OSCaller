import { NextRequest, NextResponse } from 'next/server'
import { findProviders } from '@/lib/dispatch'
import type { ServiceType } from '@/lib/supabase/types'

/**
 * GET /api/providers/nearby — Find nearby providers by trade and location
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const trade = searchParams.get('trade') as ServiceType | null
        const lat = parseFloat(searchParams.get('lat') || '0')
        const lng = parseFloat(searchParams.get('lng') || '0')
        const radius = parseFloat(searchParams.get('radius') || '5')

        // lat and lng are required, trade is optional (shows all providers if not specified)
        if (!lat || !lng) {
            return NextResponse.json({ error: 'Missing query params: lat, lng' }, { status: 400 })
        }

        const providers = await findProviders({
            trade: trade || undefined,
            lat,
            lng,
            radiusKm: radius,
            limit: 20,
        })

        return NextResponse.json({
            providers: providers.map(p => ({
                id: p.provider.id,
                name: p.provider.full_name,
                trade: p.provider.trade,
                tier: p.provider.tier,
                rating: p.stats.average_rating,
                jobs: p.stats.completed_jobs,
                distance_km: p.distanceKm,
                eta_minutes: p.etaMinutes,
                quality_score: p.qualityScore,
                lat: p.location.lat,
                lng: p.location.lng,
            })),
        })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
