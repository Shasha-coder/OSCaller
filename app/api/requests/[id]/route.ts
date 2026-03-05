import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { redis, KEYS } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/requests/[id]
 * Returns request details + provider info.
 * Checks Redis first (hot path for active requests), falls back to Supabase.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServerClient()

    // 1. Try Redis cache first
    const cached = await redis.get(KEYS.requestDetail(id))
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      // Still fetch fresh provider location from DB
      let provider = null
      const techId = parsed.technician_id || parsed.provider_id
      if (techId) {
        const { data: pData } = await db
          .from('profiles')
          .select('id, name, phone, rating, jobs_completed, trade, lat, lng, language, status')
          .eq('id', techId)
          .single()
        provider = pData
      }
      return NextResponse.json({ request: parsed, provider, source: 'cache' })
    }

    // 2. Try service_requests table (dispatch/tracking table)
    const { data: sr } = await db
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (sr) {
      let provider = null
      if (sr.technician_id) {
        const { data: pData } = await db
          .from('profiles')
          .select('id, name, phone, rating, jobs_completed, trade, lat, lng, language, status')
          .eq('id', sr.technician_id)
          .single()
        provider = pData
      }
      // Cache for next poll
      await redis.set(KEYS.requestDetail(id), JSON.stringify(sr), { ex: 3600 })
      return NextResponse.json({ request: sr, provider, source: 'database' })
    }

    // 3. Fallback: requests table
    const { data: request, error } = await db
      .from('requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const { data: events } = await db
      .from('request_events')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: true })

    let provider = null
    if (request.provider_id) {
      const { data: pData } = await db
        .from('profiles')
        .select('id, name, phone, rating, jobs_completed, trade, lat, lng, language, status')
        .eq('id', request.provider_id)
        .single()
      provider = pData
    }

    return NextResponse.json({ request, events: events || [], provider, source: 'database' })
  } catch (err) {
    console.error('[v0] GET /api/requests/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/requests/[id]
 * Update request status. Updates both tables + Redis.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, provider_id, technician_id, technician_name, eta_minutes, payment_status } = body

    const db = createServerClient()
    const now = new Date().toISOString()

    // Update service_requests
    const srUpdates: Record<string, unknown> = { updated_at: now }
    if (status) srUpdates.status = status
    if (technician_id) srUpdates.technician_id = technician_id
    if (technician_name) srUpdates.technician_name = technician_name
    if (eta_minutes !== undefined) srUpdates.eta_minutes = eta_minutes
    if (status === 'completed') srUpdates.completed_at = now

    const { data: srData } = await db
      .from('service_requests')
      .update(srUpdates)
      .eq('id', id)
      .select()
      .single()

    // Also update requests table if it has a matching record
    const reqUpdates: Record<string, unknown> = { updated_at: now }
    if (status) reqUpdates.status = status
    if (provider_id || technician_id) reqUpdates.provider_id = provider_id || technician_id
    if (payment_status) reqUpdates.payment_status = payment_status

    await db.from('requests').update(reqUpdates).eq('id', id)

    // Add timeline event
    if (status) {
      const statusLabels: Record<string, string> = {
        searching: 'Searching within 5 km...',
        expanding: 'Expanding to 7 km...',
        found: 'Pro found!',
        'pre-authorized': 'Pre-authorized',
        'en-route': 'Pro en route',
        arrived: 'Pro arrived',
        completed: 'Job completed',
        cancelled: 'Request cancelled',
      }

      await db.from('request_events').insert({
        request_id: id,
        label: statusLabels[status] || status,
        status: 'active',
      })

      // Mark previous events as complete
      await db.from('request_events')
        .update({ status: 'complete' })
        .eq('request_id', id)
        .neq('status', 'active')
        .lt('created_at', now)
    }

    // Update Redis cache
    if (srData) {
      await redis.set(KEYS.requestDetail(id), JSON.stringify(srData), { ex: 86400 })
    }

    return NextResponse.json({ request: srData || reqUpdates })
  } catch (err) {
    console.error('[v0] PATCH /api/requests/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
