import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * PUT /api/providers/[id]/location — Update provider GPS location
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { lat, lng, heading, speed } = body

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Missing lat or lng' }, { status: 400 })
        }

        const db = createServerClient()

        const { data, error } = await db
            .from('provider_locations')
            .insert({
                provider_id: id,
                lat,
                lng,
                heading: heading || null,
                speed: speed || null,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ location: data })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
