// ═══════════════════════════════════════════════════════════════════════════════
// Retell AI Custom LLM WebSocket Server
// 
// This endpoint receives live transcripts from Retell and returns intelligent
// responses using OSCaller's context (service requests, media analysis, etc.)
//
// Protocol: https://docs.retellai.com/api-references/llm-websocket
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { redis } from '@/lib/redis'

// Note: Vercel doesn't support native WebSocket in serverless functions.
// For production, you'll need to use Vercel Edge Functions with WebSocket upgrade
// or deploy a separate WebSocket server (e.g., Railway, Render, or AWS).
//
// This HTTP endpoint provides an alternative approach: Retell can call this
// endpoint for each response_required event, or you can use Server-Sent Events.

interface Utterance {
  role: 'agent' | 'user'
  content: string
}

interface RetellRequest {
  interaction_type: 'update_only' | 'response_required' | 'reminder_required'
  response_id?: number
  transcript?: Utterance[]
  call_id?: string
  // Custom metadata we pass when creating the call
  metadata?: {
    request_id?: string
    customer_name?: string
    language?: string
  }
}

interface RetellResponse {
  response_id?: number
  content: string
  content_complete: boolean
  end_call: boolean
}

// Agent prompt templates
const ARIA_SYSTEM_PROMPT = `You are Aria, an AI assistant for OSCaller - an on-demand home services platform.
Your job is to:
1. Understand the customer's problem (plumbing, electrical, HVAC, locksmith, etc.)
2. Confirm their location and contact details
3. Estimate urgency and provide a price estimate
4. Dispatch a qualified technician

Be warm, professional, and efficient. Keep responses concise for phone conversation.
If you have context about their issue (from photos or previous messages), reference it naturally.`

// POST handler for HTTP-based LLM responses
export async function POST(request: NextRequest) {
  try {
    const body: RetellRequest = await request.json()
    const { interaction_type, response_id, transcript, metadata } = body

    // Handle update_only - just acknowledge
    if (interaction_type === 'update_only') {
      return NextResponse.json({ received: true })
    }

    // Get OSCaller context if we have a request_id
    let oscallerContext = ''
    const requestId = metadata?.request_id

    if (requestId) {
      const db = createServerClient()
      
      // Fetch service request details
      const { data: request } = await db
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (request) {
        oscallerContext = `
CURRENT REQUEST CONTEXT:
- Service Type: ${request.service || 'Not specified'}
- Description: ${request.description || 'Customer will describe'}
- Priority: ${request.priority || 'urgent'}
- Location: ${request.address || `GPS: ${request.lat}, ${request.lng}`}
- Language: ${request.language || 'English'}
- Status: ${request.status}
`

        // Check for media analysis
        if (request.media_analysis) {
          const analysis = Array.isArray(request.media_analysis) 
            ? request.media_analysis[0] 
            : request.media_analysis
          
          if (analysis) {
            oscallerContext += `
CUSTOMER SENT A PHOTO:
- Issue Detected: ${analysis.detected_issue || 'Unknown'}
- Summary: ${analysis.summary || 'Photo uploaded'}
- Severity: ${analysis.severity || 'Unknown'}
- Safety Concerns: ${analysis.safety_concerns?.join(', ') || 'None identified'}
`
          }
        }

        // Check for nearby providers
        const cachedProviders = await redis.get(`dispatch:${requestId}:providers`)
        if (cachedProviders) {
          const providers = JSON.parse(cachedProviders as string)
          oscallerContext += `
AVAILABLE PROVIDERS:
- ${providers.length} technicians available within 15km
- Closest: ${providers[0]?.distance_km?.toFixed(1) || '?'}km away
- Estimated arrival: ${providers[0]?.eta_minutes || '15-20'} minutes
`
        }
      }
    }

    // Build conversation context from transcript
    const conversationHistory = transcript?.map(u => 
      `${u.role === 'agent' ? 'Aria' : 'Customer'}: ${u.content}`
    ).join('\n') || ''

    // Generate response based on interaction type
    let responseContent = ''

    if (interaction_type === 'reminder_required') {
      // User has been silent
      responseContent = "Are you still there? I'm here to help you get a technician."
    } else {
      // response_required - generate contextual response
      const lastUserMessage = transcript?.filter(u => u.role === 'user').pop()?.content || ''
      
      // Simple intent detection and response generation
      // In production, you'd call GPT-4 or Claude here
      responseContent = generateContextualResponse(lastUserMessage, oscallerContext, conversationHistory)
    }

    const response: RetellResponse = {
      response_id,
      content: responseContent,
      content_complete: true,
      end_call: false,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Retell LLM Error]', error)
    return NextResponse.json({
      response_id: 0,
      content: "I'm having a technical issue. Please try again in a moment.",
      content_complete: true,
      end_call: false,
    })
  }
}

// Simple contextual response generator
// In production, replace with actual LLM call
function generateContextualResponse(
  userMessage: string,
  context: string,
  history: string
): string {
  const lowerMessage = userMessage.toLowerCase()

  // Check if we have photo context
  const hasPhotoContext = context.includes('CUSTOMER SENT A PHOTO')

  // Beginning of conversation
  if (!history || history.split('\n').length < 3) {
    if (hasPhotoContext) {
      const issueMatch = context.match(/Issue Detected: (.+)/)
      const issue = issueMatch?.[1] || 'the issue in your photo'
      return `Hi! I'm Aria from OSCaller. I see you've sent a photo showing ${issue}. Can you tell me a bit more about what's happening?`
    }
    return "Hi! I'm Aria from OSCaller. How can I help you today? Please describe the issue you're experiencing."
  }

  // Emergency keywords
  if (lowerMessage.includes('flood') || lowerMessage.includes('gas') || lowerMessage.includes('fire') || lowerMessage.includes('emergency')) {
    return "This sounds urgent. I'm dispatching our nearest available technician to you right now. They should arrive within 15 minutes. Is everyone safe?"
  }

  // Pricing questions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    return "Our service call fee is $89, which includes the first 30 minutes of labor. After that, it's $65 per hour. Any parts needed will be quoted before we proceed. Would you like me to send a technician?"
  }

  // Confirmation intent
  if (lowerMessage.includes('yes') || lowerMessage.includes('okay') || lowerMessage.includes('please') || lowerMessage.includes('send')) {
    const etaMatch = context.match(/Estimated arrival: (.+) minutes/)
    const eta = etaMatch?.[1] || '15-20'
    return `I'm dispatching a technician to your location now. They should arrive in about ${eta} minutes. You'll receive a text with their details and live tracking. Is there anything else you need?`
  }

  // Location confirmation
  if (lowerMessage.includes('address') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
    const locationMatch = context.match(/Location: (.+)/)
    const location = locationMatch?.[1] || 'your current GPS location'
    return `I have your location as ${location}. Is that correct?`
  }

  // Goodbye
  if (lowerMessage.includes('bye') || lowerMessage.includes('thank') || lowerMessage.includes('that\'s all')) {
    return "You're all set! The technician is on the way. You can track them in real-time on your phone. Have a great day!"
  }

  // Default: ask for more details
  return "I understand. To get you the right help, could you tell me a bit more about what's happening? Is it something with plumbing, electrical, heating, or something else?"
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'retell-llm',
    description: 'Custom LLM endpoint for Retell AI voice agent',
    protocol: 'HTTP POST (Vercel serverless)',
    note: 'For WebSocket support, deploy to Railway/Render with WS upgrade',
  })
}
