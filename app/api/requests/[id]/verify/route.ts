import { NextRequest, NextResponse } from 'next/server'
import { verifyServiceCode } from '@/lib/dispatch'

/**
 * POST /api/requests/[id]/verify — Provider verifies service code at arrival
 * 
 * When provider arrives and client provides their code (e.g., OS3460),
 * this endpoint verifies it and transitions status to in_progress.
 * 
 * Body: { code, provider_id }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params
        const body = await req.json()
        const { code, provider_id } = body

        if (!code || !provider_id) {
            return NextResponse.json(
                { error: 'Missing code or provider_id' }, 
                { status: 400 }
            )
        }

        const result = await verifyServiceCode(requestId, code, provider_id)

        if (!result.verified) {
            return NextResponse.json(
                { verified: false, error: result.error }, 
                { status: 400 }
            )
        }

        return NextResponse.json({
            verified: true,
            message: 'Service code verified. Work can begin.',
            status: 'in_progress',
        })
    } catch (err) {
        console.error('[v0] Service code verification error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
