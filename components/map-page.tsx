'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import { Search, LocateFixed } from 'lucide-react'

const NEARBY_SERVICES = [
  { label: 'Plumber nearby', count: '3 available' },
  { label: 'Electrician nearby', count: '5 available' },
  { label: 'HVAC nearby', count: '2 available' },
  { label: 'Locksmith nearby', count: '4 available' },
]

export function MapPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLiveLocation, setIsLiveLocation] = useState(true) // Track toggle state

  const requestLocation = () => {
    setLoading(true)
    setError(null)
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setCoords({ lat: 40.7128, lng: -74.006 })
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(userCoords)
        setLoading(false)

        setMarkers([
          { id: 'user', lat: userCoords.lat, lng: userCoords.lng, type: 'user', pulse: true },
          { id: 'svc1', lat: userCoords.lat + 0.008, lng: userCoords.lng + 0.005, type: 'service', label: 'Plumber' },
          { id: 'svc2', lat: userCoords.lat - 0.004, lng: userCoords.lng + 0.009, type: 'service', label: 'Electrician' },
          { id: 'svc3', lat: userCoords.lat + 0.003, lng: userCoords.lng - 0.007, type: 'service', label: 'HVAC' },
          { id: 'svc4', lat: userCoords.lat - 0.006, lng: userCoords.lng - 0.004, type: 'service', label: 'Locksmith' },
        ])
      },
      () => {
        const fallback = { lat: 40.7128, lng: -74.006 }
        setCoords(fallback)
        setLoading(false)
        setError('Location access denied — showing default location.')

        setMarkers([
          { id: 'user', lat: fallback.lat, lng: fallback.lng, type: 'user', pulse: true },
          { id: 'svc1', lat: fallback.lat + 0.008, lng: fallback.lng + 0.005, type: 'service', label: 'Plumber' },
          { id: 'svc2', lat: fallback.lat - 0.004, lng: fallback.lng + 0.009, type: 'service', label: 'Electrician' },
        ])
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Effect to handle toggling live location
  useEffect(() => {
    if (isLiveLocation) {
      requestLocation()
    } else {
      // If toggled off, reset to a default or keep last known but stop tracking
      setLoading(false)
      setError(null)
      // We keep the current coords, but we could also clear them.
    }
  }, [isLiveLocation])

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 relative flex flex-col h-full pt-2">
      {/* Search Bar - No negative overlap margins */}
      <div className="relative z-10">
        <label htmlFor="service-search" className="sr-only">Which home service?</label>
        <div className="relative flex items-center w-full">
          <div className="absolute left-4 flex items-center justify-center h-full pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="service-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Describe your emergency... (e.g. basement flooding)"
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-200 text-[#0F172A] font-medium text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8FB34A]/50 transition-all"
          />
        </div>
      </div>

      {/* GPS Location Toggle Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          {/* Toggle Switch */}
          <button
            onClick={() => setIsLiveLocation(!isLiveLocation)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB34A] focus-visible:ring-offset-2",
              isLiveLocation ? "bg-[#8FB34A]" : "bg-slate-200"
            )}
            role="switch"
            aria-checked={isLiveLocation}
          >
            <span className="sr-only">Enable live location tracking</span>
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isLiveLocation ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#0F172A] leading-tight flex items-center gap-2">
              Share Live Location
              {loading && <div className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-[#8FB34A]" />}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {isLiveLocation ? 'AI agent has real-time access' : 'Location sharing paused'}
            </span>
          </div>
        </div>

        {coords && isLiveLocation && !loading && !error && (
          <div className="flex items-center gap-1.5 rounded-lg bg-[#EAF4D8]/50 px-2.5 py-1 text-[10px] font-semibold text-[#5a8a1a] border border-[#8FB34A]/20">
            <LocateFixed className="h-3 w-3" />
            Active
          </div>
        )}
      </div>

      {/* Error notice */}
      {error && isLiveLocation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 flex items-center gap-2 shadow-sm">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {/* Map Container */}
      <div className="relative flex-1 min-h-[50vh] w-full rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(15,23,42,0.08)] border border-slate-200/50 mt-2">
        <GoogleMap
          center={coords || undefined}
          zoom={14}
          markers={markers}
          className="h-full w-full"
        />

        {/* Floating GPS Button */}
        <button
          onClick={requestLocation}
          className="absolute bottom-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 transition-transform hover:scale-105 active:scale-95 text-[#0F172A]"
          aria-label="Use my current GPS location"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#8FB34A]" />
          ) : (
            <LocateFixed className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Nearby services grid */}
      <div className="grid grid-cols-2 gap-3">
        {NEARBY_SERVICES.map(({ label, count }) => (
          <button
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-sm px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ring-1 ring-[#E5E7EB]/40 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF4D8]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </span>
            <div className="text-left">
              <span className="text-sm font-semibold text-[#0F172A]">{label}</span>
              <p className="text-[11px] text-[#64748B]">{count}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
