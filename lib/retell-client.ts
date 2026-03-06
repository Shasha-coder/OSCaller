// ═══════════════════════════════════════════════════════════════════════════════
// Retell AI API Client for OSCaller
// ═══════════════════════════════════════════════════════════════════════════════

import type { 
  CreatePhoneCallRequest, 
  CreatePhoneCallResponse,
  RetellAgent,
  CountryConfig
} from './retell-types'

const RETELL_API_URL = 'https://api.retellai.com'

class RetellClient {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.RETELL_API_KEY || ''
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${RETELL_API_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Retell API Error: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  // ── Phone Calls ──────────────────────────────────────────────────────────────

  /**
   * Create an outbound phone call to the client
   */
  async createPhoneCall(params: CreatePhoneCallRequest): Promise<CreatePhoneCallResponse> {
    return this.request<CreatePhoneCallResponse>('/v2/create-phone-call', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /**
   * Get call details by ID
   */
  async getCall(callId: string): Promise<CreatePhoneCallResponse> {
    return this.request<CreatePhoneCallResponse>(`/v2/get-call/${callId}`)
  }

  /**
   * List all calls
   */
  async listCalls(params?: { 
    limit?: number
    sort_order?: 'ascending' | 'descending'
    filter_criteria?: Record<string, unknown>
  }): Promise<CreatePhoneCallResponse[]> {
    return this.request<CreatePhoneCallResponse[]>('/v2/list-calls', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  // ── Agents ───────────────────────────────────────────────────────────────────

  /**
   * Create a new Retell agent
   */
  async createAgent(params: {
    agent_name: string
    voice_id: string
    language: string
    response_engine: {
      type: 'retell-llm'
      llm_id: string
    }
  }): Promise<{ agent_id: string }> {
    return this.request('/v2/create-agent', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<Record<string, unknown>> {
    return this.request(`/v2/get-agent/${agentId}`)
  }

  /**
   * Update an agent
   */
  async updateAgent(agentId: string, params: {
    agent_name?: string
    voice_id?: string
    language?: string
  }): Promise<Record<string, unknown>> {
    return this.request(`/v2/update-agent/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    })
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/v2/delete-agent/${agentId}`, {
      method: 'DELETE',
    })
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<Array<{ agent_id: string; agent_name: string }>> {
    return this.request('/v2/list-agents')
  }

  // ── Phone Numbers ────────────────────────────────────────────────────────────

  /**
   * List phone numbers
   */
  async listPhoneNumbers(): Promise<Array<{
    phone_number: string
    phone_number_pretty: string
    inbound_agent_id: string | null
    area_code: string
    nickname: string | null
  }>> {
    return this.request('/v2/list-phone-numbers')
  }

  /**
   * Get phone number details
   */
  async getPhoneNumber(phoneNumber: string): Promise<{
    phone_number: string
    inbound_agent_id: string | null
  }> {
    return this.request(`/v2/get-phone-number/${encodeURIComponent(phoneNumber)}`)
  }

  /**
   * Update phone number (assign agent)
   */
  async updatePhoneNumber(phoneNumber: string, params: {
    inbound_agent_id?: string | null
    nickname?: string
  }): Promise<void> {
    await this.request(`/v2/update-phone-number/${encodeURIComponent(phoneNumber)}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    })
  }

  // ── LLM ──────────────────────────────────────────────────────────────────────

  /**
   * Create a Retell LLM with custom WebSocket URL
   */
  async createLLM(params: {
    model: string
    general_prompt: string
    general_tools?: Array<{
      type: string
      name: string
      description: string
      parameters?: Record<string, unknown>
    }>
    // Use custom LLM WebSocket
    llm_websocket_url?: string
  }): Promise<{ llm_id: string }> {
    return this.request('/v2/create-retell-llm', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /**
   * Update LLM
   */
  async updateLLM(llmId: string, params: {
    general_prompt?: string
    llm_websocket_url?: string
  }): Promise<void> {
    await this.request(`/v2/update-retell-llm/${llmId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    })
  }
}

// Singleton instance
export const retellClient = new RetellClient()

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get the appropriate Retell agent for a country
 */
export async function getAgentForCountry(
  countryCode: string,
  agents: RetellAgent[]
): Promise<RetellAgent | null> {
  return agents.find(a => a.country_code === countryCode && a.is_active) || null
}

/**
 * Format phone number to E.164
 */
export function toE164(phone: string, dialCode: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith(dialCode.replace('+', ''))) {
    return `+${cleaned}`
  }
  return `${dialCode}${cleaned}`
}

/**
 * Detect country from coordinates using reverse geocoding
 */
export async function detectCountryFromCoords(
  lat: number,
  lng: number
): Promise<{ code: string; name: string } | null> {
  try {
    // Use Google Maps Geocoding API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return null

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=country`
    )
    const data = await response.json()

    if (data.results?.[0]) {
      const countryComponent = data.results[0].address_components?.find(
        (c: { types: string[] }) => c.types.includes('country')
      )
      if (countryComponent) {
        return {
          code: countryComponent.short_name,
          name: countryComponent.long_name,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get country config defaults
 */
export const DEFAULT_COUNTRY_CONFIGS: CountryConfig[] = [
  {
    code: 'CA',
    name: 'Canada',
    dial_code: '+1',
    languages: ['en-CA', 'fr-CA'],
    default_language: 'en-CA',
    is_active: true,
  },
  {
    code: 'US',
    name: 'United States',
    dial_code: '+1',
    languages: ['en-US', 'es-419'],
    default_language: 'en-US',
    is_active: true,
  },
  {
    code: 'FR',
    name: 'France',
    dial_code: '+33',
    languages: ['fr-FR'],
    default_language: 'fr-FR',
    is_active: false,
  },
  {
    code: 'DE',
    name: 'Germany',
    dial_code: '+49',
    languages: ['de-DE'],
    default_language: 'de-DE',
    is_active: false,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dial_code: '+44',
    languages: ['en-GB'],
    default_language: 'en-GB',
    is_active: false,
  },
]
