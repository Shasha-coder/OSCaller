/* ─── OSCaller Database Types ─── */

export type ServiceType = 'plumbing' | 'electrical' | 'hvac' | 'locksmith' | 'appliance' | 'roofing' | 'glass' | 'pest'
export type EmergencyLevel = 'emergency' | 'urgent' | 'standard'
export type RequestStatus = 'submitted' | 'searching' | 'expanding' | 'found' | 'pre-authorized' | 'en-route' | 'arrived' | 'completed' | 'cancelled'
export type PaymentStatus = 'none' | 'authorized' | 'captured' | 'refunded' | 'pending'
export type ProviderTier = 'probation' | 'standard' | 'verified_emergency'
export type DispatchOfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'near_miss'
export type DisputeStatus = 'open' | 'under_review' | 'resolved_refund' | 'resolved_no_refund' | 'resolved_redispatch'
export type SupportedLanguage = 'en' | 'fr' | 'es' | 'ar' | 'pt' | 'zh'
export type SupportedCountry = 'US' | 'CA' | 'MX'

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string | null
                    phone: string | null
                    full_name: string | null
                    avatar_url: string | null
                    locale: SupportedLanguage
                    country: SupportedCountry
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['users']['Insert']>
            }

            requests: {
                Row: {
                    id: string
                    user_id: string | null
                    address: string
                    lat: number | null
                    lng: number | null
                    is_apartment: boolean
                    building_name: string | null
                    unit_number: string | null
                    entry_instructions: string | null
                    service: ServiceType
                    emergency_level: EmergencyLevel
                    description: string | null
                    media_urls: string[] | null
                    image_analysis: string | null
                    client_locale: SupportedLanguage
                    country: SupportedCountry
                    status: RequestStatus
                    provider_id: string | null
                    payment_status: PaymentStatus
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['requests']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['requests']['Insert']>
            }

            request_events: {
                Row: {
                    id: string
                    request_id: string
                    label: string
                    status: 'complete' | 'active' | 'pending'
                    metadata: Record<string, unknown> | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['request_events']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['request_events']['Insert']>
            }

            providers: {
                Row: {
                    id: string
                    full_name: string
                    email: string | null
                    phone: string | null
                    avatar_url: string | null
                    trade: ServiceType
                    tier: ProviderTier
                    is_active: boolean
                    locale: SupportedLanguage
                    languages: SupportedLanguage[]
                    country: SupportedCountry
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['providers']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['providers']['Insert']>
            }

            provider_locations: {
                Row: {
                    id: string
                    provider_id: string
                    lat: number
                    lng: number
                    heading: number | null
                    speed: number | null
                    recorded_at: string
                }
                Insert: Omit<Database['public']['Tables']['provider_locations']['Row'], 'id' | 'recorded_at'>
                Update: Partial<Database['public']['Tables']['provider_locations']['Insert']>
            }

            provider_availability: {
                Row: {
                    id: string
                    provider_id: string
                    is_online: boolean
                    schedule: Record<string, unknown> | null
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['provider_availability']['Row'], 'id' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['provider_availability']['Insert']>
            }

            provider_stats: {
                Row: {
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
                Insert: Omit<Database['public']['Tables']['provider_stats']['Row'], 'id' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['provider_stats']['Insert']>
            }

            reviews: {
                Row: {
                    id: string
                    request_id: string
                    provider_id: string
                    user_id: string | null
                    rating: number
                    comment: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['reviews']['Insert']>
            }

            payments: {
                Row: {
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
                }
                Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['payments']['Insert']>
            }

            disputes: {
                Row: {
                    id: string
                    request_id: string
                    user_id: string | null
                    provider_id: string | null
                    reason: string
                    status: DisputeStatus
                    resolution_notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['disputes']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['disputes']['Insert']>
            }

            dispatch_offers: {
                Row: {
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
                }
                Insert: Omit<Database['public']['Tables']['dispatch_offers']['Row'], 'id' | 'offered_at'>
                Update: Partial<Database['public']['Tables']['dispatch_offers']['Insert']>
            }
        }
    }
}

/* ─── Convenience type aliases ─── */
export type UserRow = Database['public']['Tables']['users']['Row']
export type RequestRow = Database['public']['Tables']['requests']['Row']
export type RequestEventRow = Database['public']['Tables']['request_events']['Row']
export type ProviderRow = Database['public']['Tables']['providers']['Row']
export type ProviderLocationRow = Database['public']['Tables']['provider_locations']['Row']
export type ProviderAvailabilityRow = Database['public']['Tables']['provider_availability']['Row']
export type ProviderStatsRow = Database['public']['Tables']['provider_stats']['Row']
export type ReviewRow = Database['public']['Tables']['reviews']['Row']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type DisputeRow = Database['public']['Tables']['disputes']['Row']
export type DispatchOfferRow = Database['public']['Tables']['dispatch_offers']['Row']
