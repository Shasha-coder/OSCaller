import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/agent/sms — Agent-initiated SMS sending
 * 
 * Allows the AI agent to send SMS messages to clients or providers.
 * Used for:
 * - Sending service code to client
 * - Sending provider ETA updates
 * - Sending completion receipts
 * - Emergency notifications
 * 
 * Body: {
 *   request_id: string,
 *   recipient: 'client' | 'provider',
 *   template: 'service_code' | 'provider_assigned' | 'eta_update' | 'arrival' | 'completion' | 'custom',
 *   custom_message?: string,   // Only for template='custom'
 *   data?: Record<string, any> // Template variables
 * }
 */

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_MSG_SID = process.env.TWILIO_MESSAGING_SERVICE_SID || ''

const TEMPLATES: Record<string, (data: Record<string, unknown>) => string> = {
  service_code: (d) => 
    `OSCaller: Your service verification code is ${d.code}. Share this code with ${d.provider_name || 'your pro'} when they arrive. Do not share with anyone else.`,
  
  provider_assigned: (d) =>
    `OSCaller: Great news! ${d.provider_name} is on the way. ETA: ${d.eta} minutes. They will arrive in a ${d.vehicle || 'service vehicle'}. Track live: ${d.tracking_url || 'oscaller.com/track'}`,
  
  eta_update: (d) =>
    `OSCaller: Updated ETA - ${d.provider_name} will arrive in ${d.eta} minutes. ${d.reason || ''}`,
  
  arrival: (d) =>
    `OSCaller: ${d.provider_name} has arrived! Your verification code is ${d.code}. Please share this code to begin service.`,
  
  completion: (d) =>
    `OSCaller: Service completed! Total: $${d.amount}${d.tip ? ` (incl. $${d.tip} tip)` : ''}. Rate your experience: ${d.review_url || 'oscaller.com/review'}`,
  
  provider_new_job: (d) =>
    `OSCaller Job Alert: ${d.service} request at ${d.address}. ${d.distance} away, ~${d.eta} min. Accept now: ${d.accept_url}`,
    
  provider_cancelled: (d) =>
    `OSCaller: The ${d.service} job at ${d.address} has been cancelled. ${d.reason || 'No reason provided.'}`,
}

async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.error('[v0] Twilio credentials not configured')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    const authHeader = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')

    const body = new URLSearchParams({
      To: to,
      MessagingServiceSid: TWILIO_MSG_SID,
      Body: message,
    })

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      const error = await res.json()
      console.error('[v0] Twilio SMS error:', error)
      return { success: false, error: error.message || 'Failed to send SMS' }
    }

    const result = await res.json()
    return { success: true, sid: result.sid }
  } catch (err) {
    console.error('[v0] SMS send error:', err)
    return { success: false, error: 'SMS delivery failed' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { request_id, recipient, template, custom_message, data = {} } = body

    if (!request_id || !recipient || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: request_id, recipient, template' },
        { status: 400 }
      )
    }

    if (!['client', 'provider'].includes(recipient)) {
      return NextResponse.json({ error: 'recipient must be client or provider' }, { status: 400 })
    }

    const db = createServerClient()

    // Get request with related data
    const { data: request, error } = await db
      .from('service_requests')
      .select('id, customer_id, provider_id, service_code, service, address')
      .eq('id', request_id)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Get recipient phone number
    let phone: string | null = null
    let recipientName: string | null = null

    if (recipient === 'client' && request.customer_id) {
      const { data: user } = await db
        .from('users')
        .select('phone, full_name')
        .eq('id', request.customer_id)
        .single()
      phone = user?.phone || null
      recipientName = user?.full_name || null
    } else if (recipient === 'provider' && request.provider_id) {
      const { data: provider } = await db
        .from('providers')
        .select('phone, full_name')
        .eq('id', request.provider_id)
        .single()
      phone = provider?.phone || null
      recipientName = provider?.full_name || null
    }

    if (!phone) {
      return NextResponse.json(
        { error: `No phone number found for ${recipient}` },
        { status: 400 }
      )
    }

    // Build message
    let message: string

    if (template === 'custom') {
      if (!custom_message) {
        return NextResponse.json({ error: 'custom_message required for custom template' }, { status: 400 })
      }
      message = custom_message
    } else if (TEMPLATES[template]) {
      // Merge request data with provided data
      const templateData = {
        ...data,
        code: request.service_code,
        service: request.service,
        address: request.address,
      }
      message = TEMPLATES[template](templateData)
    } else {
      return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 })
    }

    // Send SMS
    const result = await sendSMS(phone, message)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Log event
    await db.from('request_events').insert({
      request_id,
      label: `SMS sent to ${recipient}: ${template}`,
      status: 'completed',
      actor_type: 'agent',
      metadata: JSON.stringify({ 
        template, 
        recipient,
        twilio_sid: result.sid,
      }),
    })

    return NextResponse.json({
      success: true,
      message_sid: result.sid,
      recipient: recipientName,
      template,
    })
  } catch (err) {
    console.error('[v0] Agent SMS error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
