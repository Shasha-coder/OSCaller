import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * GET /api/providers
 * Returns list of available providers with their profile data.
 * Used by the ElevenLabs agent to match clients with providers.
 * 
 * Query params:
 *   ?trade=Plumbing      → filter by trade
 *   ?country=CA           → filter by country
 *   ?status=online        → filter by status
 *   ?lat=43.65&lng=-79.38 → (future) proximity
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const trade = searchParams.get('trade')
    const country = searchParams.get('country')
    const status = searchParams.get('status')

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase
        .from('profiles')
        .select('id, name, phone, email, trade, trades, address, country, country_dial, language, status, created_at')
        .eq('role', 'provider')

    if (trade) query = query.contains('trades', [trade])
    if (country) query = query.eq('country', country)
    if (status) query = query.eq('status', status)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        providers: data,
        count: data?.length || 0,
        filters: { trade, country, status },
    })
}
