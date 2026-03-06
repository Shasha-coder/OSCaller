import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/requests/[id]/analyze-media
 * 
 * Analyzes uploaded media using Gemini 2.0 Flash:
 * - Images: Native vision analysis
 * - Audio: Native audio processing (NO Whisper needed)
 * - Text: Fast text analysis
 * 
 * Body: { 
 *   media_type: 'image' | 'audio' | 'text',
 *   media_url?: string,        // URL to the image or audio file
 *   text?: string,             // For text mode: raw user input
 *   audio_base64?: string,     // For audio: base64 encoded audio data
 *   mime_type?: string,        // For audio: e.g., 'audio/mp3', 'audio/wav'
 * }
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash' // Latest, fastest, cheapest with full multimodal

interface MediaAnalysis {
  input_type: 'image' | 'audio' | 'text'
  summary: string                    // Plain English summary for agent TTS
  transcript?: string                // For audio: the transcribed text
  detected_issue: string | null      // e.g., "burst pipe", "sparking outlet"
  severity: 'critical' | 'high' | 'medium' | 'low' | null
  service_suggestion: string | null  // e.g., "plumbing", "electrical"
  key_details: string[]              // Bullet points agent can mention
  location_hints: string[]           // e.g., "bathroom", "kitchen sink"
  safety_concerns: string[]          // e.g., "water near electrical", "gas smell"
  language_detected?: string         // For audio: detected language
  analyzed_at: string
}

const SYSTEM_PROMPT = `You are an expert home repair diagnostic assistant for OSCaller, a 911-style emergency dispatch service.
Analyze the user's input (image, audio, or text) and extract structured information to help our AI dispatch agent.

ALWAYS respond with valid JSON in this exact format:
{
  "summary": "Brief 1-2 sentence plain English description an agent can read aloud to the customer",
  "transcript": "For audio only: exact transcription of what was said",
  "detected_issue": "The specific problem identified, or null if unclear",
  "severity": "critical|high|medium|low or null",
  "service_suggestion": "plumbing|electrical|hvac|locksmith|appliance|roofing|glass|pest|general or null",
  "key_details": ["detail 1", "detail 2"],
  "location_hints": ["room or area hints from visual or audio cues"],
  "safety_concerns": ["any immediate dangers - BE THOROUGH HERE"],
  "language_detected": "For audio: the language spoken (e.g., en, es, fr)"
}

Severity guide:
- critical: Active flooding, fire risk, gas leak, live wires exposed, security threat
- high: No water, no heat in winter, security breach, major leak
- medium: Slow leak, partial function loss, non-urgent repair needed
- low: Cosmetic, minor inconvenience, scheduled maintenance

For IMAGES: Look carefully for water damage, electrical hazards, structural issues, mold, pests.
For AUDIO: Transcribe accurately, note emotional urgency, detect language, identify the problem.
For TEXT: Extract the core issue and assess urgency.`

async function analyzeWithGemini(input: { 
  type: 'image' | 'audio' | 'text'
  imageUrl?: string
  audioBase64?: string
  audioMimeType?: string
  text?: string 
}): Promise<MediaAnalysis> {
  
  // Build the request parts based on input type
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []
  
  // Add system prompt
  parts.push({ text: SYSTEM_PROMPT })
  
  if (input.type === 'image' && input.imageUrl) {
    // Fetch image and convert to base64
    const imageResponse = await fetch(input.imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
    
    parts.push({ text: '\n\nAnalyze this image of a home repair issue:' })
    parts.push({ 
      inlineData: { 
        mimeType, 
        data: base64Image 
      } 
    })
  } else if (input.type === 'audio' && input.audioBase64) {
    // Native audio processing - Gemini 2.0 Flash handles this directly
    parts.push({ text: '\n\nListen to this audio message about a home repair issue. Transcribe it and analyze:' })
    parts.push({ 
      inlineData: { 
        mimeType: input.audioMimeType || 'audio/mp3', 
        data: input.audioBase64 
      } 
    })
  } else if (input.text) {
    parts.push({ text: `\n\nAnalyze this ${input.type} description of a home repair issue:\n\n"${input.text}"` })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('[v0] Gemini API error:', error)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No content in Gemini response')
  }

  try {
    // Parse JSON response (Gemini returns clean JSON with responseMimeType)
    const parsed = JSON.parse(content)
    return {
      input_type: input.type,
      summary: parsed.summary || 'Unable to analyze',
      transcript: parsed.transcript || undefined,
      detected_issue: parsed.detected_issue || null,
      severity: parsed.severity || null,
      service_suggestion: parsed.service_suggestion || null,
      key_details: parsed.key_details || [],
      location_hints: parsed.location_hints || [],
      safety_concerns: parsed.safety_concerns || [],
      language_detected: parsed.language_detected || undefined,
      analyzed_at: new Date().toISOString(),
    }
  } catch {
    // Fallback if JSON parsing fails
    return {
      input_type: input.type,
      summary: content.substring(0, 500),
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
    const { media_type, media_url, text, audio_base64, mime_type } = body

    if (!media_type || !['image', 'audio', 'text'].includes(media_type)) {
      return NextResponse.json({ error: 'Invalid media_type. Use: image, audio, or text' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
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
      analysis = await analyzeWithGemini({ type: 'image', imageUrl: media_url })
    } else if (media_type === 'audio') {
      if (!audio_base64) {
        return NextResponse.json({ error: 'audio_base64 required for audio' }, { status: 400 })
      }
      analysis = await analyzeWithGemini({ 
        type: 'audio', 
        audioBase64: audio_base64,
        audioMimeType: mime_type || 'audio/mp3'
      })
    } else {
      if (!text) {
        return NextResponse.json({ error: 'text required for text mode' }, { status: 400 })
      }
      analysis = await analyzeWithGemini({ type: 'text', text })
    }

    // Store analysis in service_requests
    const existingAnalysis = request.media_analysis as MediaAnalysis[] || []
    const updatedAnalysis = [...existingAnalysis, analysis]

    // Update media_urls if this is an image/audio
    const existingUrls = request.media_urls as string[] || []
    const updatedUrls = media_url && !existingUrls.includes(media_url) 
      ? [...existingUrls, media_url] 
      : existingUrls

    await db.from('service_requests')
      .update({
        media_urls: updatedUrls,
        media_analysis: updatedAnalysis,
        // Auto-set service if detected and none is set
        ...(analysis.service_suggestion && { service: analysis.service_suggestion }),
        // Auto-set priority based on severity
        ...(analysis.severity === 'critical' && { priority: 'emergency' }),
        ...(analysis.severity === 'high' && { priority: 'urgent' }),
        // Store detected language for agent context
        ...(analysis.language_detected && { preferred_language: analysis.language_detected }),
      })
      .eq('id', requestId)

    // Log event
    await db.from('request_events').insert({
      request_id: requestId,
      label: `Media analyzed (${media_type}): ${analysis.detected_issue || analysis.summary.substring(0, 50)}`,
      status: 'completed',
      actor_type: 'system',
      metadata: JSON.stringify({ 
        media_type, 
        detected_issue: analysis.detected_issue,
        severity: analysis.severity,
        language: analysis.language_detected,
      }),
    })

    // Build agent-ready prompt
    let agentPrompt = ''
    if (media_type === 'audio' && analysis.transcript) {
      agentPrompt = `The customer said: "${analysis.transcript}". Analysis: ${analysis.summary}`
    } else if (media_type === 'image') {
      agentPrompt = `The customer sent a photo showing: ${analysis.summary}`
    } else {
      agentPrompt = `The customer described: ${analysis.summary}`
    }
    
    if (analysis.safety_concerns.length > 0) {
      agentPrompt += ` SAFETY ALERT: ${analysis.safety_concerns.join(', ')}`
    }

    return NextResponse.json({
      success: true,
      analysis,
      agent_prompt: agentPrompt,
      // Cost estimate (Gemini 2.0 Flash is very cheap)
      estimated_cost_usd: media_type === 'image' ? 0.001 : media_type === 'audio' ? 0.002 : 0.0001,
    })
  } catch (err) {
    console.error('[v0] Media analysis error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
