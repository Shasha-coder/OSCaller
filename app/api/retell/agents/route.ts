// ═══════════════════════════════════════════════════════════════════════════════
// Retell Agents CRUD API - Admin management of AI agents per country
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { retellClient } from '@/lib/retell-client'

// GET /api/retell/agents - List all agents
export async function GET() {
  try {
    const db = createServerClient()

    const { data: agents, error } = await db
      .from('retell_agents')
      .select('*')
      .order('country_code', { ascending: true })

    if (error) {
      console.error('[Retell Agents] List error:', error)
      return NextResponse.json({ error: 'Failed to list agents' }, { status: 500 })
    }

    // Also fetch agents from Retell API to sync
    let retellAgents: Array<{ agent_id: string; agent_name: string }> = []
    try {
      retellAgents = await retellClient.listAgents()
    } catch {
      // Silently fail - we still have local data
    }

    return NextResponse.json({
      agents: agents || [],
      retell_agents: retellAgents,
      count: agents?.length || 0,
    })
  } catch (error) {
    console.error('[Retell Agents] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/retell/agents - Create new agent configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      country_code,
      language,
      phone_number,
      agent_id, // Existing Retell agent ID (optional - will create if not provided)
      voice_id,
      voice_model,
    } = body

    if (!name || !country_code || !language || !phone_number) {
      return NextResponse.json(
        { error: 'Missing required fields: name, country_code, language, phone_number' },
        { status: 400 }
      )
    }

    const db = createServerClient()

    // Check if agent already exists for this country
    const { data: existing } = await db
      .from('retell_agents')
      .select('id')
      .eq('country_code', country_code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Agent already exists for country: ${country_code}. Use PATCH to update.` },
        { status: 409 }
      )
    }

    // If no agent_id provided, we just store the config (agent created in Retell dashboard)
    const { data: newAgent, error } = await db
      .from('retell_agents')
      .insert({
        name,
        country_code,
        language,
        phone_number,
        agent_id: agent_id || `pending-${Date.now()}`,
        voice_id: voice_id || 'retell-Cimo',
        voice_model: voice_model || null,
        is_active: !!agent_id, // Only active if agent_id is provided
      })
      .select()
      .single()

    if (error) {
      console.error('[Retell Agents] Create error:', error)
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      agent: newAgent,
      message: agent_id 
        ? 'Agent configuration created and linked to Retell agent.'
        : 'Agent configuration created. Link a Retell agent_id to activate.',
    }, { status: 201 })
  } catch (error) {
    console.error('[Retell Agents] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/retell/agents - Update agent configuration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing agent id' }, { status: 400 })
    }

    const db = createServerClient()

    // Validate updates
    const allowedFields = ['name', 'language', 'phone_number', 'agent_id', 'voice_id', 'voice_model', 'is_active']
    const filteredUpdates: Record<string, unknown> = {}
    
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key]
      }
    }

    filteredUpdates.updated_at = new Date().toISOString()

    const { data: updated, error } = await db
      .from('retell_agents')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Retell Agents] Update error:', error)
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      agent: updated,
    })
  } catch (error) {
    console.error('[Retell Agents] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/retell/agents?id=xxx - Delete agent configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing agent id' }, { status: 400 })
    }

    const db = createServerClient()

    const { error } = await db
      .from('retell_agents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Retell Agents] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Agent deleted' })
  } catch (error) {
    console.error('[Retell Agents] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
