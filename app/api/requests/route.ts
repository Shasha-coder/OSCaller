import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { redis, KEYS } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/requests
 * Returns service requests from Supabase with optional filters.
 * Query params: ?status=submitted|searching|en-route|completed&service=plumbing&limit=20&user_id=uuid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const serviceFilter = searchParams.get('service')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    const db = createServerClient()

    let query = db
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (statusFilter) query = query.eq('status', statusFilter)
    if (serviceFilter) query = query.eq('service', serviceFilter)
    if (userId) query = query.eq('customer_id', userId)

    const { data, error } = await query

    if (error) {
      console.error('[v0] Supabase requests fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch requests', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requests: data || [],
      total: data?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[v0] GET /api/requests error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch requests', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}

/**
 * POST /api/requests
 * Create a new service request — persists to both Supabase and Redis.
 * Body: { customer_name, phone, address, service, priority, description, lat?, lng?, language?, country?, customer_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_name, phone, address, service, priority, description,
      lat, lng, language, country, customer_id,
      is_apartment, building_name, unit_number, entry_instructions,
    } = body

    if (!customer_name || !phone || !address || !service || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, phone, address, service, priority' },
        { status: 400 }
      )
    }

    const validServices = ['plumbing', 'electrical', 'hvac', 'locksmith', 'appliance', 'roofing', 'glass', 'pest']
    if (!validServices.includes(service)) {
      return NextResponse.json(
        { error: `Invalid service. Must be one of: ${validServices.join(', ')}` },
        { status: 400 }
      )
    }

    const validPriorities = ['emergency', 'urgent', 'standard']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`
    const db = createServerClient()

    // 1. Insert into service_requests (the dispatch/tracking table)
    const { data: srData, error: srError } = await db
      .from('service_requests')
      .insert({
        id: requestId,
        customer_name,
        customer_phone: phone,
        customer_id: customer_id || null,
        address,
        lat: lat || null,
        lng: lng || null,
        service,
        priority,
        description: description || '',
        status: 'submitted',
      })
      .select()
      .single()

    if (srError) {
      console.error('[v0] service_requests insert error:', srError)
      return NextResponse.json({ error: 'Failed to create request', detail: srError.message }, { status: 500 })
    }

    // 2. Also insert into requests table (the detailed request record) if customer_id present
    if (customer_id) {
      const { error: rError } = await db
        .from('requests')
        .insert({
          user_id: customer_id,
          address,
          lat: lat || null,
          lng: lng || null,
          is_apartment: is_apartment || false,
          building_name: building_name || null,
          unit_number: unit_number || null,
          entry_instructions: entry_instructions || null,
          service,
          emergency_level: priority,
          description: description || '',
          status: 'submitted',
          payment_status: 'none',
        })

      if (rError) {
        console.error('[v0] requests insert warning (non-blocking):', rError)
      }
    }

    // 3. Cache in Redis for real-time access
    const redisPayload = {
      ...srData,
      language: language || 'English',
      country: country || 'CA',
    }
    await redis.set(KEYS.requestDetail(requestId), JSON.stringify(redisPayload), { ex: 86400 })
    await redis.lpush(KEYS.activeRequests, requestId)

    return NextResponse.json({
      success: true,
      request: redisPayload,
      message: `Request ${requestId} created successfully. A technician will be dispatched shortly.`,
      timestamp: new Date().toISOString(),
    }, { status: 201 })
  } catch (err) {
    console.error('[v0] POST /api/requests error:', err)
    return NextResponse.json(
      { error: 'Failed to create request', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}