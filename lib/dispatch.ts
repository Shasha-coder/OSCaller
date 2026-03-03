/**
 * OSCaller Dispatch Engine
 * ─── Provider search, ranking, and race protocol ───
 */

import { createServerClient } from '@/lib/supabase/server'
import type { ServiceType, ProviderRow, ProviderStatsRow, ProviderLocationRow } from '@/lib/supabase/types'

/* ─── Haversine distance (km) ─── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
 */
export async function findProviders(params: {
    trade: ServiceType
    lat: number
    lng: number
    radiusKm?: number
    emergencyLevel?: string
    limit?: number
}): Promise<RankedProvider[]> {
    const { trade, lat, lng, radiusKm = 5, emergencyLevel = 'standard', limit = 10 } = params
    const db = createServerClient()

    // 1. Get active providers for this trade who are online
    const { data: providers } = await db
        .from('providers')
        .select('*')
        .eq('trade', trade)
        .eq('is_active', true)

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
 * - Top provider gets a soft reservation window (8 seconds)
 * - Backups see "pending — backup slot active"
 */
export async function createDispatchOffers(requestId: string, candidates: RankedProvider[]): Promise<void> {
    const db = createServerClient()

    const now = new Date()
    const offers = candidates.map((c, idx) => ({
        request_id: requestId,
        provider_id: c.provider.id,
        status: 'pending' as const,
        distance_km: c.distanceKm,
        eta_minutes: c.etaMinutes,
        quality_score: c.qualityScore,
        reservation_expires_at: idx === 0
            ? new Date(now.getTime() + 8000).toISOString()  // 8s soft reservation for top
            : new Date(now.getTime() + 15000).toISOString(), // 15s for backups
    }))

    await db.from('dispatch_offers').insert(offers)
}

/**
 * Handle a provider accepting an offer.
 * Returns true if accepted (first wins), false if someone else got it.
 */
export async function acceptOffer(offerId: string, providerId: string): Promise<{ accepted: boolean; nearMiss: boolean }> {
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

        // Mark as near_miss and add token
        await db.from('dispatch_offers')
            .update({ status: nearMiss ? 'near_miss' : 'declined', responded_at: new Date().toISOString() })
            .eq('id', offerId)

        if (nearMiss) {
            // Grant near-miss token
            await db.rpc('increment_near_miss_tokens' as never, { p_provider_id: providerId } as never)
                .then(() => { })
                .catch(() => {
                    // Fallback: manual increment if RPC doesn't exist
                    db.from('provider_stats')
                        .update({ near_miss_tokens: (offer as Record<string, unknown>).near_miss_tokens as number + 1 || 1 })
                        .eq('provider_id', providerId)
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

    // Update request with assigned provider
    await db.from('requests')
        .update({ provider_id: providerId, status: 'found' })
        .eq('id', offer.request_id)

    return { accepted: true, nearMiss: false }
}
