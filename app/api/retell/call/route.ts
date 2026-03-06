// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/retell/call - Trigger outbound call to client via Retell AI
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { retellClient, toE164, detectCountryFromCoords, DEFAULT_COUNTRY_CONFIGS } from '@/lib/retell-client'
import { createServerClient } from '@/lib/supabase-server'
import { redis, KEYS } from '@/lib/redis'

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

    if (!agentConfig) {
      // Use environment variable fallback for agent
      const fallbackAgentId = process.env.RETELL_DEFAULT_AGENT_ID
      const fallbackNumber = process.env.RETELL_DEFAULT_FROM_NUMBER

      if (!fallbackAgentId || !fallbackNumber) {
        return NextResponse.json(
          { error: `No agent configured for country: ${detectedCountry}. Configure agents in admin panel.` },
          { status: 404 }
        )
      }

      // Use fallback
      const clientPhone = toE164(phone, dialCode)

      const callResponse = await retellClient.createPhoneCall({
        from_number: fallbackNumber,
        to_number: clientPhone,
        override_agent_id: fallbackAgentId,
        metadata: {
          request_id,
          country: detectedCountry,
          source: 'oscaller',
        },
        retell_llm_dynamic_variables: {
          customer_name: customer_name || 'Customer',
          request_id,
          language: language || countryConfig?.default_language || 'en-US',
        },
      })

      // Store call session in Redis
      await redis.set(
        `call:${callResponse.call_id}`,
        JSON.stringify({
          call_id: callResponse.call_id,
          request_id,
          client_phone: clientPhone,
          country: detectedCountry,
          language: language || 'en-US',
          status: 'connecting',
          started_at: new Date().toISOString(),
        }),
        { ex: 3600 } // 1 hour TTL
      )

      // Update service_request with call info
      await db
        .from('service_requests')
        .update({
          call_id: callResponse.call_id,
          call_status: 'connecting',
        })
        .eq('id', request_id)

      return NextResponse.json({
        success: true,
        call_id: callResponse.call_id,
        agent_id: callResponse.agent_id,
        status: callResponse.call_status,
        message: 'Call initiated. Agent will call you shortly.',
      })
    }

    // 3. Use country-specific agent
    const clientPhone = toE164(phone, dialCode)

    const callResponse = await retellClient.createPhoneCall({
      from_number: agentConfig.phone_number,
      to_number: clientPhone,
      override_agent_id: agentConfig.agent_id,
      metadata: {
        request_id,
        country: detectedCountry,
        oscaller_agent_id: agentConfig.id,
        source: 'oscaller',
      },
      retell_llm_dynamic_variables: {
        customer_name: customer_name || 'Customer',
        request_id,
        service_type: body.service_type || 'general',
        language: language || agentConfig.language,
      },
    })

    // 4. Store call session
    await redis.set(
      `call:${callResponse.call_id}`,
      JSON.stringify({
        call_id: callResponse.call_id,
        request_id,
        agent_id: agentConfig.agent_id,
        client_phone: clientPhone,
        client_name: customer_name,
        country: detectedCountry,
        language: language || agentConfig.language,
        status: 'connecting',
        started_at: new Date().toISOString(),
      }),
      { ex: 3600 }
    )

    // 5. Update service_request
    await db
      .from('service_requests')
      .update({
        call_id: callResponse.call_id,
        call_status: 'connecting',
      })
      .eq('id', request_id)

    // 6. Log event
    await db.from('request_events').insert({
      request_id,
      label: 'AI agent calling...',
      status: 'active',
      actor_type: 'agent',
      metadata: JSON.stringify({
        call_id: callResponse.call_id,
        agent_name: agentConfig.name,
        country: detectedCountry,
      }),
    })

    return NextResponse.json({
      success: true,
      call_id: callResponse.call_id,
      agent_id: callResponse.agent_id,
      agent_name: agentConfig.name,
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
