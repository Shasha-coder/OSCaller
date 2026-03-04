import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/otp/send
 * Sends a 6-digit OTP via Twilio SMS to the given phone number.
 * Stores the OTP hash in Upstash Redis with a 5-min TTL for verification.
 *
 * Body: { phone: string }  — E.164 format e.g. "+15551234567"
 */

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER!
const TWILIO_MSG_SID = process.env.TWILIO_MESSAGING_SERVICE_SID!
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL!
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!

// Rate limit: max 5 OTP sends per phone per hour
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds
const OTP_TTL = 300 // 5 minutes

function generateOTP(): string {
    // Crypto-safe 6-digit OTP
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return String(array[0] % 1000000).padStart(6, '0')
}

async function redisCommand(command: string[]): Promise<any> {
    const res = await fetch(`${UPSTASH_URL}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
    })
    return res.json()
}

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json()

        if (!phone || typeof phone !== 'string') {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        // Normalize to E.164
        const cleanPhone = phone.replace(/[^\d+]/g, '')
        if (cleanPhone.length < 10) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
        }

        // ── Rate limiting via Upstash Redis ──
        const rateLimitKey = `otp:rate:${cleanPhone}`
        const rateResult = await redisCommand(['GET', rateLimitKey])
        const currentCount = parseInt(rateResult?.result || '0')

        if (currentCount >= RATE_LIMIT_MAX) {
            return NextResponse.json(
                { error: 'Too many verification attempts. Please try again later.' },
                { status: 429 }
            )
        }

        // Generate OTP
        const otp = generateOTP()

        // Store OTP in Redis with 5-min TTL
        const otpKey = `otp:${cleanPhone}`
        await redisCommand(['SET', otpKey, otp, 'EX', String(OTP_TTL)])

        // Increment rate limit counter
        if (currentCount === 0) {
            await redisCommand(['SET', rateLimitKey, '1', 'EX', String(RATE_LIMIT_WINDOW)])
        } else {
            await redisCommand(['INCR', rateLimitKey])
        }

        // ── Send SMS via Twilio ──
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
        const authHeader = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')

        const body = new URLSearchParams({
            To: cleanPhone,
            MessagingServiceSid: TWILIO_MSG_SID,
            Body: `Your OSCaller verification code is: ${otp}\n\nThis code expires in 5 minutes. Don't share it with anyone.`,
        })

        const twilioRes = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        })

        if (!twilioRes.ok) {
            const err = await twilioRes.json()
            console.error('Twilio error:', err)
            return NextResponse.json(
                { error: 'Failed to send verification code. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent',
            // Don't send the OTP back! Only for debugging, remove in production:
            ...(process.env.NODE_ENV === 'development' ? { _debug_otp: otp } : {}),
        })
    } catch (error) {
        console.error('OTP send error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
