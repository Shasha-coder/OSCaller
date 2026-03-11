import { NextRequest, NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const VIDEO_ANALYSIS_PROMPT = `You are an expert home repair diagnostician analyzing a live video frame from a customer's camera.

ANALYZE the image and provide:
1. What you see (the visible issue, environment, affected area)
2. Initial assessment of severity (minor / moderate / serious / emergency)  
3. What tools or parts might be needed
4. Questions you would ask the customer to better understand the problem

Respond in this JSON format:
{
  "description": "What you see in the frame",
  "issue_detected": "The specific problem identified, or 'unclear' if not visible",
  "severity": "minor | moderate | serious | emergency",
  "suggested_trade": "plumbing | electrical | hvac | locksmith | roofing | general",
  "tools_needed": ["tool1", "tool2"],
  "follow_up_questions": ["question1", "question2"],
  "advice": "Immediate advice for the customer"
}

Be specific and practical. If the image is unclear, say so and suggest better angles.`

export async function POST(request: NextRequest) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
        }

        const { frame, requestId } = await request.json()

        if (!frame) {
            return NextResponse.json({ error: 'No frame data provided' }, { status: 400 })
        }

        // frame is a base64 data URL like "data:image/jpeg;base64,..."
        const base64Match = frame.match(/^data:([^;]+);base64,(.+)$/)
        if (!base64Match) {
            return NextResponse.json({ error: 'Invalid frame format' }, { status: 400 })
        }

        const mimeType = base64Match[1]
        const base64Data = base64Match[2]

        console.log('[video-analysis] Analyzing frame, size:', Math.round(base64Data.length / 1024), 'KB, requestId:', requestId)

        const google = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY })

        const result = await generateText({
            model: google('gemini-2.0-flash'),
            system: VIDEO_ANALYSIS_PROMPT,
            messages: [{
                role: 'user',
                content: [
                    { type: 'text' as const, text: 'Analyze this live video frame from the customer\'s camera:' },
                    { type: 'image' as const, image: base64Data, mimeType },
                ],
            }],
            temperature: 0.2,
            maxTokens: 800,
        })

        // Parse JSON from response
        let analysis
        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/)
            analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { description: result.text, issue_detected: 'see description' }
        } catch {
            analysis = { description: result.text, issue_detected: 'see raw analysis' }
        }

        console.log('[video-analysis] Result:', analysis.issue_detected, '| severity:', analysis.severity)

        return NextResponse.json({
            success: true,
            analysis,
            timestamp: new Date().toISOString(),
        })

    } catch (error: any) {
        console.error('[video-analysis] Error:', error?.message || error)
        return NextResponse.json({
            error: 'Analysis failed',
            details: error?.message,
        }, { status: 500 })
    }
}
