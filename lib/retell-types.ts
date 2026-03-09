// ═══════════════════════════════════════════════════════════════════════════════
// Retell AI Types for OSCaller
// ═══════════════════════════════════════════════════════════════════════════════

// ── Agent Configuration ──────────────────────────────────────────────────────
export interface RetellAgent {
  id: string
  agent_id: string // Retell's agent ID
  name: string
  country_code: string // 'CA', 'US', 'FR', etc.
  language: string // 'en-CA', 'en-US', 'fr-FR'
  phone_number: string // E.164 format
  voice_id: string
  voice_model?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Country Configuration ────────────────────────────────────────────────────
export interface CountryConfig {
  code: string // 'CA', 'US', 'FR'
  name: string
  dial_code: string // '+1', '+33'
  languages: string[] // ['en-CA', 'fr-CA']
  default_language: string
  agent_id?: string // Retell agent ID for this country
  phone_number?: string // Retell phone number for this country
  is_active: boolean
}

// ── Retell API Request/Response Types ────────────────────────────────────────

// Create Phone Call Request
export interface CreatePhoneCallRequest {
  from_number: string // Our Retell number (E.164)
  to_number: string // Client's phone (E.164)
  override_agent_id?: string // Use specific agent
  metadata?: Record<string, unknown>
  retell_llm_dynamic_variables?: {
    customer_name?: string
    request_id?: string
    service_type?: string
    language?: string
    [key: string]: unknown
  }
}

// Create Phone Call Response
export interface CreatePhoneCallResponse {
  call_id: string
  call_type: 'phone_call'
  agent_id: string
  call_status: 'registered' | 'ongoing' | 'ended' | 'error'
  from_number: string
  to_number: string
  direction: 'inbound' | 'outbound'
  start_timestamp?: number
  end_timestamp?: number
  transcript?: string
  recording_url?: string
  public_log_url?: string
  metadata?: Record<string, unknown>
}

// ── WebSocket Protocol Types ─────────────────────────────────────────────────

export interface Utterance {
  role: 'agent' | 'user'
  content: string
  words?: Array<{
    word: string
    start: number
    end: number
  }>
}

// Retell -> Our Server
export interface RetellWebSocketRequest {
  interaction_type: 'update_only' | 'response_required' | 'reminder_required' | 'ping_pong' | 'call_details'
  response_id?: number
  transcript?: Utterance[]
  turntaking?: 'agent_turn' | 'user_turn'
  timestamp?: number
  call?: CreatePhoneCallResponse
}

// Our Server -> Retell
export interface RetellWebSocketResponse {
  response_type?: 'response' | 'config' | 'ping_pong' | 'agent_interrupt' | 'tool_call_invocation' | 'tool_call_result'
  response_id?: number
  content?: string
  content_complete?: boolean
  end_call?: boolean
  transfer_number?: string
}

// Config Event
export interface RetellConfigEvent {
  response_type: 'config'
  config: {
    auto_reconnect?: boolean
    call_details?: boolean
    transcript_with_tool_calls?: boolean
  }
}

// ── Call Session State ───────────────────────────────────────────────────────
export interface CallSession {
  call_id: string
  request_id: string
  agent_id: string
  client_phone: string
  client_name?: string
  language: string
  country: string
  status: 'connecting' | 'active' | 'ended' | 'error'
  transcript: Utterance[]
  started_at: string
  ended_at?: string
  // OSCaller context
  service_request?: Record<string, unknown>
  media_analysis?: Record<string, unknown>
  providers_found?: number
  dispatch_status?: string
}

// ── Admin Panel Types ────────────────────────────────────────────────────────
export interface AgentCreateRequest {
  name: string
  country_code: string
  language: string
  phone_number: string
  voice_id: string
  voice_model?: string
  prompt?: string
}

export interface AgentUpdateRequest {
  name?: string
  language?: string
  voice_id?: string
  voice_model?: string
  is_active?: boolean
  prompt?: string
}

// ── Supported Languages by Retell ────────────────────────────────────────────
export const RETELL_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'fr-CA', name: 'French (Canada)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-419', name: 'Spanish (Latin America)' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'pl-PL', name: 'Polish' },
  { code: 'vi-VN', name: 'Vietnamese' },
] as const

// ── Voice Options ────────────────────────────────────────────────────────────
export const RETELL_VOICES = [
  { id: 'retell-Cimo', name: 'Cimo (Male, Professional)' },
  { id: 'retell-Marissa', name: 'Marissa (Female, Warm)' },
  { id: 'retell-Tom', name: 'Tom (Male, Friendly)' },
  { id: 'retell-Emily', name: 'Emily (Female, Professional)' },
  { id: 'eleven_turbo_v2', name: 'ElevenLabs Turbo v2' },
  { id: 'eleven_flash_v2', name: 'ElevenLabs Flash v2' },
] as const

// ── Supported Countries ──────────────────────────────────────────────────────
export const RETELL_COUNTRIES = [
  // North America
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  // Europe
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'BE', name: 'Belgium', dial: '+32' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'AT', name: 'Austria', dial: '+43' },
  { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'IE', name: 'Ireland', dial: '+353' },
  { code: 'PL', name: 'Poland', dial: '+48' },
  { code: 'SE', name: 'Sweden', dial: '+46' },
  { code: 'NO', name: 'Norway', dial: '+47' },
  { code: 'DK', name: 'Denmark', dial: '+45' },
  { code: 'FI', name: 'Finland', dial: '+358' },
  // Asia Pacific
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'HK', name: 'Hong Kong', dial: '+852' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'PH', name: 'Philippines', dial: '+63' },
  // Middle East
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'IL', name: 'Israel', dial: '+972' },
  // South America
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'CL', name: 'Chile', dial: '+56' },
  { code: 'CO', name: 'Colombia', dial: '+57' },
  // Africa
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'EG', name: 'Egypt', dial: '+20' },
] as const
