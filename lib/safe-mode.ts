/**
 * OSCaller Safe Mode — Graceful Degradation System
 * ─── 5 levels: Normal → Total Outage ───
 */

export type SafeModeLevel = 0 | 1 | 2 | 3 | 4

export interface SafeModeStatus {
    level: SafeModeLevel
    label: string
    message: string
    subsystems: {
        ai: 'operational' | 'degraded' | 'down'
        dispatch: 'operational' | 'degraded' | 'down'
        payments: 'operational' | 'degraded' | 'down'
        database: 'operational' | 'degraded' | 'down'
    }
}

const SAFE_MODE_CONFIG: Record<SafeModeLevel, Omit<SafeModeStatus, 'subsystems'>> = {
    0: {
        level: 0,
        label: 'Normal',
        message: 'All systems operational.',
    },
    1: {
        level: 1,
        label: 'AI Degraded',
        message: 'Voice agent temporarily unavailable. Using SMS/manual intake.',
    },
    2: {
        level: 2,
        label: 'Dispatch Degraded',
        message: 'High demand detected. Your request has been captured and our team is on it.',
    },
    3: {
        level: 3,
        label: 'Payments Degraded',
        message: 'Payment processing delayed. Service continues — payment will be processed shortly.',
    },
    4: {
        level: 4,
        label: 'System Delay',
        message: 'We are experiencing a system delay. Emergency SMS steps have been sent. We will call you back.',
    },
}

/**
 * Check health of each subsystem.
 * In production, these would ping actual services.
 */
async function checkAIHealth(): Promise<'operational' | 'degraded' | 'down'> {
    try {
        // In production: ping ElevenLabs API status
        const apiKey = process.env.ELEVENLABS_API_KEY
        if (!apiKey) return 'down'
        return 'operational'
    } catch {
        return 'down'
    }
}

async function checkDispatchHealth(): Promise<'operational' | 'degraded' | 'down'> {
    try {
        // In production: check if dispatch queue is responding
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl) return 'down'
        return 'operational'
    } catch {
        return 'degraded'
    }
}

async function checkPaymentsHealth(): Promise<'operational' | 'degraded' | 'down'> {
    try {
        // In production: ping Stripe API status
        const stripeKey = process.env.STRIPE_SECRET_KEY
        if (!stripeKey) return 'down'
        return 'operational'
    } catch {
        return 'down'
    }
}

async function checkDatabaseHealth(): Promise<'operational' | 'degraded' | 'down'> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseKey) return 'down'
        return 'operational'
    } catch {
        return 'down'
    }
}

/**
 * Determine current Safe Mode level based on subsystem health.
 */
export async function getSafeModeStatus(): Promise<SafeModeStatus> {
    const [ai, dispatch, payments, database] = await Promise.all([
        checkAIHealth(),
        checkDispatchHealth(),
        checkPaymentsHealth(),
        checkDatabaseHealth(),
    ])

    const subsystems = { ai, dispatch, payments, database }

    // Determine level based on worst-case
    let level: SafeModeLevel = 0

    if (database === 'down') {
        level = 4 // Total outage
    } else if (dispatch === 'down') {
        level = 2
    } else if (payments === 'down') {
        level = 3
    } else if (ai === 'down') {
        level = 1
    } else if (ai === 'degraded' || dispatch === 'degraded') {
        level = 1
    }

    return {
        ...SAFE_MODE_CONFIG[level],
        subsystems,
    }
}

/**
 * Get user-facing safe mode message for the frontend.
 */
export function getSafeModeMessage(level: SafeModeLevel): string {
    return SAFE_MODE_CONFIG[level].message
}

/**
 * Check if a specific feature should be available at the current safe mode level.
 */
export function isFeatureAvailable(level: SafeModeLevel, feature: 'voice_agent' | 'dispatch' | 'payments' | 'tracking'): boolean {
    switch (feature) {
        case 'voice_agent':
            return level === 0
        case 'dispatch':
            return level <= 1
        case 'payments':
            return level <= 2
        case 'tracking':
            return level <= 3
    }
}
