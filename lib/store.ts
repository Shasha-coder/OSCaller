// App-wide state types for OSCaller

export type ServiceType = 'plumbing' | 'electrical' | 'hvac' | 'locksmith' | 'appliance' | 'roofing' | 'glass' | 'pest'

export type EmergencyLevel = 'emergency' | 'urgent' | 'standard'

export type RequestStatus =
  | 'idle'
  | 'submitted'
  | 'searching'
  | 'expanding'
  | 'found'
  | 'pre-authorized'
  | 'en-route'
  | 'arrived'
  | 'completed'

export type AppPage = 'home' | 'tracking' | 'history' | 'support'

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
  paymentStatus: 'none' | 'authorized' | 'captured' | 'refunded'
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
  }
}
