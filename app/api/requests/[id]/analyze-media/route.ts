import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

/**
 * POST /api/requests/[id]/analyze-media
 * 
 * Analyzes uploaded media using Vercel AI Gateway with Gemini:
 * - Images: Native vision analysis
 * - Audio: Native audio processing
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

const SYSTEM_PROMPT = `You are an AI assistant for OSCaller that analyzes images, audio, and text.
Your job is to ACCURATELY describe what you see or hear - do NOT assume or hallucinate details.

CRITICAL: Describe EXACTLY what is in the image/audio. If you see a computer, say "computer". If you see a pipe, say "pipe". DO NOT make up issues that aren't visible.

ALWAYS respond with valid JSON in this exact format:
{
  "summary": "Brief 1-2 sentence ACCURATE description of what you actually see/hear",
  "transcript": "For audio only: exact transcription of what was said",
  "detected_issue": "The specific problem IF CLEARLY VISIBLE, or null if no issue is apparent",
  "severity": "critical|high|medium|low or null - only if an actual issue is visible",
  "service_suggestion": "plumbing|electrical|hvac|locksmith|appliance|roofing|glass|pest|general or null",
  "key_details": ["actual visible details only"],
  "location_hints": ["room or area if identifiable"],
  "safety_concerns": ["only if actually visible dangers"],
  "language_detected": "For audio: the language spoken (e.g., en, es, fr)"
}

IMPORTANT RULES:
- For IMAGES: Describe ONLY what you can actually see. If it's a computer, say computer. If it's unclear, say it's unclear.
- For AUDIO: Transcribe EXACTLY what was said, detect the language spoken.
- For TEXT: Summarize accurately.
- DO NOT assume this is always a home repair issue - the customer might send any image.
- If the image doesn't show an obvious problem, just describe what you see.`

async function analyzeWithAI(input: {
  type: 'image' | 'audio' | 'text'
  imageUrl?: string
  audioBase64?: string
  audioMimeType?: string
  text?: string
}): Promise<MediaAnalysis> {

  try {
    if (!GEMINI_API_KEY) {
      console.error('[v0] GEMINI_API_KEY not set')
      throw new Error('GEMINI_API_KEY not configured')
    }

    const google = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })

    console.log('[v0] Calling Gemini for', input.type, 'analysis')

    // Build the prompt + content for each media type
    let userPrompt: string
    const parts: Array<any> = []

    if (input.type === 'image' && input.imageUrl) {
      userPrompt = 'Analyze this image and respond with JSON:'

      // Fetch the image and convert to base64 for reliable multimodal input
      try {
        const imgRes = await fetch(input.imageUrl)
        const imgBuffer = await imgRes.arrayBuffer()
        const base64 = Buffer.from(imgBuffer).toString('base64')
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'

        parts.push({
          type: 'image' as const,
          image: base64,
          mimeType: contentType,
        })
        console.log('[v0] Image fetched, size:', imgBuffer.byteLength, 'type:', contentType)
      } catch (fetchErr) {
        console.error('[v0] Failed to fetch image URL:', fetchErr)
        // Fallback: try URL directly
        parts.push({
          type: 'image' as const,
          image: new URL(input.imageUrl),
        })
      }
    } else if (input.type === 'audio' && input.audioBase64) {
      userPrompt = 'Listen to this audio message. Transcribe it and analyze. Respond with JSON:'
      parts.push({
        type: 'file' as const,
        data: input.audioBase64,
        mimeType: input.audioMimeType || 'audio/webm',
      })
    } else {
      userPrompt = `Analyze this description of a home issue and respond with JSON:\n\n"${input.text}"`
    }

    const result = await generateText({
      model: google('gemini-2.0-flash'),
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: parts.length > 0
          ? [{ type: 'text' as const, text: userPrompt }, ...parts]
          : userPrompt,
      }],
      temperature: 0.1,
      maxTokens: 1024,
    })

    const responseText = result.text

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
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
    }

    // Fallback if JSON parsing fails
    return {
      input_type: input.type,
      summary: responseText.substring(0, 200),
      detected_issue: null,
      severity: null,
      service_suggestion: null,
      key_details: [],
      location_hints: [],
      safety_concerns: [],
      analyzed_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[v0] AI analysis error:', error)
    throw error
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params
    const body = await req.json()
    const { media_type, media_url, text, audio_base64, mime_type } = body

    console.log('[v0] Analyze media request:', { media_type, hasUrl: !!media_url, hasAudio: !!audio_base64, hasText: !!text })

    if (!media_type || !['image', 'audio', 'text'].includes(media_type)) {
      return NextResponse.json({ error: 'Invalid media_type. Use: image, audio, or text' }, { status: 400 })
    }

    const db = createServerClient()

    // Verify request exists
    const { data: request, error } = await db
      .from('service_requests')
      .select('id, media_urls, media_analysis')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      console.error('[v0] Request not found:', requestId)
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Analyze based on type
    let analysis: MediaAnalysis

    try {
      if (media_type === 'image') {
        if (!media_url) {
          return NextResponse.json({ error: 'media_url required for image' }, { status: 400 })
        }
        console.log('[v0] Analyzing image:', media_url)
        analysis = await analyzeWithAI({ type: 'image', imageUrl: media_url })
      } else if (media_type === 'audio') {
        if (!audio_base64) {
          return NextResponse.json({ error: 'audio_base64 required for audio' }, { status: 400 })
        }
        console.log('[v0] Analyzing audio, size:', audio_base64.length)
        analysis = await analyzeWithAI({
          type: 'audio',
          audioBase64: audio_base64,
          audioMimeType: mime_type || 'audio/webm'
        })
      } else {
        if (!text) {
          return NextResponse.json({ error: 'text required for text mode' }, { status: 400 })
        }
        analysis = await analyzeWithAI({ type: 'text', text })
      }
    } catch (analysisError) {
      console.error('[v0] Analysis failed:', analysisError)
      // Return a fallback so the call can proceed
      analysis = {
        input_type: media_type,
        summary: media_type === 'image' ? 'Customer sent a photo of the issue' : 'Customer described an issue',
        detected_issue: null,
        severity: null,
        service_suggestion: null,
        key_details: [],
        location_hints: [],
        safety_concerns: [],
        analyzed_at: new Date().toISOString(),
      }
    }

    console.log('[v0] Analysis result:', analysis.summary)

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
    })
  } catch (err) {
    console.error('[v0] Media analysis error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
