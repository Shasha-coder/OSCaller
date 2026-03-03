import { NextRequest, NextResponse } from 'next/server'
import { acceptOffer } from '@/lib/dispatch'

/**
 * POST /api/dispatch/accept — Provider accepts a dispatch offer
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { offer_id, provider_id } = body

        if (!offer_id || !provider_id) {
            return NextResponse.json({ error: 'Missing offer_id or provider_id' }, { status: 400 })
        }

        const result = await acceptOffer(offer_id, provider_id)

        if (result.accepted) {
            return NextResponse.json({
                accepted: true,
                message: 'You have been assigned this job.',
            })
        }

        return NextResponse.json({
            accepted: false,
            near_miss: result.nearMiss,
            message: result.nearMiss
                ? 'Another pro was faster by seconds. You earned a priority token for the next job.'
                : 'This job has been assigned to another pro.',
        })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
