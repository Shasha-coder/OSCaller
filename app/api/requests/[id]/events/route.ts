import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET  /api/requests/[id]/events — Get timeline events for a request
 * POST /api/requests/[id]/events — Add a timeline event
 */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const db = createServerClient()

        const { data, error } = await db
            .from('request_events')
            .select('*')
            .eq('request_id', id)
            .order('created_at', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ events: data })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { label, metadata } = body

        if (!label) {
            return NextResponse.json({ error: 'Missing required field: label' }, { status: 400 })
        }

        const db = createServerClient()

        // Mark existing active events as complete
        await db.from('request_events')
            .update({ status: 'complete' })
            .eq('request_id', id)
            .eq('status', 'active')

        // Add new event
        const { data, error } = await db
            .from('request_events')
            .insert({
                request_id: id,
                label,
                status: 'active',
                metadata: metadata || null,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ event: data }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
