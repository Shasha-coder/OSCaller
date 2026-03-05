'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import { Search, LocateFixed } from 'lucide-react'

export function MapPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLiveLocation, setIsLiveLocation] = useState(true)

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

  useEffect(() => {
    if (isLiveLocation) {
      requestLocation()
    } else {
      setLoading(false)
      setError(null)
    }
  }, [isLiveLocation])

  return (
    <div className="flex flex-col h-full w-full p-4 gap-2 pb-[80px]">



      {/* ─── Tiny Horizontal Filter Pills Row ─── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1 -mx-4 px-4 scroll-smooth">

        {/* Call AI Button (Primary Action) */}
        <button className="flex items-center gap-1.5 h-[38px] px-5 rounded-full bg-[#8FB34A] text-white text-[13px] font-bold shadow-[0_2px_8px_rgba(143,179,74,0.3)] shrink-0 transition-transform hover:bg-[#7da33f] active:scale-95 group">
          <svg className="h-4 w-4 text-white group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Call AI
        </button>

        {/* Language Dropdown */}
        <div className="relative flex items-center h-[38px] px-3 rounded-full bg-white border border-slate-200 shadow-sm shrink-0 group hover:border-slate-300 transition-colors">
          <svg className="h-4 w-4 text-slate-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <select className="h-full appearance-none bg-transparent outline-none text-[13px] font-semibold text-slate-700 cursor-pointer pr-5">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
          <svg className="absolute right-2.5 pointer-events-none h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Problem Input */}
        <div className="flex items-center h-[38px] pl-3 pr-2 rounded-full bg-white border border-slate-200 shadow-sm shrink-0 w-[180px] focus-within:border-[#8FB34A] focus-within:ring-1 focus-within:ring-[#8FB34A] transition-all">
          <svg className="h-4 w-4 text-slate-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Describe problem..."
            className="w-full h-full bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>

        {/* Phone Input */}
        <div className="flex items-center h-[38px] pl-3 pr-2 rounded-full bg-white border border-slate-200 shadow-sm shrink-0 w-[140px] focus-within:border-[#8FB34A] focus-within:ring-1 focus-within:ring-[#8FB34A] transition-all">
          <svg className="h-4 w-4 text-slate-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <input
            type="tel"
            placeholder="(555) 000-0000"
            className="w-full h-full bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>

        {/* GPS Toggle */}
        <label className="flex items-center gap-2 h-[38px] px-3 rounded-full bg-white border border-slate-200 shadow-sm shrink-0 cursor-pointer">
          <LocateFixed className={cn("h-4 w-4", isLiveLocation ? "text-[#8FB34A]" : "text-slate-400")} strokeWidth={2.5} />
          <span className="text-[13px] font-bold text-slate-600">GPS Mapping</span>
          <div className={cn("relative inline-flex h-4 w-7 items-center rounded-full transition-colors ml-1", isLiveLocation ? "bg-[#8FB34A]" : "bg-slate-200")}>
            <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform", isLiveLocation ? "translate-x-3.5" : "translate-x-0.5")} />
          </div>
          <input type="checkbox" className="hidden" checked={isLiveLocation} onChange={e => setIsLiveLocation(e.target.checked)} />
        </label>
      </div>

      {/* ─── Map Container (Large Square Shape Rounded Corner) ─── */}
      <div className="flex-1 w-full relative rounded-[32px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[6px] border-white isolate min-h-[400px]">

        <GoogleMap
          center={coords || undefined}
          zoom={14}
          markers={markers}
          className="h-full w-full object-cover"
        />

        {/* Floating status tag on map (bottom left, mimicking 'Search as I move the map' from screenshot) */}
        {!loading && !error && (
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-slate-200/50">
            <div className="flex items-center justify-center p-0.5 rounded-sm bg-[#8FB34A] text-white">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-[12px] font-bold text-slate-700 tracking-wide uppercase">Track Pro On Map</span>
          </div>
        )}

        {/* Error Notice */}
        {error && isLiveLocation && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 rounded-full border border-amber-200 bg-amber-50/95 backdrop-blur-md px-4 py-2 text-[12px] font-bold text-amber-800 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-11/12 max-w-sm justify-center">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Floating Recenter Button (Top Left corner, like maps often have) */}
        <button
          onClick={requestLocation}
          className="absolute top-5 left-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-slate-200/50 transition-transform hover:scale-105 active:scale-95 text-slate-700"
          aria-label="Use my current GPS location"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-[#8FB34A]" />
          ) : (
            <LocateFixed className="h-4 w-4 text-slate-700" strokeWidth={2.5} />
          )}
        </button>
      </div>

    </div>
  )
}
