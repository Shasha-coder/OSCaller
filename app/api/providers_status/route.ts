import { NextRequest, NextResponse } from 'next/server'
import { redis, KEYS } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/providers_status
 * Returns list of providers with their real-time status.
 * Query params: ?status=online|offline|busy&trade=plumbing|electrical|...
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const statusFilter = searchParams.get('status')
        const tradeFilter = searchParams.get('trade')

        // Mock provider data — in production, this comes from Supabase + Redis
        let providers = [
            { id: 't1', name: 'Peter M.', phone: '+15551234567', trade: 'plumbing', status: 'busy', current_job: 'REQ-001', rating: 4.8, jobs_completed: 218, lat: 40.7150, lng: -74.003, services: ['plumbing'] },
            { id: 't2', name: 'James K.', phone: '+15559876543', trade: 'hvac', status: 'online', current_job: null, rating: 4.9, jobs_completed: 156, lat: 40.7200, lng: -73.998, services: ['hvac', 'electrical'] },
            { id: 't3', name: 'Sarah W.', phone: '+15554567890', trade: 'electrical', status: 'online', current_job: null, rating: 4.7, jobs_completed: 89, lat: 40.7080, lng: -74.010, services: ['electrical'] },
            { id: 't4', name: 'Mike R.', phone: '+15553214567', trade: 'locksmith', status: 'offline', current_job: null, rating: 4.6, jobs_completed: 67, lat: 40.7180, lng: -74.005, services: ['locksmith'] },
            { id: 't5', name: 'Lisa T.', phone: '+15557894561', trade: 'plumbing', status: 'busy', current_job: 'REQ-003', rating: 4.9, jobs_completed: 312, lat: 40.7120, lng: -73.995, services: ['plumbing', 'appliance'] },
            { id: 't6', name: 'Tom H.', phone: '+15556547891', trade: 'hvac', status: 'online', current_job: null, rating: 4.5, jobs_completed: 44, lat: 40.7250, lng: -74.000, services: ['hvac'] },
        ]

        if (statusFilter) {
            providers = providers.filter(t => t.status === statusFilter)
        }
        if (tradeFilter) {
            providers = providers.filter(t => t.trade === tradeFilter || t.services.includes(tradeFilter))
        }

        return NextResponse.json({
            providers,
            total: providers.length,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch providers', timestamp: new Date().toISOString() },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/providers_status
 * Update provider status (online/offline/busy).
 * Body: { provider_id: string, status?: string, services?: string[] }
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { provider_id, status, services } = body

        if (!provider_id) {
            return NextResponse.json(
                { error: 'provider_id is required' },
                { status: 400 }
            )
        }

        // Update Redis cache
        if (status) {
            await redis.set(`provider:${provider_id}:status`, status)
        }
        if (services) {
            await redis.set(`provider:${provider_id}:services`, JSON.stringify(services))
        }

        return NextResponse.json({
            success: true,
            provider_id,
            updated: { status, services },
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update provider', timestamp: new Date().toISOString() },
            { status: 500 }
        )
    }
}
