'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Check, Circle, MapPin, Star, Shield, Share2,
  Phone, MessageSquare, Navigation, Clock, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceRequest, TimelineEvent as LocalTimelineEvent, RequestStatus } from '@/lib/store'
import type { MapMarker, MapRoute } from '@/components/google-map'
import { Button } from '@/components/ui/button'
import { GoogleMap } from '@/components/google-map'
import { useRealtimeRequest } from '@/hooks/use-realtime-request'

/* ─── Simulated timeline (used as fallback when no live data) ─── */
const TIMELINE_FLOW: { label: string; delay: number; status: RequestStatus }[] = [
  { label: 'Request received', delay: 0, status: 'submitted' },
  { label: 'Searching within 5 km...', delay: 2000, status: 'searching' },
  { label: 'Expanding to 7 km...', delay: 5000, status: 'expanding' },
  { label: 'Found: Peter (4.8, 218 jobs)', delay: 8000, status: 'found' },
  { label: 'Pre-authorized', delay: 10000, status: 'pre-authorized' },
  { label: 'En route -- ETA 12 min', delay: 12000, status: 'en-route' },
]

/* Locations */
const USER_LOCATION = { lat: 40.7128, lng: -74.006 }
const PRO_START = { lat: 40.7260, lng: -73.9897 }

/* ─── Waypoints for realistic route (Manhattan streets) ─── */
const ROUTE_WAYPOINTS = [
  { lat: 40.7260, lng: -73.9897 },
  { lat: 40.7245, lng: -73.9910 },
  { lat: 40.7230, lng: -73.9925 },
  { lat: 40.7218, lng: -73.9940 },
  { lat: 40.7205, lng: -73.9955 },
  { lat: 40.7195, lng: -73.9970 },
  { lat: 40.7185, lng: -73.9985 },
  { lat: 40.7175, lng: -74.0000 },
  { lat: 40.7165, lng: -74.0015 },
  { lat: 40.7155, lng: -74.0028 },
  { lat: 40.7145, lng: -74.0040 },
  { lat: 40.7138, lng: -74.0050 },
  { lat: 40.7128, lng: -74.006 },
]

/* ─── Bearing calculation ─── */
function getBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const lat1 = from.lat * Math.PI / 180
  const lat2 = to.lat * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

/* ─── ETA Progress Ring ─── */
function ETAProgressRing({ progress, eta, className }: { progress: number; eta: number; className?: string }) {
  const circumference = 2 * Math.PI * 42
  const dashoffset = circumference * (1 - progress)

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r="42" stroke="#E2E8F0" strokeWidth="4" fill="none" />
        <circle
          cx="50" cy="50" r="42"
          stroke="#8FB34A"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 6px rgba(143,179,74,0.4))' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-[#0F172A] tabular-nums">{eta}</span>
        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">min</span>
      </div>
    </div>
  )
}

/* ─── Animated route progress bar ─── */
function RouteProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#8FB34A] to-[#a8c94e] transition-all duration-1000 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
      <div
        className="absolute top-0 h-full w-8 rounded-full"
        style={{
          left: `${progress * 100 - 4}%`,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}
      />
    </div>
  )
}

/* ─── Status Pill ─── */
function StatusPill({ label, pulse }: { label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-[#EAF4D8] px-5 py-2.5 shadow-[0_2px_12px_rgba(143,179,74,0.12)]">
      {pulse && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8FB34A] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8FB34A]" />
        </span>
      )}
      <span className="text-sm font-bold text-[#3a5e10]">{label}</span>
    </div>
  )
}

/* ─── Timeline Item ─── */
function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500',
          event.status === 'complete' ? 'bg-[#8FB34A] shadow-[0_2px_8px_rgba(143,179,74,0.3)]' : event.status === 'active' ? 'bg-[#EAF4D8] ring-2 ring-[#8FB34A]' : 'bg-[#f1f5f9]'
        )}>
          {event.status === 'complete' ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : event.status === 'active' ? (
            <Circle className="h-2.5 w-2.5 fill-[#8FB34A] text-[#8FB34A]" />
          ) : (
            <Circle className="h-2.5 w-2.5 text-[#cbd5e1]" />
          )}
        </div>
        {!isLast && (
          <div className={cn(
            'mt-1 h-6 w-[2px] rounded-full transition-colors duration-500',
            event.status === 'complete' ? 'bg-[#8FB34A]' : 'bg-[#E5E7EB]'
          )} />
        )}
      </div>
      <div className="flex flex-col pb-3">
        <span className={cn(
          'text-sm font-semibold transition-colors duration-300',
          event.status === 'active' || event.status === 'complete' ? 'text-[#0F172A]' : 'text-[#94a3b8]'
        )}>
          {event.label}
        </span>
        {event.status !== 'pending' && (
          <span className="text-[11px] text-[#94a3b8] mt-0.5">
            {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Provider Card ─── */
function ProviderCard({ provider, eta, progress }: {
  provider: { name: string; rating: number; jobs: number; verified: boolean }
  eta: number
  progress: number
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-[#E5E7EB]/60">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF4D8] text-xl font-bold text-[#5a8a1a]">
          {provider.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#0F172A]">{provider.name}</span>
            {provider.verified && (
              <span className="flex items-center gap-0.5 rounded-full bg-[#EAF4D8] px-2 py-0.5 text-[10px] font-bold text-[#5a8a1a]">
                <Shield className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#64748B] mt-0.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{provider.rating}</span>
            <span className="text-[#E5E7EB]">{'|'}</span>
            <span>{provider.jobs} jobs</span>
          </div>
        </div>
        <ETAProgressRing progress={progress} eta={eta} />
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">En Route</span>
          <span className="text-[10px] font-semibold text-[#8FB34A]">{Math.round(progress * 100)}%</span>
        </div>
        <RouteProgressBar progress={progress} />
      </div>

      <div className="mb-4 flex items-center justify-center rounded-2xl bg-[#EAF4D8] py-2.5 text-sm font-bold text-[#5a8a1a]">
        <Check className="mr-1.5 h-4 w-4" /> PRE-AUTHORIZED
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 h-10 border-[#E5E7EB] hover:bg-[#f7f8fa]">
          <Phone className="h-4 w-4 text-[#8FB34A]" /> Call
        </Button>
        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 h-10 border-[#E5E7EB] hover:bg-[#f7f8fa]">
          <MessageSquare className="h-4 w-4 text-[#8FB34A]" /> Message
        </Button>
        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 h-10 border-[#E5E7EB] hover:bg-[#f7f8fa]">
          <Share2 className="h-4 w-4 text-[#8FB34A]" /> Share
        </Button>
      </div>
    </div>
  )
}

/* ═══ Main Tracking Page ═══ */
interface TrackingPageProps {
  request: ServiceRequest | null
  onCancel: () => void
}

export function TrackingPage({ request, onCancel }: TrackingPageProps) {
  // Use realtime subscription hook
  const { 
    request: realtimeRequest, 
    providerLocation, 
    timeline: realtimeTimeline,
    isLoading 
  } = useRealtimeRequest(request?.id || null)

  const [localTimeline, setLocalTimeline] = useState<LocalTimelineEvent[]>([])
  const [currentStatus, setCurrentStatus] = useState<RequestStatus>('draft')
  const [showProvider, setShowProvider] = useState(false)
  const timerRef = useRef<NodeJS.Timeout[]>([])

  // Animated pro position along waypoints
  const [proPos, setProPos] = useState(PRO_START)
  const [heading, setHeading] = useState(0)
  const [eta, setEta] = useState(12)
  const [routeProgress, setRouteProgress] = useState(0)
  const animRef = useRef<NodeJS.Timeout | null>(null)

  /* ── Sync realtime data to local state ── */
  useEffect(() => {
    if (!realtimeRequest) return

    // Map DB status to local status type
    const statusMap: Record<string, RequestStatus> = {
      'draft': 'draft',
      'qualified': 'qualified',
      'searching': 'searching',
      'assigned': 'assigned',
      'enroute': 'enroute',
      'arrived': 'arrived',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'disputed': 'disputed',
    }
    
    const mappedStatus = statusMap[realtimeRequest.status] || 'draft'
    setCurrentStatus(mappedStatus)

    // Show provider when assigned
    if (['assigned', 'enroute', 'arrived', 'in_progress'].includes(realtimeRequest.status)) {
      setShowProvider(true)
    }

    // Update ETA from realtime data
    if (realtimeRequest.eta_minutes !== null) {
      setEta(realtimeRequest.eta_minutes)
    }

    // Update provider position from service_requests
    if (realtimeRequest.provider_lat && realtimeRequest.provider_lng) {
      setProPos(prev => {
        const newPos = { lat: realtimeRequest.provider_lat!, lng: realtimeRequest.provider_lng! }
        setHeading(getBearing(prev, newPos))
        return newPos
      })
    }
  }, [realtimeRequest])

  /* ── Sync provider location from realtime subscription ── */
  useEffect(() => {
    if (!providerLocation) return
    
    setProPos(prev => {
      setHeading(providerLocation.heading || getBearing(prev, providerLocation))
      return { lat: providerLocation.lat, lng: providerLocation.lng }
    })
  }, [providerLocation])

  /* ── Convert realtime timeline to local format ── */
  useEffect(() => {
    if (realtimeTimeline.length === 0) return

    const converted: LocalTimelineEvent[] = realtimeTimeline.map((evt, idx) => ({
      id: evt.id,
      label: evt.label,
      timestamp: new Date(evt.created_at),
      status: idx === realtimeTimeline.length - 1 ? 'active' : 'complete',
    }))
    setLocalTimeline(converted)
  }, [realtimeTimeline])

  /* ── Fallback: Timeline simulation when no live data is flowing ── */
  useEffect(() => {
    // Only run simulation if we haven't received real data after 3s
    const fallbackTimer = setTimeout(() => {
      if (localTimeline.length > 0 || realtimeTimeline.length > 0) return // Real data already arrived

      timerRef.current.forEach(t => clearTimeout(t))
      timerRef.current = []

      TIMELINE_FLOW.forEach(({ label, delay, status }, idx) => {
        const timer = setTimeout(() => {
          const event: LocalTimelineEvent = {
            id: `evt-${idx}`, label, timestamp: new Date(), status: 'active',
          }
          setLocalTimeline(prev => {
            const updated = prev.map(e => ({ ...e, status: 'complete' as const }))
            return [...updated, event]
          })
          setCurrentStatus(status as RequestStatus)
          if (status === 'assigned' || status === 'enroute') {
            setShowProvider(true)
          }
        }, delay)
        timerRef.current.push(timer)
      })
    }, 3000)

    return () => {
      clearTimeout(fallbackTimer)
      timerRef.current.forEach(t => clearTimeout(t))
    }
  }, [localTimeline.length, realtimeTimeline.length])

  /* ── Uber-style trajectory animation along waypoints ── */
  useEffect(() => {
    if (currentStatus !== 'enroute') return
    // Skip animation if we have live provider location
    if (providerLocation?.lat) return

    const totalWaypoints = ROUTE_WAYPOINTS.length - 1
    const totalDuration = 12 * 60 * 1000
    const intervalMs = totalDuration / (totalWaypoints * 10)
    let wpIdx = 0
    let subStep = 0
    const subStepsPerWP = 10

    const animate = () => {
      if (wpIdx >= totalWaypoints) return

      const from = ROUTE_WAYPOINTS[wpIdx]
      const to = ROUTE_WAYPOINTS[wpIdx + 1]
      const t = subStep / subStepsPerWP
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

      const lat = from.lat + (to.lat - from.lat) * eased
      const lng = from.lng + (to.lng - from.lng) * eased

      setProPos({ lat, lng })
      setHeading(getBearing(from, to))

      const overallProgress = (wpIdx * subStepsPerWP + subStep) / (totalWaypoints * subStepsPerWP)
      setRouteProgress(overallProgress)
      const remainingMin = Math.ceil(12 * (1 - overallProgress))
      setEta(Math.max(0, remainingMin))

      subStep++
      if (subStep > subStepsPerWP) {
        subStep = 0
        wpIdx++
      }

      if (wpIdx < totalWaypoints) {
        animRef.current = setTimeout(animate, intervalMs)
      }
    }

    animate()
    return () => { if (animRef.current) clearTimeout(animRef.current) }
  }, [currentStatus, providerLocation?.lat])

  const statusLabel =
    currentStatus === 'draft' ? 'Request created' :
      currentStatus === 'qualified' ? 'Request qualified' :
        currentStatus === 'searching' ? 'Searching for pros...' :
          currentStatus === 'assigned' ? 'Pro assigned!' :
            currentStatus === 'enroute' ? `Pro en route - ${eta} min` :
              currentStatus === 'arrived' ? 'Pro arrived' :
                currentStatus === 'in_progress' ? 'Work in progress' :
                  currentStatus === 'completed' ? 'Job completed' :
                    currentStatus === 'cancelled' ? 'Request cancelled' :
                      'Processing...'

  const userLocation = request?.form?.lat && request?.form?.lng
    ? { lat: request.form.lat, lng: request.form.lng }
    : USER_LOCATION

  const mapMarkers: MapMarker[] = [
    { id: 'user', lat: userLocation.lat, lng: userLocation.lng, type: 'user', pulse: true },
  ]

  if (showProvider) {
    mapMarkers.push({
      id: 'pro', lat: proPos.lat, lng: proPos.lng,
      type: 'pro', label: liveProvider?.name || 'Peter M.', heading,
    })
  }

  const mapRoute: MapRoute | null = showProvider
    ? { from: proPos, to: userLocation }
    : null

  const mapCenter = showProvider
    ? { lat: (proPos.lat + userLocation.lat) / 2, lng: (proPos.lng + userLocation.lng) / 2 }
    : userLocation

  const providerInfo = realtimeRequest?.technician_name 
    ? { name: realtimeRequest.technician_name, rating: 4.8, jobs: 100, verified: true }
    : { name: 'Provider', rating: 4.8, jobs: 100, verified: true }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF4D8]">
          <MapPin className="h-7 w-7 text-[#8FB34A]" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-[#0F172A]">No active request</h2>
        <p className="max-w-xs text-sm text-[#64748B]">
          Submit a help request from the home page to start tracking.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <div className="flex items-center justify-center">
        <StatusPill label={statusLabel} pulse={!['enroute', 'completed', 'cancelled'].includes(currentStatus)} />
      </div>

      <div className="relative overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.08)]">
        <GoogleMap
          center={mapCenter}
          zoom={showProvider ? 14 : 15}
          markers={mapMarkers}
          route={mapRoute}
          style={{ height: 280 }}
        />
        {showProvider && currentStatus === 'en-route' && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-2.5 shadow-lg ring-1 ring-black/5">
            <Navigation className="h-4 w-4 text-[#8FB34A]" />
            <div>
              <p className="text-xs font-bold text-[#0F172A]">{eta} min away</p>
              <p className="text-[10px] text-[#64748B]">{(1.2 * (1 - routeProgress)).toFixed(1)} km remaining</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-[#E5E7EB]/50">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Live updates</h3>
        <div className="flex flex-col">
          {localTimeline.map((event, idx) => (
            <TimelineItem key={event.id} event={event} isLast={idx === localTimeline.length - 1} />
          ))}
        </div>
      </div>

      {showProvider && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ProviderCard provider={providerInfo} eta={eta} progress={routeProgress} />
        </div>
      )}

      <div className="flex justify-center pb-8">
        <button
          onClick={onCancel}
          className="text-sm font-medium text-[#94a3b8] transition-colors hover:text-red-500 active:scale-[0.97]"
        >
          Cancel request
        </button>
      </div>
    </div>
  )
}
