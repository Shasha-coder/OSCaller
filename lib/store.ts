// App-wide state types for OSCaller

export type ServiceType = 'plumbing' | 'electrical' | 'hvac' | 'locksmith' | 'appliance' | 'roofing' | 'glass' | 'pest'

export type EmergencyLevel = 'emergency' | 'urgent' | 'standard'

// Full state machine per dispatch pipeline spec
export type RequestStatus =
  | 'draft'           // Initial creation, incomplete info
  | 'qualified'       // All info collected, ready for dispatch
  | 'searching'       // Actively looking for provider (offers being sent)
  | 'assigned'        // Provider accepted, not yet moving
  | 'enroute'         // Provider is traveling to client
  | 'arrived'         // Provider at location, waiting for code verification
  | 'in_progress'     // Work has started (code verified)
  | 'completed'       // Work finished, payment captured
  | 'cancelled'       // Cancelled by client/provider/system
  | 'disputed'        // Under review due to issue

export type AppPage = 'home' | 'tracking' | 'history' | 'support' | 'map'

export interface RequestFormData {
  address: string
  lat?: number
  lng?: number
  isApartment: boolean
  buildingName: string
  unitNumber: string
  entryInstructions: string
  service: ServiceType | null
  emergencyLevel: EmergencyLevel | null
  description: string
  phone: string
  language: string
  consent: boolean
}

export interface Provider {
  id: string
  name: string
  rating: number
  jobs: number
  verified: boolean
  eta: number
  avatar: string
  trade: ServiceType
}

export interface TimelineEvent {
  id: string
  label: string
  timestamp: Date
  status: 'complete' | 'active' | 'pending'
}

export interface ServiceRequest {
  id: string
  form: RequestFormData
  status: RequestStatus
  provider?: Provider
  timeline: TimelineEvent[]
  createdAt: Date
  
  // Service verification code (e.g., OS3460)
  serviceCode?: string
  
  // Pricing
  estimatedPriceCents?: number
  finalPriceCents?: number
  
  // GPS tracking
  clientLat?: number
  clientLng?: number
  providerLat?: number
  providerLng?: number
  etaMinutes?: number
  
  // Timestamps
  assignedAt?: Date
  enrouteAt?: Date
  arrivalConfirmedAt?: Date
  workStartedAt?: Date
  workCompletedAt?: Date
  cancelledAt?: Date
  
  // Cancellation
  cancellationReason?: string
  cancelledBy?: 'client' | 'provider' | 'system'
  
  // Dispatch
  dispatchAttempts?: number
  currentOfferId?: string
  
  // Payment
  paymentStatus: 'none' | 'hold_created' | 'hold_captured' | 'refunded'
}

export const SERVICE_OPTIONS: { type: ServiceType; label: string; icon: string }[] = [
  { type: 'plumbing', label: 'Plumbing', icon: 'Droplets' },
  { type: 'electrical', label: 'Electrical', icon: 'Zap' },
  { type: 'hvac', label: 'HVAC', icon: 'Thermometer' },
  { type: 'locksmith', label: 'Locksmith', icon: 'KeyRound' },
  { type: 'appliance', label: 'Appliance', icon: 'Refrigerator' },
  { type: 'roofing', label: 'Roofing', icon: 'Home' },
  { type: 'glass', label: 'Glass', icon: 'Square' },
  { type: 'pest', label: 'Pest Control', icon: 'Bug' },
]

export const EMERGENCY_OPTIONS: { level: EmergencyLevel; label: string; sublabel: string }[] = [
  { level: 'emergency', label: 'Emergency', sublabel: 'Right now' },
  { level: 'urgent', label: 'Urgent', sublabel: 'Today' },
  { level: 'standard', label: 'Standard', sublabel: 'This week' },
]

export function createEmptyForm(): RequestFormData {
  return {
    address: '',
    isApartment: false,
    buildingName: '',
    unitNumber: '',
    entryInstructions: '',
    service: null,
    emergencyLevel: null,
    description: '',
    phone: '',
    language: 'English',
    consent: false,
  }
}
