'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function MapPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        // Fallback to a default location (New York)
        setCoords({ lat: 40.7128, lng: -74.006 })
        setLoading(false)
        setError('Location access denied — showing default location.')
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  const mapSrc = coords
    ? `https://www.google.com/maps/embed/v1/view?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&center=${coords.lat},${coords.lng}&zoom=15&maptype=roadmap`
    : null

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            'h-2 w-2 rounded-full',
            loading ? 'bg-amber-400 animate-pulse' : 'bg-primary'
          )} />
          <span className="text-sm font-medium text-foreground">
            {loading ? 'Getting your location…' : 'Live location'}
          </span>
        </div>
        {coords && !loading && (
          <span className="rounded-xl bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
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
      <div className="relative overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.1)]" style={{ height: '55vh', minHeight: 320 }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading map…</span>
          </div>
        )}
        {mapSrc && (
          <iframe
            title="Live map"
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={cn('transition-opacity duration-500', loading ? 'opacity-0' : 'opacity-100')}
          />
        )}
      </div>

      {/* Nearby services strip */}
      <div className="grid grid-cols-2 gap-3">
        {['Plumber nearby', 'Electrician nearby', 'HVAC nearby', 'Locksmith nearby'].map((label) => (
          <button
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)] active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </span>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
