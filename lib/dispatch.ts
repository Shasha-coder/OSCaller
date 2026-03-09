/**
 * OSCaller Dispatch Engine
 * ─── Provider search, ranking, and race protocol ───
 * 
 * State Machine:
 * draft → qualified → searching → assigned → enroute → arrived → in_progress → completed
 *                                    ↓
 *                              cancelled / disputed
 */

import { createServerClient } from '@/lib/supabase/server'
import type { ServiceType, ProviderRow, ProviderStatsRow, ProviderLocationRow } from '@/lib/supabase/types'

/* ─── Generate service verification code (OS + 4 digits) ─── */
export function generateServiceCode(): string {
    const digits = Math.floor(1000 + Math.random() * 9000)
    return `OS${digits}`
}

/* ─── Haversine distance (km) ─── */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ─── Quality score (0–100) ─── */
function computeQualityScore(stats: ProviderStatsRow, distanceKm: number): number {
    const ratingScore = (stats.average_rating / 5) * 40  // max 40
    const reliabilityScore = stats.on_time_rate * 25       // max 25
    const volumeScore = Math.min(stats.completed_jobs / 200, 1) * 15 // max 15
    const distancePenalty = Math.min(distanceKm / 15, 1) * 20 // max -20
    const tokenBonus = stats.near_miss_tokens > 0 ? 5 : 0     // +5 for near-miss

    return ratingScore + reliabilityScore + volumeScore - distancePenalty + tokenBonus
}

/* ─── Estimated ETA (minutes) — rough approximation ─── */
function estimateETA(distanceKm: number): number {
    // Average city speed ~ 25 km/h + 5 min prep time
    return Math.round((distanceKm / 25) * 60 + 5)
}

export interface RankedProvider {
    provider: ProviderRow
    stats: ProviderStatsRow
    location: ProviderLocationRow
    distanceKm: number
    etaMinutes: number
    qualityScore: number
}

/**
 * Find and rank providers by trade, availability, distance, and quality.
 * If trade is not specified, returns all active providers near the location.
 */
export async function findProviders(params: {
    trade?: ServiceType
    lat: number
    lng: number
    radiusKm?: number
    emergencyLevel?: string
    limit?: number
}): Promise<RankedProvider[]> {
    const { trade, lat, lng, radiusKm = 5, emergencyLevel = 'standard', limit = 10 } = params
    const db = createServerClient()

    // 1. Get active providers (filter by trade if specified)
    let query = db
        .from('providers')
        .select('*')
        .eq('is_active', true)
    
    if (trade) {
        query = query.eq('trade', trade)
    }
    
    const { data: providers } = await query

    if (!providers?.length) return []

    const providerIds = providers.map(p => p.id)

    // 2. Get availability (online only)
    const { data: availability } = await db
        .from('provider_availability')
        .select('*')
        .in('provider_id', providerIds)
        .eq('is_online', true)

    const onlineIds = new Set(availability?.map(a => a.provider_id) || [])

    // 3. Get latest locations
    const { data: locations } = await db
        .from('provider_locations')
        .select('*')
        .in('provider_id', providerIds)
        .order('recorded_at', { ascending: false })

    // De-dup to latest per provider
    const locationMap = new Map<string, ProviderLocationRow>()
    locations?.forEach(loc => {
        if (!locationMap.has(loc.provider_id)) {
            locationMap.set(loc.provider_id, loc as ProviderLocationRow)
        }
    })

    // 4. Get stats
    const { data: stats } = await db
        .from('provider_stats')
        .select('*')
        .in('provider_id', providerIds)

    const statsMap = new Map<string, ProviderStatsRow>()
    stats?.forEach(s => statsMap.set(s.provider_id, s as ProviderStatsRow))

    // 5. Filter + rank
    const candidates: RankedProvider[] = []

    for (const provider of providers) {
        // Must be online
        if (!onlineIds.has(provider.id)) continue

        // Must have location
        const location = locationMap.get(provider.id)
        if (!location) continue

        // Two-gate quality filter
        if (emergencyLevel === 'emergency' && (provider as ProviderRow).tier === 'probation') continue

        // Distance filter
        const distanceKm_ = haversineKm(lat, lng, location.lat, location.lng)
        if (distanceKm_ > radiusKm) continue

        // Stats (default if missing)
        const providerStats: ProviderStatsRow = statsMap.get(provider.id) || {
            id: '',
            provider_id: provider.id,
            total_jobs: 0,
            completed_jobs: 0,
            on_time_rate: 1,
            average_rating: 5,
            complaint_count: 0,
            clean_streak: 0,
            near_miss_tokens: 0,
            updated_at: '',
        }

        const qualityScore = computeQualityScore(providerStats, distanceKm_)
        const etaMinutes = estimateETA(distanceKm_)

        candidates.push({
            provider: provider as ProviderRow,
            stats: providerStats,
            location,
            distanceKm: Math.round(distanceKm_ * 100) / 100,
            etaMinutes,
            qualityScore: Math.round(qualityScore * 10) / 10,
        })
    }

    // Sort by quality score desc (quality over speed alone)
    candidates.sort((a, b) => b.qualityScore - a.qualityScore)

    return candidates.slice(0, limit)
}

/**
 * Create dispatch offers (race protocol).
 * - Top provider gets a soft reservation window (20 seconds)
 * - Backups get staggered timeouts
 * - offer_sequence tracks the ladder order
 */
export async function createDispatchOffers(requestId: string, candidates: RankedProvider[]): Promise<string[]> {
    const db = createServerClient()

    const now = new Date()
    const offers = candidates.map((c, idx) => ({
        request_id: requestId,
        provider_id: c.provider.id,
        status: 'pending' as const,
        offer_sequence: idx + 1, // 1-indexed ladder position
        distance_km: c.distanceKm,
        eta_minutes: c.etaMinutes,
        quality_score: c.qualityScore,
        timeout_at: new Date(now.getTime() + (20 + idx * 10) * 1000).toISOString(), // 20s, 30s, 40s...
    }))

    const { data } = await db.from('dispatch_offers').insert(offers).select('id')
    
    // Update dispatch_attempts on service_requests
    await db.from('service_requests')
        .update({ dispatch_attempts: candidates.length })
        .eq('id', requestId)
    
    return data?.map(o => o.id) || []
}

/**
 * Handle a provider accepting an offer.
 * Returns true if accepted (first wins), false if someone else got it.
 * On success: generates service code, updates service_requests to 'assigned'
 */
export async function acceptOffer(offerId: string, providerId: string): Promise<{ 
    accepted: boolean
    nearMiss: boolean
    serviceCode?: string
    requestId?: string
}> {
    const db = createServerClient()

    // Get the offer
    const { data: offer } = await db
        .from('dispatch_offers')
        .select('*')
        .eq('id', offerId)
        .single()

    if (!offer || offer.provider_id !== providerId) {
        return { accepted: false, nearMiss: false }
    }

    // Check if another offer for this request is already accepted
    const { data: existing } = await db
        .from('dispatch_offers')
        .select('*')
        .eq('request_id', offer.request_id)
        .eq('status', 'accepted')
        .limit(1)

    if (existing && existing.length > 0) {
        // Near-miss: accepted within 3 seconds of the winner
        const winnerTime = new Date(existing[0].responded_at || existing[0].offered_at).getTime()
        const now = Date.now()
        const nearMiss = (now - winnerTime) <= 3000

        // Mark as near_miss
        await db.from('dispatch_offers')
            .update({ 
                status: nearMiss ? 'near_miss' : 'declined', 
                responded_at: new Date().toISOString() 
            })
            .eq('id', offerId)

        if (nearMiss) {
            // Grant near-miss token
            await db.from('provider_stats')
                .update({ near_miss_tokens: 1 })
                .eq('provider_id', providerId)
                .then(() => {
                    // Increment if update worked
                    db.rpc('increment', { x: 1, row_id: providerId } as never).catch(() => {})
                })
        }

        return { accepted: false, nearMiss }
    }

    // Accept this offer
    await db.from('dispatch_offers')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', offerId)

    // Expire other offers for this request
    await db.from('dispatch_offers')
        .update({ status: 'expired', responded_at: new Date().toISOString() })
        .eq('request_id', offer.request_id)
        .neq('id', offerId)
        .eq('status', 'pending')

    // Generate service code
    const serviceCode = generateServiceCode()

    // Update service_requests with assigned provider + service code + timestamps
    await db.from('service_requests')
        .update({ 
            provider_id: providerId, 
            status: 'assigned',
            service_code: serviceCode,
            assigned_at: new Date().toISOString(),
            current_offer_id: offerId,
            eta_minutes: offer.eta_minutes,
        })
        .eq('id', offer.request_id)

    // Log event
    await db.from('request_events').insert({
        request_id: offer.request_id,
        label: `Provider assigned. Code: ${serviceCode}`,
        status: 'completed',
        actor_type: 'system',
        new_status: 'assigned',
        previous_status: 'searching',
    })

    return { accepted: true, nearMiss: false, serviceCode, requestId: offer.request_id }
}

/**
 * Update request status with proper state machine validation + timestamps
 */
export async function updateRequestStatus(
    requestId: string, 
    newStatus: string,
    actorType: 'client' | 'provider' | 'agent' | 'system' = 'system',
    actorId?: string,
    metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    const db = createServerClient()

    // Get current request
    const { data: request, error } = await db
        .from('service_requests')
        .select('status')
        .eq('id', requestId)
        .single()

    if (error || !request) {
        return { success: false, error: 'Request not found' }
    }

    const currentStatus = request.status

    // State machine validation
    const validTransitions: Record<string, string[]> = {
        'draft': ['qualified', 'cancelled'],
        'qualified': ['searching', 'cancelled'],
        'searching': ['assigned', 'cancelled'],
        'assigned': ['enroute', 'cancelled'],
        'enroute': ['arrived', 'cancelled'],
        'arrived': ['in_progress', 'cancelled', 'disputed'],
        'in_progress': ['completed', 'cancelled', 'disputed'],
        'completed': ['disputed'],
        'cancelled': [],
        'disputed': ['completed', 'cancelled'],
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return { success: false, error: `Invalid transition: ${currentStatus} → ${newStatus}` }
    }

    // Build update object with appropriate timestamps
    const update: Record<string, unknown> = { status: newStatus }
    const now = new Date().toISOString()

    switch (newStatus) {
        case 'enroute':
            update.enroute_at = now
            break
        case 'arrived':
            update.arrival_confirmed_at = now
            break
        case 'in_progress':
            update.work_started_at = now
            break
        case 'completed':
            update.work_completed_at = now
            break
        case 'cancelled':
            update.cancelled_at = now
            if (metadata?.reason) update.cancellation_reason = metadata.reason
            if (metadata?.cancelledBy) update.cancelled_by = metadata.cancelledBy
            break
    }

    await db.from('service_requests')
        .update(update)
        .eq('id', requestId)

    // Log event
    await db.from('request_events').insert({
        request_id: requestId,
        label: `Status: ${newStatus}`,
        status: 'completed',
        actor_type: actorType,
        actor_id: actorId,
        new_status: newStatus,
        previous_status: currentStatus,
        metadata: metadata ? JSON.stringify(metadata) : null,
    })

    return { success: true }
}

/**
 * Verify service code at arrival
 */
export async function verifyServiceCode(
    requestId: string, 
    code: string, 
    providerId: string
): Promise<{ verified: boolean; error?: string }> {
    const db = createServerClient()

    const { data: request, error } = await db
        .from('service_requests')
        .select('service_code, status, provider_id')
        .eq('id', requestId)
        .single()

    if (error || !request) {
        return { verified: false, error: 'Request not found' }
    }

    if (request.provider_id !== providerId) {
        return { verified: false, error: 'Not assigned to this provider' }
    }

    if (request.status !== 'arrived') {
        return { verified: false, error: 'Must be in arrived status to verify code' }
    }

    if (request.service_code?.toUpperCase() !== code.toUpperCase()) {
        return { verified: false, error: 'Invalid code' }
    }

    // Code verified - transition to in_progress
    await updateRequestStatus(requestId, 'in_progress', 'provider', providerId)

    return { verified: true }
}
