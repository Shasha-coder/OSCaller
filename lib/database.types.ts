// Database types mirroring Supabase schema
// Auto-generate with: npx supabase gen types typescript --project-id <id> > lib/database.types.ts

export type RequestStatusDB =
  | 'draft'
  | 'qualified'
  | 'searching'
  | 'assigned'
  | 'enroute'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type DispatchOfferStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export type PaymentStatus = 'none' | 'hold_created' | 'hold_captured' | 'refunded' | 'failed'

export type ProviderTier = 'probation' | 'standard' | 'preferred' | 'elite'

// ─────────────────────────────────────────────────────────────────────────────
// service_requests table
// ─────────────────────────────────────────────────────────────────────────────
export interface ServiceRequestRow {
  id: string
  customer_name: string
  customer_phone: string
  customer_id: string | null
  address: string
  lat: number | null
  lng: number | null
  service: string
  priority: string
  description: string | null
  status: RequestStatusDB
  technician_id: string | null
  technician_name: string | null
  eta_minutes: number | null
  amount: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
  
  // New fields from migration
  service_code: string | null
  estimated_price_cents: number | null
  final_price_cents: number | null
  client_lat: number | null
  client_lng: number | null
  client_location_updated_at: string | null
  provider_lat: number | null
  provider_lng: number | null
  provider_location_updated_at: string | null
  assigned_at: string | null
  enroute_at: string | null
  arrival_confirmed_at: string | null
  work_started_at: string | null
  work_completed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  cancelled_by: 'client' | 'provider' | 'system' | null
  dispatch_attempts: number
  current_offer_id: string | null
  call_record_id: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// dispatch_offers table
// ─────────────────────────────────────────────────────────────────────────────
export interface DispatchOfferRow {
  id: string
  request_id: string
  provider_id: string
  status: DispatchOfferStatus
  distance_km: number | null
  eta_minutes: number | null
  quality_score: number | null
  offered_at: string
  responded_at: string | null
  reservation_expires_at: string | null
  
  // New fields from migration
  offer_sequence: number
  decline_reason: string | null
  timeout_at: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// payments table
// ─────────────────────────────────────────────────────────────────────────────
export interface PaymentRow {
  id: string
  request_id: string
  stripe_payment_intent_id: string | null
  amount_cents: number
  currency: string
  status: PaymentStatus
  captured_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
  
  // New fields from migration
  hold_amount_cents: number | null
  final_amount_cents: number | null
  hold_created_at: string | null
  hold_expires_at: string | null
  tip_amount_cents: number
  platform_fee_cents: number
  provider_payout_cents: number
}

// ─────────────────────────────────────────────────────────────────────────────
// providers table
// ─────────────────────────────────────────────────────────────────────────────
export interface ProviderRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  trade: string
  tier: ProviderTier
  is_active: boolean
  created_at: string
  updated_at: string
  locale: string
  languages: string[]
  country: string
}

// ─────────────────────────────────────────────────────────────────────────────
// provider_locations table (GPS streaming)
// ─────────────────────────────────────────────────────────────────────────────
export interface ProviderLocationRow {
  id: string
  provider_id: string
  lat: number
  lng: number
  heading: number | null
  speed: number | null
  recorded_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// client_locations table (GPS streaming)
// ─────────────────────────────────────────────────────────────────────────────
export interface ClientLocationRow {
  id: string
  user_id: string
  request_id: string | null
  lat: number
  lng: number
  accuracy: number | null
  recorded_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// request_events table (audit trail)
// ─────────────────────────────────────────────────────────────────────────────
export interface RequestEventRow {
  id: string
  request_id: string
  label: string
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  
  // New fields from migration
  actor_type: 'client' | 'provider' | 'agent' | 'system' | null
  actor_id: string | null
  previous_status: string | null
  new_status: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// call_records table
// ─────────────────────────────────────────────────────────────────────────────
export interface CallRecordRow {
  id: string
  request_id: string | null
  direction: 'inbound' | 'outbound'
  participant_role: 'client' | 'provider' | 'agent'
  participant_id: string | null
  twilio_call_sid: string | null
  twilio_number_id: string | null
  agent_session_id: string | null
  language_used: string | null
  recording_url: string | null
  transcript: Record<string, unknown> | null
  duration_seconds: number | null
  call_status: string
  started_at: string
  ended_at: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// provider_stats table
// ─────────────────────────────────────────────────────────────────────────────
export interface ProviderStatsRow {
  id: string
  provider_id: string
  total_jobs: number
  completed_jobs: number
  on_time_rate: number
  average_rating: number
  complaint_count: number
  clean_streak: number
  near_miss_tokens: number
  updated_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Realtime payload types
// ─────────────────────────────────────────────────────────────────────────────
export interface RealtimePayload<T> {
  commit_timestamp: string
  errors: null | string[]
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: Partial<T>
  schema: 'public'
  table: string
}
