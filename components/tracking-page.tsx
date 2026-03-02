'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Check, Circle, MapPin, Star, Shield, Share2,
  Phone, MessageSquare, X, ChevronDown, Navigation
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ServiceRequest, TimelineEvent, RequestStatus } from '@/lib/store'
import { Button } from '@/components/ui/button'

/* ---------- mock timeline simulation ---------- */
const TIMELINE_FLOW: { label: string; delay: number; status: RequestStatus }[] = [
  { label: 'Request received', delay: 0, status: 'submitted' },
  { label: 'Searching within 5 km...', delay: 2000, status: 'searching' },
  { label: 'Expanding to 7 km...', delay: 5000, status: 'expanding' },
  { label: 'Found: Peter (4.8, 218 jobs)', delay: 8000, status: 'found' },
  { label: 'Pre-authorized', delay: 10000, status: 'pre-authorized' },
  { label: 'En route - ETA 12 min', delay: 12000, status: 'en-route' },
]

const MOCK_PROVIDER = {
  id: 'p1',
  name: 'Peter M.',
  rating: 4.8,
  jobs: 218,
  verified: true,
  eta: 12,
  avatar: '',
  trade: 'plumbing' as const,
}

function StatusPill({ label, pulse }: { label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
      {pulse && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
      )}
      <span className="text-sm font-semibold text-secondary-foreground">{label}</span>
    </div>
  )
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500',
          event.status === 'complete' ? 'bg-primary' : event.status === 'active' ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'
        )}>
          {event.status === 'complete' ? (
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          ) : event.status === 'active' ? (
            <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
          ) : (
            <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
          )}
        </div>
        {!isLast && (
          <div className={cn(
            'mt-1 h-6 w-0.5 transition-colors duration-500',
            event.status === 'complete' ? 'bg-primary' : 'bg-border'
          )} />
        )}
      </div>
      <div className="flex flex-col pb-3">
        <span className={cn(
          'text-sm font-medium transition-colors duration-300',
          event.status === 'active' ? 'text-foreground' : event.status === 'complete' ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {event.label}
        </span>
        {event.status !== 'pending' && (
          <span className="text-[11px] text-muted-foreground">
            {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}

function ProviderCard() {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-xl font-bold text-primary">
          PM
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">{MOCK_PROVIDER.name}</span>
            {MOCK_PROVIDER.verified && (
              <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Shield className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{MOCK_PROVIDER.rating}</span>
            <span className="text-border">|</span>
            <span>{MOCK_PROVIDER.jobs} jobs</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg font-bold text-primary">{MOCK_PROVIDER.eta} min</span>
          <span className="text-[11px] text-muted-foreground">ETA</span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center rounded-2xl bg-primary/10 py-2 text-sm font-semibold text-primary">
        <Check className="mr-1.5 h-4 w-4" /> PRE-AUTHORIZED
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5">
          <Phone className="h-4 w-4" /> Call
        </Button>
        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5">
          <MessageSquare className="h-4 w-4" /> Message
        </Button>
        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  )
}

function MapPlaceholder() {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-muted sm:h-64">
      <div className="absolute inset-0 animate-shimmer" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg">
          <Navigation className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">Live map tracking</span>
      </div>
      {/* Decorative grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* User pin */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="mt-1 h-2 w-2 rounded-full bg-primary/30" />
        </div>
      </div>
    </div>
  )
}

interface TrackingPageProps {
  request: ServiceRequest | null
  onCancel: () => void
}

export function TrackingPage({ request, onCancel }: TrackingPageProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [currentStatus, setCurrentStatus] = useState<RequestStatus>('submitted')
  const [showProvider, setShowProvider] = useState(false)
  const timerRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    // Clear any previous timers
    timerRef.current.forEach(t => clearTimeout(t))
    timerRef.current = []

    // Start simulation
    TIMELINE_FLOW.forEach(({ label, delay, status }, idx) => {
      const timer = setTimeout(() => {
        const event: TimelineEvent = {
          id: `evt-${idx}`,
          label,
          timestamp: new Date(),
          status: 'active',
        }
        setTimeline(prev => {
          const updated = prev.map(e => ({ ...e, status: 'complete' as const }))
          return [...updated, event]
        })
        setCurrentStatus(status)
        if (status === 'found' || status === 'pre-authorized' || status === 'en-route') {
          setShowProvider(true)
        }
      }, delay)
      timerRef.current.push(timer)
    })

    return () => {
      timerRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const statusLabel =
    currentStatus === 'submitted' ? 'Request received' :
    currentStatus === 'searching' ? 'Searching within 5 km...' :
    currentStatus === 'expanding' ? 'Expanding search...' :
    currentStatus === 'found' ? 'Pro found!' :
    currentStatus === 'pre-authorized' ? 'Pre-authorized' :
    currentStatus === 'en-route' ? 'Pro en route' :
    'Processing...'

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <MapPin className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">No active request</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Submit a help request from the home page to start tracking.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      {/* Status pill */}
      <div className="flex items-center justify-center">
        <StatusPill label={statusLabel} pulse={currentStatus !== 'en-route' && currentStatus !== 'completed'} />
      </div>

      {/* Map */}
      <MapPlaceholder />

      {/* Timeline */}
      <div className="rounded-3xl bg-card p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
        <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Live updates</h3>
        <div className="flex flex-col">
          {timeline.map((event, idx) => (
            <TimelineItem key={event.id} event={event} isLast={idx === timeline.length - 1} />
          ))}
        </div>
      </div>

      {/* Provider card */}
      {showProvider && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ProviderCard />
        </div>
      )}

      {/* Cancel */}
      <div className="flex justify-center pb-8">
        <button
          onClick={onCancel}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          Cancel request
        </button>
      </div>
    </div>
  )
}
