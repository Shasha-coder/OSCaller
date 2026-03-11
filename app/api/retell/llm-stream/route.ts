// ═══════════════════════════════════════════════════════════════════════════════
// Retell AI Custom LLM with Streaming (Production Version)
// 
// This endpoint uses the Vercel AI SDK to generate intelligent, streaming
// responses for the Retell voice agent. It injects OSCaller context for
// personalized, context-aware conversations.
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { createServerClient } from '@/lib/supabase'
import { redis } from '@/lib/redis'

interface Utterance {
  role: 'agent' | 'user'
  content: string
}

interface RetellRequest {
  interaction_type: 'update_only' | 'response_required' | 'reminder_required'
  response_id?: number
  transcript?: Utterance[]
  call_id?: string
  metadata?: {
    request_id?: string
    customer_name?: string
    language?: string
  }
}

// Production Aria System Prompt (from OSCaller Retell AI Production Playbook)
const ARIA_SYSTEM_PROMPT = `You are Aria, the AI voice assistant for OSCaller, a platform that connects customers with trusted home service professionals.

Your role is to quickly understand the customer's issue, confirm the address and urgency, gather missing details, and help OSCaller dispatch the right provider.

STYLE
- Warm, professional, efficient
- Speak naturally for phone conversations
- Keep replies concise unless clarification is needed
- Sound calm, especially during urgent home issues
- Never sound robotic or overly salesy

GOALS
1. Confirm the customer's name if available
2. Confirm the problem type
3. Reference uploaded photo or prior analysis naturally if available
4. Confirm exact location and access details
5. Assess urgency: emergency, urgent, standard
6. Confirm dispatch approval before proceeding
7. Give realistic next-step expectations
8. Avoid making false promises

PRICING
- Service call fee starts at $89
- Labor starts at $65/hour
- Parts are quoted separately by the technician
- If exact pricing is unclear, say the technician will confirm after inspection

SAFETY RULES
- If the issue sounds life-threatening or dangerous, prioritize safety over dispatch
- For gas leaks, active fire risk, major flooding near electrical systems, or suspected carbon monoxide issues:
  - instruct the customer to move to safety
  - advise contacting emergency services if appropriate
  - do not delay on non-essential questions
- Never instruct customers to perform dangerous repairs

CALL RULES
- Ask only the questions needed to move the job forward
- Confirm before dispatching a provider
- If unsure, ask a short clarifying question
- If the caller is upset, acknowledge the situation briefly and keep moving toward a solution
- If a provider is not immediately available, explain that OSCaller is checking the nearest available technician
- If dispatch is confirmed, provide the next step and ETA expectation if available

CONTEXT USE
- If photo_summary exists, reference it naturally: "From the photo, it looks like..."
- If service_type exists, use it to guide questions
- If urgency exists, confirm it rather than assuming it
- If address exists, read it back and verify accuracy

OUTPUT INTENT
Your job is to gather and confirm information so OSCaller can:
- match the nearest provider
- estimate urgency
- confirm dispatch
- update ETA and tracking`

export async function POST(request: NextRequest) {
  try {
    const body: RetellRequest = await request.json()
    const { interaction_type, response_id, transcript, metadata } = body

    // Handle update_only - just acknowledge
    if (interaction_type === 'update_only') {
      return NextResponse.json({ received: true })
    }

    // Build OSCaller context
    const oscallerContext = await buildOSCallerContext(metadata?.request_id)

    // Build conversation messages for the AI
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: ARIA_SYSTEM_PROMPT },
    ]

    // Inject language instruction if the customer selected a non-English language
    const lang = metadata?.language || ''
    const langCodeToName: Record<string, string> = {
      'fr': 'French', 'es': 'Spanish', 'ar': 'Arabic', 'pt': 'Portuguese',
      'hi': 'Hindi', 'zh': 'Mandarin Chinese', 'de': 'German', 'it': 'Italian',
      'ja': 'Japanese', 'ko': 'Korean', 'nl': 'Dutch', 'pl': 'Polish',
      'tr': 'Turkish', 'sv': 'Swedish', 'id': 'Indonesian', 'fil': 'Filipino',
      'ro': 'Romanian', 'uk': 'Ukrainian', 'el': 'Greek', 'cs': 'Czech',
      'da': 'Danish', 'fi': 'Finnish', 'bg': 'Bulgarian', 'hr': 'Croatian',
      'sk': 'Slovak', 'ta': 'Tamil', 'ms': 'Malay',
    }
    const isEnglish = !lang || ['en', 'en-US', 'en-CA'].includes(lang)
    if (!isEnglish) {
      const fullLangName = langCodeToName[lang] || langCodeToName[lang.split('-')[0]] || lang
      messages.push({
        role: 'system',
        content: `CRITICAL LANGUAGE REQUIREMENT: The customer speaks ${fullLangName}. You MUST conduct this ENTIRE conversation in ${fullLangName}. Every sentence you say must be in ${fullLangName}. Do NOT speak English unless the customer switches to English first.`,
      })
    }

    // Add OSCaller context as system message
    if (oscallerContext) {
      messages.push({
        role: 'system',
        content: `CURRENT CALL CONTEXT:\n${oscallerContext}`,
      })
    }

    // Add transcript history
    if (transcript) {
      for (const utterance of transcript) {
        messages.push({
          role: utterance.role === 'agent' ? 'assistant' : 'user',
          content: utterance.content,
        })
      }
    }

    // Handle reminder (user silent)
    if (interaction_type === 'reminder_required') {
      messages.push({
        role: 'system',
        content: 'The customer has been silent. Gently prompt them to continue or ask if they need help.',
      })
    }

    // Stream the response using AI SDK
    const result = streamText({
      model: gateway('openai/gpt-4o-mini'),
      messages,
      maxTokens: 150, // Keep responses short for voice
      temperature: 0.7,
    })

    // Collect the full response for Retell's expected format
    let fullContent = ''

    for await (const chunk of result.textStream) {
      fullContent += chunk
    }

    // Return in Retell's expected format
    const response = {
      response_id,
      content: fullContent,
      content_complete: true,
      end_call: shouldEndCall(fullContent, transcript),
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Retell LLM Stream Error]', error)
    return NextResponse.json({
      response_id: 0,
      content: "I'm having a brief technical issue. Could you repeat that?",
      content_complete: true,
      end_call: false,
    })
  }
}

// Build context from OSCaller's database
async function buildOSCallerContext(requestId?: string): Promise<string> {
  if (!requestId) return ''

  try {
    const db = createServerClient()

    const { data: request } = await db
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!request) return ''

    let context = `
Service Request ID: ${requestId}
Customer Name: ${request.customer_name || 'Not provided'}
Phone: ${request.customer_phone || 'Not provided'}
Location: ${request.address || `GPS coordinates: ${request.lat}, ${request.lng}`}
Language: ${request.language || 'English'}
Service Type: ${request.service || 'Not yet determined'}
Priority: ${request.priority || 'standard'}
Description: ${request.description || 'Customer will describe'}
Status: ${request.status}
`

    // Add media analysis if available
    if (request.media_analysis) {
      const analysis = Array.isArray(request.media_analysis)
        ? request.media_analysis[0]
        : request.media_analysis

      if (analysis) {
        context += `
CUSTOMER UPLOADED A PHOTO:
- What's in the photo: ${analysis.summary || 'Image uploaded'}
- Detected Issue: ${analysis.detected_issue || 'See photo'}
- Severity: ${analysis.severity || 'To be assessed'}
- Safety Concerns: ${analysis.safety_concerns?.join(', ') || 'None identified'}
- Suggested Service: ${analysis.service_suggestion || request.service || 'General repair'}

IMPORTANT: Reference the photo naturally. Say something like "I can see from the photo you sent..."
`
      }
    }

    // Add provider availability
    const cachedProviders = await redis.get(`dispatch:${requestId}:providers`)
    if (cachedProviders) {
      const providers = JSON.parse(cachedProviders as string)
      if (providers.length > 0) {
        context += `
AVAILABLE TECHNICIANS:
- ${providers.length} qualified technicians nearby
- Closest is ${providers[0]?.distance_km?.toFixed(1) || '?'}km away
- Estimated arrival: ${providers[0]?.eta_minutes || 15}-${(providers[0]?.eta_minutes || 15) + 10} minutes
`
      }
    }

    // Add dispatch status
    if (request.provider_id || request.technician_id) {
      context += `
DISPATCH STATUS: A technician has been assigned!
- Technician: ${request.technician_name || 'Assigned'}
- ETA: ${request.eta_minutes || 15} minutes
- Service Code: ${request.service_code || 'Will be provided'}
`
    }

    return context
  } catch (error) {
    console.error('[Context Build Error]', error)
    return ''
  }
}

// Determine if we should end the call based on conversation
function shouldEndCall(response: string, transcript?: Utterance[]): boolean {
  const lowerResponse = response.toLowerCase()

  // Check for goodbye indicators in our response
  if (
    lowerResponse.includes('have a great day') ||
    lowerResponse.includes('goodbye') ||
    lowerResponse.includes('take care') ||
    lowerResponse.includes("you're all set")
  ) {
    // Only end if this isn't the first few exchanges
    if (transcript && transcript.length > 6) {
      return true
    }
  }

  return false
}

// GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'retell-llm-stream',
    model: 'gpt-4o-mini via AI Gateway',
    features: ['streaming', 'context-injection', 'media-awareness'],
  })
}
