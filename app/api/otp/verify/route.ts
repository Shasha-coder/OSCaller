import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/otp/verify
 * Verifies the OTP code against what's stored in Redis.
 * On success, creates/retrieves a Supabase session for the user.
 *
 * Body: { phone: string, code: string }
 */

const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || '').trim()
const UPSTASH_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()

const MAX_VERIFY_ATTEMPTS = 5
const VERIFY_LOCKOUT_TTL = 900 // 15 min lockout after too many failed attempts

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
        const { phone, code } = await req.json()

        if (!phone || !code) {
            return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
        }

        const cleanPhone = phone.replace(/[^\d+]/g, '')

        // ── Check for brute-force lockout ──
        const lockoutKey = `otp:lockout:${cleanPhone}`
        const lockoutResult = await redisCommand(['GET', lockoutKey])
        if (lockoutResult?.result) {
            return NextResponse.json(
                { error: 'Too many failed attempts. Please wait 15 minutes and try again.' },
                { status: 429 }
            )
        }

        // ── Get stored OTP ──
        const otpKey = `otp:${cleanPhone}`
        const storedResult = await redisCommand(['GET', otpKey])
        const storedOtp = storedResult?.result

        if (!storedOtp) {
            return NextResponse.json(
                { error: 'Code expired or not found. Please request a new code.' },
                { status: 400 }
            )
        }

        // ── Track failed attempts ──
        const attemptsKey = `otp:attempts:${cleanPhone}`

        // Timing-safe comparison
        const codeStr = String(code).padStart(6, '0')
        const isValid = codeStr.length === storedOtp.length &&
            codeStr.split('').every((c: string, i: number) => c === storedOtp[i])

        if (!isValid) {
            // Increment failed attempts
            const attemptsResult = await redisCommand(['INCR', attemptsKey])
            const attempts = parseInt(attemptsResult?.result || '1')

            if (attempts === 1) {
                await redisCommand(['EXPIRE', attemptsKey, String(VERIFY_LOCKOUT_TTL)])
            }

            if (attempts >= MAX_VERIFY_ATTEMPTS) {
                // Lock out
                await redisCommand(['SET', lockoutKey, '1', 'EX', String(VERIFY_LOCKOUT_TTL)])
                await redisCommand(['DEL', otpKey])
                await redisCommand(['DEL', attemptsKey])
                return NextResponse.json(
                    { error: 'Too many failed attempts. Account locked for 15 minutes.' },
                    { status: 429 }
                )
            }

            return NextResponse.json(
                { error: 'Invalid code. Please try again.', attemptsRemaining: MAX_VERIFY_ATTEMPTS - attempts },
                { status: 400 }
            )
        }

        // ── OTP Valid! Clean up ──
        await redisCommand(['DEL', otpKey])
        await redisCommand(['DEL', attemptsKey])

        // Return success — the client will handle Supabase session creation
        return NextResponse.json({
            success: true,
            verified: true,
            phone: cleanPhone,
        })
    } catch (error) {
        console.error('OTP verify error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
