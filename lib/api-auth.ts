import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API Security Middleware
 * Validates requests using either:
 * 1. Bearer token (Supabase JWT) for authenticated users
 * 2. X-API-Key header for external integrations (ElevenLabs)
 *
 * Usage in route handlers:
 *   const auth = await validateAPIRequest(request)
 *   if (!auth.valid) return auth.response
 */

const API_KEY = process.env.OSCALLER_API_KEY || ''

interface AuthResult {
    valid: true
    userId?: string
    role?: string
}

interface AuthError {
    valid: false
    response: NextResponse
}

export async function validateAPIRequest(
    request: NextRequest,
    options: { requireAuth?: boolean; allowRoles?: string[]; allowApiKey?: boolean } = {}
): Promise<AuthResult | AuthError> {
    const { requireAuth = true, allowRoles, allowApiKey = true } = options

    // 1. Check rate limiting headers
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // 2. Check API key (for external integrations like ElevenLabs)
    if (allowApiKey) {
        const apiKey = request.headers.get('x-api-key')
        if (apiKey && API_KEY && apiKey === API_KEY) {
            return { valid: true, role: 'api' }
        }
    }

    // 3. Check Bearer token (Supabase JWT)
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)

        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

            const supabase = createClient(supabaseUrl, supabaseServiceKey)

            const { data: { user }, error } = await supabase.auth.getUser(token)

            if (error || !user) {
                return {
                    valid: false,
                    response: NextResponse.json(
                        { error: 'Invalid or expired token' },
                        { status: 401, headers: corsHeaders() }
                    ),
                }
            }

            // Check role if required
            if (allowRoles) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (!profile || !allowRoles.includes(profile.role)) {
                    return {
                        valid: false,
                        response: NextResponse.json(
                            { error: 'Insufficient permissions' },
                            { status: 403, headers: corsHeaders() }
                        ),
                    }
                }

                return { valid: true, userId: user.id, role: profile.role }
            }

            return { valid: true, userId: user.id }
        } catch {
            return {
                valid: false,
                response: NextResponse.json(
                    { error: 'Authentication failed' },
                    { status: 401, headers: corsHeaders() }
                ),
            }
        }
    }

    // 4. No credentials provided
    if (requireAuth) {
        return {
            valid: false,
            response: NextResponse.json(
                { error: 'Authentication required. Provide Bearer token or X-API-Key header.' },
                { status: 401, headers: corsHeaders() }
            ),
        }
    }

    return { valid: true }
}

/** CORS headers for cross-origin API access */
function corsHeaders(): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    }
}

/** Sanitize string input to prevent injection */
export function sanitize(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Strip HTML tags
        .slice(0, 1000) // Max length
}

/** Validate phone number format */
export function isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Standard error response */
export function apiError(message: string, status: number = 400) {
    return NextResponse.json(
        { error: message, timestamp: new Date().toISOString() },
        { status, headers: corsHeaders() }
    )
}

/** Standard success response */
export function apiSuccess(data: Record<string, unknown>, status: number = 200) {
    return NextResponse.json(
        { ...data, timestamp: new Date().toISOString() },
        { status, headers: corsHeaders() }
    )
}
