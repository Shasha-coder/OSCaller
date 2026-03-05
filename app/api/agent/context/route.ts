import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { redis, KEYS } from '@/lib/redis'

/**
 * GET /api/agent/context?request_id=xxx[&role=client|provider]
 *
 * Returns structured context for the AI call agent.
 * The agent reads this to speak intelligently, in the correct language,
 * with real-time map data and ETA -- without re-asking the user for details.
 *
 * Key enhancements:
 * - Language orchestration: client_language, provider_language, translation_needed
 * - Live GPS: provider lat/lng, heading, speed, last_updated
 * - Dynamic ETA: computed from live distance + speed
 * - Country routing: which Twilio number to use for outbound calls
 * - Media context: image_analysis description for visual understanding
 * - Redis fast path: cached context for repeat reads within same call
 */

/* ── Haversine distance (km) ── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ── ETA from live distance + speed ── */
function computeETA(distanceKm: number, speedKmH: number | null): {
  eta_minutes: number
  eta_method: 'live_speed' | 'estimated'
} {
  if (speedKmH && speedKmH > 2) {
    // Live speed available and provider is moving
    const minutes = Math.round((distanceKm / speedKmH) * 60) + 2 // +2 min buffer
    return { eta_minutes: Math.max(minutes, 1), eta_method: 'live_speed' }
  }
  // Fallback: average city driving ~25 km/h + 5 min prep
  return {
    eta_minutes: Math.round((distanceKm / 25) * 60 + 5),
    eta_method: 'estimated',
  }
}

/* ── Language display names for AI readability ── */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  ar: 'Arabic',
  pt: 'Portuguese',
  zh: 'Chinese (Mandarin)',
}

/* ── Country display names ── */
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const requestId = searchParams.get('request_id')
    const role = searchParams.get('role') || 'client' // 'client' | 'provider'

    if (!requestId) {
      return NextResponse.json({ error: 'Missing request_id query param' }, { status: 400 })
    }

    // ── Fast path: check Redis cache (60s TTL) ──
    const cacheKey = KEYS.agentContext(requestId)
    try {
      const cached = await redis.get(cacheKey)
      if (cached && typeof cached === 'object') {
        return NextResponse.json({
          ...(cached as Record<string, unknown>),
          _source: 'cache',
          context_generated_at: new Date().toISOString(),
        })
      }
    } catch {
      // Redis unavailable, continue with DB
    }

    const db = createServerClient()

    // ── 1. Get request with all new fields ──
    const { data: request, error } = await db
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // ── 2. Get client user info (with language + country) ──
    let user = null
    if (request.user_id) {
      const { data: userData } = await db
        .from('users')
        .select('full_name, phone, email, locale, country')
        .eq('id', request.user_id)
        .single()
      user = userData
    }

    // ── 3. Get timeline events ──
    const { data: events } = await db
      .from('request_events')
      .select('label, status, created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    // ── 4. Get assigned provider info (with language data) ──
    let provider = null
    let liveMapData = null
    if (request.provider_id) {
      const { data: providerData } = await db
        .from('providers')
        .select('id, full_name, phone, trade, tier, locale, languages, country')
        .eq('id', request.provider_id)
        .single()

      const { data: stats } = await db
        .from('provider_stats')
        .select('average_rating, completed_jobs, on_time_rate')
        .eq('provider_id', request.provider_id)
        .single()

      // Get LATEST location with speed and heading for live tracking
      const { data: location } = await db
        .from('provider_locations')
        .select('lat, lng, heading, speed, recorded_at')
        .eq('provider_id', request.provider_id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      provider = {
        id: providerData?.id,
        name: providerData?.full_name,
        phone: providerData?.phone,
        trade: providerData?.trade,
        tier: providerData?.tier,
        primary_language: providerData?.locale || 'en',
        spoken_languages: providerData?.languages || ['en'],
        country: providerData?.country || 'US',
        stats: stats || null,
      }

      // ── Build live map data if provider has location ──
      if (location && request.lat && request.lng) {
        const distanceKm = haversineKm(
          request.lat, request.lng,
          location.lat, location.lng
        )
        const speedKmH = location.speed ? location.speed * 3.6 : null // m/s -> km/h
        const { eta_minutes, eta_method } = computeETA(distanceKm, speedKmH)

        const locationAge = Date.now() - new Date(location.recorded_at).getTime()
        const isLocationFresh = locationAge < 120_000 // less than 2 minutes old

        liveMapData = {
          provider_lat: location.lat,
          provider_lng: location.lng,
          provider_heading: location.heading,
          provider_speed_kmh: speedKmH ? Math.round(speedKmH) : null,
          distance_km: Math.round(distanceKm * 100) / 100,
          distance_miles: Math.round(distanceKm * 0.621371 * 100) / 100,
          eta_minutes,
          eta_method,
          location_age_seconds: Math.round(locationAge / 1000),
          is_location_fresh: isLocationFresh,
          is_provider_moving: (speedKmH || 0) > 2,
          last_location_update: location.recorded_at,
        }
      }
    }

    // ── 5. Get pending/accepted dispatch offers ──
    const { data: offers } = await db
      .from('dispatch_offers')
      .select('provider_id, status, distance_km, eta_minutes, quality_score')
      .eq('request_id', requestId)
      .in('status', ['pending', 'accepted'])

    // ── 6. Get Twilio number for the request's country ──
    const requestCountry = (request as Record<string, unknown>).country as string || user?.country || 'US'
    let twilioNumber = null
    const { data: twilioData } = await db
      .from('twilio_numbers' as never)
      .select('phone_number, country_code, capabilities')
      .eq('country_code', requestCountry)
      .eq('is_active', true)
      .limit(1)
      .single()
    if (twilioData) {
      twilioNumber = twilioData
    }

    // ── 7. Determine language orchestration ──
    const clientLanguage = (request as Record<string, unknown>).client_locale as string || user?.locale || 'en'
    const providerLanguage = provider?.primary_language || 'en'
    const translationNeeded = clientLanguage !== providerLanguage

    const languageContext = {
      client_language: clientLanguage,
      client_language_name: LANGUAGE_NAMES[clientLanguage] || clientLanguage,
      provider_language: providerLanguage,
      provider_language_name: LANGUAGE_NAMES[providerLanguage] || providerLanguage,
      provider_spoken_languages: provider?.spoken_languages || [],
      translation_needed: translationNeeded,
      // Instructions for the AI agent on how to handle language
      agent_instructions: translationNeeded
        ? `CRITICAL: The client speaks ${LANGUAGE_NAMES[clientLanguage] || clientLanguage} and the provider speaks ${LANGUAGE_NAMES[providerLanguage] || providerLanguage}. When speaking to the client, use ${LANGUAGE_NAMES[clientLanguage] || clientLanguage}. When speaking to the provider, use ${LANGUAGE_NAMES[providerLanguage] || providerLanguage}. Translate meaning and intent, not just words. Maintain urgency cues across languages.`
        : `Both parties speak ${LANGUAGE_NAMES[clientLanguage] || clientLanguage}. Communicate in ${LANGUAGE_NAMES[clientLanguage] || clientLanguage} throughout the call.`,
      // Which language to use right now based on who the agent is calling
      speak_language: role === 'provider' ? providerLanguage : clientLanguage,
      speak_language_name: role === 'provider'
        ? (LANGUAGE_NAMES[providerLanguage] || providerLanguage)
        : (LANGUAGE_NAMES[clientLanguage] || clientLanguage),
    }

    // ── 8. Country context ──
    const countryContext = {
      country_code: requestCountry,
      country_name: COUNTRY_NAMES[requestCountry] || requestCountry,
      twilio_outbound_number: twilioNumber?.phone_number || null,
      twilio_capabilities: twilioNumber?.capabilities || null,
      currency: requestCountry === 'MX' ? 'MXN' : requestCountry === 'CA' ? 'CAD' : 'USD',
      distance_unit: requestCountry === 'US' ? 'miles' : 'km',
      emergency_number: requestCountry === 'MX' ? '911' : requestCountry === 'CA' ? '911' : '911',
    }

    // ── 9. Media / image context for visual understanding ──
    const mediaContext = {
      media_urls: (request as Record<string, unknown>).media_urls as string[] || [],
      image_analysis: (request as Record<string, unknown>).image_analysis as string || null,
      has_media: !!((request as Record<string, unknown>).media_urls as string[])?.length,
    }

    // ── Build final agent context ──
    const context = {
      // Request identification
      request_id: request.id,
      current_role: role,

      // Client info
      client: {
        name: user?.full_name || null,
        phone: user?.phone || null,
        language: clientLanguage,
      },

      // Location
      location: {
        address: request.address,
        unit: request.unit_number || null,
        building: request.building_name || null,
        entry_instructions: request.entry_instructions || null,
        lat: request.lat,
        lng: request.lng,
        is_apartment: request.is_apartment,
      },

      // Service details
      service: {
        category: request.service,
        emergency_level: request.emergency_level,
        issue_summary: request.description || null,
        ...mediaContext,
      },

      // Status
      status: {
        current: request.status,
        payment: request.payment_status,
        timeline: events || [],
        created_at: request.created_at,
      },

      // Provider (null if not yet assigned)
      provider: provider ? {
        id: provider.id,
        name: provider.name,
        trade: provider.trade,
        tier: provider.tier,
        language: provider.primary_language,
        spoken_languages: provider.spoken_languages,
        rating: provider.stats?.average_rating || null,
        completed_jobs: provider.stats?.completed_jobs || null,
        on_time_rate: provider.stats?.on_time_rate || null,
      } : null,

      // Live map / GPS data (null if no location available)
      live_map: liveMapData,

      // Dispatch offers
      dispatch: {
        candidate_offers: offers || [],
        total_candidates: offers?.length || 0,
      },

      // Language orchestration (the critical piece)
      language: languageContext,

      // Country / Twilio routing
      country: countryContext,

      // Metadata
      _source: 'database',
      context_generated_at: new Date().toISOString(),
    }

    // ── Cache in Redis for 30 seconds (fast retrieval for mid-call refreshes) ──
    try {
      await redis.set(cacheKey, JSON.stringify(context), { ex: 30 })
    } catch {
      // Redis unavailable, non-critical
    }

    return NextResponse.json(context)
  } catch (err) {
    console.error('[agent/context] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
