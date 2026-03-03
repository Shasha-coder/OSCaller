'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'

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

  useEffect(() => {
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

        // Generate some mock nearby service markers
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
  }, [])

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            'h-2.5 w-2.5 rounded-full',
            loading ? 'bg-amber-400 animate-pulse' : 'bg-[#8FB34A]'
          )} />
          <span className="text-sm font-semibold text-[#0F172A]">
            {loading ? 'Getting your location…' : 'Live location'}
          </span>
        </div>
        {coords && !loading && (
          <span className="rounded-xl bg-[#EAF4D8] px-3 py-1.5 text-[11px] font-semibold text-[#5a8a1a]">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Error notice */}
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Map */}
      <GoogleMap
        center={coords || undefined}
        zoom={14}
        markers={markers}
        className="shadow-[0_8px_40px_rgba(15,23,42,0.08)]"
        style={{ height: '55vh', minHeight: 320 }}
      />

      {/* Nearby services grid */}
      <div className="grid grid-cols-2 gap-3">
        {NEARBY_SERVICES.map(({ label, count }) => (
          <button
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ring-1 ring-[#E5E7EB]/60 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 active:scale-[0.98]"
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
