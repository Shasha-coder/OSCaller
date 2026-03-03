import { NextResponse } from 'next/server'
import { getSafeModeStatus } from '@/lib/safe-mode'

/**
 * GET /api/health — System health check + Safe Mode status
 */
export async function GET() {
    try {
        const status = await getSafeModeStatus()

        return NextResponse.json({
            status: status.level === 0 ? 'healthy' : 'degraded',
            safe_mode: status,
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        return NextResponse.json({
            status: 'unhealthy',
            safe_mode: {
                level: 4,
                label: 'System Delay',
                message: 'We are experiencing a system delay.',
                subsystems: {
                    ai: 'down',
                    dispatch: 'down',
                    payments: 'down',
                    database: 'down',
                },
            },
            timestamp: new Date().toISOString(),
        }, { status: 503 })
    }
}
