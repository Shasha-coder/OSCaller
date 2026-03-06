import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/requests/[id]/analyze-media
 * 
 * Analyzes uploaded media (images, voice transcripts) using GPT-5.1 vision
 * and stores a structured summary that the AI agent can read instantly.
 * 
 * Body: { 
 *   media_type: 'image' | 'voice' | 'text',
 *   media_url?: string,        // For images: URL to the image
 *   transcript?: string,       // For voice: transcribed text
 *   text?: string,             // For text: raw user input
 * }
 * 
 * The analysis is stored in service_requests.media_analysis as structured JSON
 * that the agent can consume without re-calling vision APIs.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

interface MediaAnalysis {
  input_type: 'image' | 'voice' | 'text'
  summary: string                    // Plain English summary for agent TTS
  detected_issue: string | null      // e.g., "burst pipe", "sparking outlet"
  severity: 'critical' | 'high' | 'medium' | 'low' | null
  service_suggestion: string | null  // e.g., "plumbing", "electrical"
  key_details: string[]              // Bullet points agent can mention
  location_hints: string[]           // e.g., "bathroom", "kitchen sink"
  safety_concerns: string[]          // e.g., "water near electrical", "gas smell"
  analyzed_at: string
}

async function analyzeWithGPT(input: { 
  type: 'image' | 'voice' | 'text'
  imageUrl?: string
  text?: string 
}): Promise<MediaAnalysis> {
  const systemPrompt = `You are an expert home repair diagnostic assistant for OSCaller, a 911-style dispatch service.
Analyze the user's input and extract structured information to help our AI dispatch agent.

ALWAYS respond with valid JSON in this exact format:
{
  "summary": "Brief 1-2 sentence plain English description an agent can read aloud",
  "detected_issue": "The specific problem identified, or null if unclear",
  "severity": "critical|high|medium|low or null",
  "service_suggestion": "plumbing|electrical|hvac|locksmith|appliance|roofing|glass|pest or null",
  "key_details": ["detail 1", "detail 2"],
  "location_hints": ["room or area hints"],
  "safety_concerns": ["any immediate dangers"]
}

Severity guide:
- critical: Active flooding, fire risk, gas leak, live wires exposed
- high: No water, no heat in winter, security breach
- medium: Slow leak, partial function loss
- low: Cosmetic, minor inconvenience`

  const messages: Array<{ role: 'system' | 'user'; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
    { role: 'system', content: systemPrompt }
  ]

  if (input.type === 'image' && input.imageUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this image of a home repair issue:' },
        { type: 'image_url', image_url: { url: input.imageUrl } }
      ]
    })
  } else {
    messages.push({
      role: 'user',
      content: `Analyze this ${input.type} description of a home repair issue:\n\n"${input.text}"`
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Use GPT-4o for vision, will work with gpt-5.1 when available
      messages,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[v0] OpenAI API error:', error)
    throw new Error('Failed to analyze media')
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  try {
    const parsed = JSON.parse(content)
    return {
      input_type: input.type,
      summary: parsed.summary || 'Unable to analyze',
      detected_issue: parsed.detected_issue || null,
      severity: parsed.severity || null,
      service_suggestion: parsed.service_suggestion || null,
      key_details: parsed.key_details || [],
      location_hints: parsed.location_hints || [],
      safety_concerns: parsed.safety_concerns || [],
      analyzed_at: new Date().toISOString(),
    }
  } catch {
    return {
      input_type: input.type,
      summary: content || 'Unable to analyze',
      detected_issue: null,
      severity: null,
      service_suggestion: null,
      key_details: [],
      location_hints: [],
      safety_concerns: [],
      analyzed_at: new Date().toISOString(),
    }
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params
    const body = await req.json()
    const { media_type, media_url, transcript, text } = body

    if (!media_type || !['image', 'voice', 'text'].includes(media_type)) {
      return NextResponse.json({ error: 'Invalid media_type' }, { status: 400 })
    }

    const db = createServerClient()

    // Verify request exists
    const { data: request, error } = await db
      .from('service_requests')
      .select('id, media_urls, media_analysis')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Analyze based on type
    let analysis: MediaAnalysis

    if (media_type === 'image') {
      if (!media_url) {
        return NextResponse.json({ error: 'media_url required for image' }, { status: 400 })
      }
      analysis = await analyzeWithGPT({ type: 'image', imageUrl: media_url })
    } else if (media_type === 'voice') {
      if (!transcript) {
        return NextResponse.json({ error: 'transcript required for voice' }, { status: 400 })
      }
      analysis = await analyzeWithGPT({ type: 'voice', text: transcript })
    } else {
      if (!text) {
        return NextResponse.json({ error: 'text required for text mode' }, { status: 400 })
      }
      analysis = await analyzeWithGPT({ type: 'text', text })
    }

    // Store analysis in service_requests
    const existingAnalysis = request.media_analysis as MediaAnalysis[] || []
    const updatedAnalysis = [...existingAnalysis, analysis]

    // Also update media_urls if this is an image
    const existingUrls = request.media_urls as string[] || []
    const updatedUrls = media_url && !existingUrls.includes(media_url) 
      ? [...existingUrls, media_url] 
      : existingUrls

    await db.from('service_requests')
      .update({
        media_urls: updatedUrls,
        media_analysis: updatedAnalysis,
        // Auto-set service if we detected one and none is set
        ...(analysis.service_suggestion && { service: analysis.service_suggestion }),
        // Auto-set priority based on severity
        ...(analysis.severity === 'critical' && { priority: 'emergency' }),
        ...(analysis.severity === 'high' && { priority: 'urgent' }),
      })
      .eq('id', requestId)

    // Log event for audit trail
    await db.from('request_events').insert({
      request_id: requestId,
      label: `Media analyzed: ${analysis.summary.substring(0, 100)}`,
      status: 'completed',
      actor_type: 'system',
      metadata: JSON.stringify({ 
        media_type, 
        detected_issue: analysis.detected_issue,
        severity: analysis.severity,
      }),
    })

    return NextResponse.json({
      success: true,
      analysis,
      // Agent-ready summary
      agent_prompt: `The customer ${media_type === 'image' ? 'sent a photo showing' : 'described'}: ${analysis.summary}${analysis.safety_concerns.length > 0 ? ` SAFETY NOTE: ${analysis.safety_concerns.join(', ')}` : ''}`,
    })
  } catch (err) {
    console.error('[v0] Media analysis error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
