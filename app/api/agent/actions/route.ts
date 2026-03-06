import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { findProviders, createDispatchOffers, updateRequestStatus, acceptOffer } from '@/lib/dispatch'
import type { ServiceType } from '@/lib/supabase/types'

/**
 * POST /api/agent/actions — Real-time agent action executor
 * 
 * This is the primary endpoint for Retell AI / GPT-5.1 to call during live calls.
 * The agent can execute actions and get immediate results to speak to the user.
 * 
 * Body: {
 *   request_id: string,
 *   action: string,      // See ACTION_HANDLERS below
 *   params?: object,     // Action-specific parameters
 * }
 * 
 * Supported actions:
 * - find_providers: Search for nearby providers
 * - dispatch: Create offers and start provider search
 * - update_status: Transition request status
 * - send_sms: Send SMS to client/provider
 * - get_eta: Get current ETA
 * - verify_code: Verify service code
 */

type ActionHandler = (
  db: ReturnType<typeof createServerClient>,
  requestId: string,
  params: Record<string, unknown>
) => Promise<{ success: boolean; data?: unknown; error?: string; speak?: string }>

const ACTION_HANDLERS: Record<string, ActionHandler> = {
  
  // Find nearby providers without dispatching
  find_providers: async (db, requestId, params) => {
    const { data: request } = await db
      .from('service_requests')
      .select('service, client_lat, client_lng, lat, lng, priority')
      .eq('id', requestId)
      .single()
    
    if (!request) return { success: false, error: 'Request not found' }
    
    const lat = request.client_lat || request.lat
    const lng = request.client_lng || request.lng
    
    if (!lat || !lng) return { success: false, error: 'No location available' }
    
    const radius = (params.radius_km as number) || 10
    const candidates = await findProviders({
      trade: request.service as ServiceType,
      lat, lng,
      radiusKm: radius,
      emergencyLevel: request.priority,
    })
    
    if (candidates.length === 0) {
      return {
        success: true,
        data: { count: 0, providers: [] },
        speak: `I'm searching but haven't found any available ${request.service} professionals within ${radius} kilometers yet. Let me expand the search.`
      }
    }
    
    const top = candidates[0]
    return {
      success: true,
      data: {
        count: candidates.length,
        top_provider: {
          name: top.provider.full_name,
          rating: top.stats.average_rating,
          jobs: top.stats.completed_jobs,
          eta_minutes: top.etaMinutes,
          distance_km: top.distanceKm,
        }
      },
      speak: `I found ${candidates.length} available ${request.service} professional${candidates.length > 1 ? 's' : ''} nearby. The closest is ${top.provider.full_name}, rated ${top.stats.average_rating} stars with ${top.stats.completed_jobs} completed jobs. They can arrive in about ${top.etaMinutes} minutes.`
    }
  },

  // Start dispatch process
  dispatch: async (db, requestId, params) => {
    const { data: request } = await db
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    
    if (!request) return { success: false, error: 'Request not found' }
    
    const lat = request.client_lat || request.lat
    const lng = request.client_lng || request.lng
    
    if (!lat || !lng) return { success: false, error: 'No location' }
    
    // Update to searching
    await updateRequestStatus(requestId, 'searching', 'agent')
    
    let candidates = await findProviders({
      trade: request.service as ServiceType,
      lat, lng,
      radiusKm: (params.radius_km as number) || 10,
      emergencyLevel: request.priority,
    })
    
    if (candidates.length === 0) {
      return {
        success: true,
        data: { dispatched: false },
        speak: `I'm having trouble finding an available professional right now. Would you like me to keep searching, or would you prefer to try again in a few minutes?`
      }
    }
    
    const offerIds = await createDispatchOffers(requestId, candidates)
    
    return {
      success: true,
      data: {
        dispatched: true,
        candidates_count: candidates.length,
        offer_ids: offerIds,
      },
      speak: `Perfect, I've sent requests to ${candidates.length} nearby professionals. I'll stay on the line while they respond. The first one to accept will be assigned to help you.`
    }
  },

  // Update request status
  update_status: async (db, requestId, params) => {
    const newStatus = params.status as string
    const reason = params.reason as string | undefined
    
    if (!newStatus) return { success: false, error: 'status required' }
    
    const result = await updateRequestStatus(
      requestId,
      newStatus,
      'agent',
      undefined,
      reason ? { reason } : undefined
    )
    
    if (!result.success) {
      return { success: false, error: result.error }
    }
    
    const statusMessages: Record<string, string> = {
      'enroute': 'Great, your professional is now on their way.',
      'arrived': 'Your professional has arrived at your location.',
      'in_progress': 'The work has begun.',
      'completed': 'The service has been completed successfully.',
      'cancelled': 'The request has been cancelled.',
    }
    
    return {
      success: true,
      data: { new_status: newStatus },
      speak: statusMessages[newStatus] || `Status updated to ${newStatus}.`
    }
  },

  // Get current ETA
  get_eta: async (db, requestId) => {
    const { data: request } = await db
      .from('service_requests')
      .select('eta_minutes, provider_lat, provider_lng, client_lat, client_lng, status')
      .eq('id', requestId)
      .single()
    
    if (!request) return { success: false, error: 'Request not found' }
    
    if (!['assigned', 'enroute'].includes(request.status || '')) {
      return {
        success: true,
        data: { eta_minutes: null, status: request.status },
        speak: `Your request is currently in ${request.status} status.`
      }
    }
    
    const eta = request.eta_minutes || 'unknown'
    return {
      success: true,
      data: { eta_minutes: request.eta_minutes },
      speak: `Your professional should arrive in approximately ${eta} minutes.`
    }
  },

  // Verify service code
  verify_code: async (db, requestId, params) => {
    const code = params.code as string
    const providerId = params.provider_id as string
    
    if (!code || !providerId) {
      return { success: false, error: 'code and provider_id required' }
    }
    
    const { data: request } = await db
      .from('service_requests')
      .select('service_code, status, provider_id')
      .eq('id', requestId)
      .single()
    
    if (!request) return { success: false, error: 'Request not found' }
    
    if (request.provider_id !== providerId) {
      return { success: false, error: 'Not assigned to this provider' }
    }
    
    if (request.service_code?.toUpperCase() !== code.toUpperCase()) {
      return {
        success: false,
        error: 'Invalid code',
        speak: `That code doesn't match. Please ask the customer for their verification code again.`
      }
    }
    
    await updateRequestStatus(requestId, 'in_progress', 'agent')
    
    return {
      success: true,
      data: { verified: true },
      speak: `Code verified. The service has officially started. I'll check back when the work is complete.`
    }
  },

  // Accept offer on behalf of provider (for testing)
  accept_offer: async (db, requestId, params) => {
    const offerId = params.offer_id as string
    const providerId = params.provider_id as string
    
    if (!offerId || !providerId) {
      return { success: false, error: 'offer_id and provider_id required' }
    }
    
    const result = await acceptOffer(offerId, providerId)
    
    if (!result.accepted) {
      return {
        success: false,
        error: result.nearMiss ? 'Near miss - another provider accepted first' : 'Offer not available',
        speak: result.nearMiss 
          ? `Sorry, another professional just accepted this job. You were very close though!`
          : `This job is no longer available.`
      }
    }
    
    return {
      success: true,
      data: {
        service_code: result.serviceCode,
        request_id: result.requestId,
      },
      speak: `Job accepted! The verification code is ${result.serviceCode}. Please head to the customer's location now.`
    }
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { request_id, action, params = {} } = body
    
    if (!request_id || !action) {
      return NextResponse.json(
        { error: 'request_id and action are required' },
        { status: 400 }
      )
    }
    
    const handler = ACTION_HANDLERS[action]
    if (!handler) {
      return NextResponse.json(
        { error: `Unknown action: ${action}`, available_actions: Object.keys(ACTION_HANDLERS) },
        { status: 400 }
      )
    }
    
    const db = createServerClient()
    const result = await handler(db, request_id, params)
    
    // Log action to audit trail
    await db.from('request_events').insert({
      request_id,
      label: `Agent action: ${action}`,
      status: result.success ? 'completed' : 'failed',
      actor_type: 'agent',
      metadata: JSON.stringify({ action, params, result: result.success }),
    })
    
    return NextResponse.json(result)
  } catch (err) {
    console.error('[v0] Agent action error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
