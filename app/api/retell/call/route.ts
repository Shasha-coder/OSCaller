// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/retell/call - Trigger outbound call to client via Retell AI
// Enhanced with rich metadata and dynamic variables for Aria context
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { retellClient, toE164, detectCountryFromCoords, DEFAULT_COUNTRY_CONFIGS } from '@/lib/retell-client'
import { createServerClient } from '@/lib/supabase'
import { redis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      request_id,
      phone,
      country_code,
      language,
      lat,
      lng,
      customer_name,
      service_type,
      urgency,
      address,
      photo_summary,
      issue_description,
      audio_summary,
    } = body

    // Validate required fields
    if (!request_id || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: request_id, phone' },
        { status: 400 }
      )
    }

    const db = createServerClient()

    // 1. Auto-detect country if not provided
    let detectedCountry = country_code
    if (!detectedCountry && lat && lng) {
      const detected = await detectCountryFromCoords(lat, lng)
      detectedCountry = detected?.code || 'CA'
    }
    detectedCountry = detectedCountry || 'CA'

    // 2. Get agent configuration for this country
    const { data: agentConfig } = await db
      .from('retell_agents')
      .select('*')
      .eq('country_code', detectedCountry)
      .eq('is_active', true)
      .single()

    // Fallback to default config if no agent found
    const countryConfig = DEFAULT_COUNTRY_CONFIGS.find(c => c.code === detectedCountry)
    const dialCode = countryConfig?.dial_code || '+1'
    const clientPhone = toE164(phone, dialCode)

    // Reverse geocode to get readable address if we have coordinates
    let readableAddress = address || ''
    if (lat && lng && (!address || address.startsWith('GPS:'))) {
      try {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        )
        const geoData = await geoRes.json()
        if (geoData.results?.[0]?.formatted_address) {
          readableAddress = geoData.results[0].formatted_address
        }
      } catch (e) {
        console.error('[Geocode Error]', e)
        readableAddress = `near coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
    }

    // Determine agent ID and from number
    const agentId = agentConfig?.agent_id || process.env.RETELL_DEFAULT_AGENT_ID
    const fromNumber = agentConfig?.phone_number || process.env.RETELL_DEFAULT_FROM_NUMBER
    const agentLanguage = agentConfig?.language || language || countryConfig?.default_language || 'en-US'

    if (!agentId || !fromNumber) {
      return NextResponse.json(
        { error: `No agent configured for country: ${detectedCountry}. Configure agents in admin panel or set RETELL_DEFAULT_AGENT_ID.` },
        { status: 404 }
      )
    }

    // 3. Build rich metadata for webhook processing
    const metadata = {
      request_id,
      customer_id: body.customer_id,
      service_type: service_type || 'general',
      urgency: urgency || 'standard',
      country_code: detectedCountry,
      source: 'oscaller',
      oscaller_agent_id: agentConfig?.id,
      has_photo: !!photo_summary,
      has_audio: !!audio_summary,
    }

    // 4. Build dynamic variables for Aria's prompt context
    // These get injected into Aria's conversation
    const retell_llm_dynamic_variables = {
      customer_name: customer_name || 'Customer',
      request_id,
      service_type: service_type || 'home service',
      urgency: urgency || 'standard',
      language: agentLanguage,
      address: readableAddress || 'your location',
      photo_summary: photo_summary || '',
      issue_description: issue_description || '',
      audio_summary: audio_summary || '',
      // Pricing context
      service_call_fee: '$89',
      hourly_rate: '$65/hr',
      // Context flags
      has_photo: photo_summary ? 'true' : 'false',
      has_audio: audio_summary ? 'true' : 'false',
    }

    // 5. Create the call via Retell API
    const callResponse = await retellClient.createPhoneCall({
      from_number: fromNumber,
      to_number: clientPhone,
      override_agent_id: agentId,
      metadata,
      retell_llm_dynamic_variables,
    })

    // 6. Store call session in Redis for fast status lookups
    await redis.set(
      `call:${callResponse.call_id}`,
      JSON.stringify({
        call_id: callResponse.call_id,
        request_id,
        agent_id: agentId,
        client_phone: clientPhone,
        client_name: customer_name,
        country: detectedCountry,
        language: agentLanguage,
        service_type,
        urgency,
        status: 'connecting',
        started_at: new Date().toISOString(),
        metadata,
      }),
      { ex: 3600 } // 1 hour TTL
    )

    // 7. Create call_attempt record
    await db.from('call_attempts').insert({
      request_id,
      call_id: callResponse.call_id,
      agent_id: agentId,
      from_number: fromNumber,
      to_number: clientPhone,
      direction: 'outbound',
      status: 'initiated',
    })

    // 8. Update service_request with call info
    await db
      .from('service_requests')
      .update({
        call_id: callResponse.call_id,
        call_status: 'connecting',
        last_call_id: callResponse.call_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request_id)

    // 9. Log event
    await db.from('request_events').insert({
      request_id,
      label: 'Aria calling customer...',
      status: 'active',
      actor_type: 'agent',
      metadata: JSON.stringify({
        call_id: callResponse.call_id,
        agent_name: agentConfig?.name || 'Aria',
        country: detectedCountry,
        has_context: !!(photo_summary || audio_summary || issue_description),
      }),
    })

    return NextResponse.json({
      success: true,
      call_id: callResponse.call_id,
      agent_id: callResponse.agent_id,
      agent_name: agentConfig?.name || 'Aria',
      status: callResponse.call_status,
      message: 'Call initiated. Aria will call you now.',
    })

  } catch (error) {
    console.error('[Retell Call Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    )
  }
}

// GET - Check call status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callId = searchParams.get('call_id')

  if (!callId) {
    return NextResponse.json({ error: 'Missing call_id' }, { status: 400 })
  }

  try {
    // Get from Redis first (faster)
    const cached = await redis.get(`call:${callId}`)
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string))
    }

    // Fallback to Retell API
    const call = await retellClient.getCall(callId)
    return NextResponse.json(call)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get call' },
      { status: 500 }
    )
  }
}
