'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import { LocateFixed, Phone, Lock, ChevronDown } from 'lucide-react'

/* ─── Countries (3 supported, rest locked) ─── */
const COUNTRIES = [
  { code: 'CA', name: 'Canada', dial: '+1', flag: '\u{1F1E8}\u{1F1E6}', supported: true },
  { code: 'US', name: 'United States', dial: '+1', flag: '\u{1F1FA}\u{1F1F8}', supported: true },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '\u{1F1F2}\u{1F1FD}', supported: true },
  { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '\u{1F1E6}\u{1F1EB}', supported: false },
  { code: 'AL', name: 'Albania', dial: '+355', flag: '\u{1F1E6}\u{1F1F1}', supported: false },
  { code: 'DZ', name: 'Algeria', dial: '+213', flag: '\u{1F1E9}\u{1F1FF}', supported: false },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '\u{1F1E6}\u{1F1F7}', supported: false },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '\u{1F1E6}\u{1F1FA}', supported: false },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '\u{1F1E7}\u{1F1F7}', supported: false },
  { code: 'CN', name: 'China', dial: '+86', flag: '\u{1F1E8}\u{1F1F3}', supported: false },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '\u{1F1E8}\u{1F1F4}', supported: false },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '\u{1F1EA}\u{1F1EC}', supported: false },
  { code: 'FR', name: 'France', dial: '+33', flag: '\u{1F1EB}\u{1F1F7}', supported: false },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '\u{1F1E9}\u{1F1EA}', supported: false },
  { code: 'IN', name: 'India', dial: '+91', flag: '\u{1F1EE}\u{1F1F3}', supported: false },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '\u{1F1EE}\u{1F1F9}', supported: false },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '\u{1F1EF}\u{1F1F5}', supported: false },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '\u{1F1F0}\u{1F1F7}', supported: false },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '\u{1F1F3}\u{1F1EC}', supported: false },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '\u{1F1F5}\u{1F1F0}', supported: false },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '\u{1F1EC}\u{1F1E7}', supported: false },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '\u{1F1FF}\u{1F1E6}', supported: false },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '\u{1F1EA}\u{1F1F8}', supported: false },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '\u{1F1F9}\u{1F1F7}', supported: false },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '\u{1F1E6}\u{1F1EA}', supported: false },
]

/* ─── All Languages ─── */
const LANGUAGES = [
  'English', 'French', 'Spanish', 'Arabic', 'Portuguese', 'Hindi',
  'Mandarin', 'German', 'Japanese', 'Korean', 'Italian', 'Dutch',
  'Polish', 'Turkish', 'Swedish', 'Indonesian', 'Filipino', 'Romanian',
  'Ukrainian', 'Greek', 'Czech', 'Danish', 'Finnish', 'Bulgarian',
  'Croatian', 'Slovak', 'Tamil', 'Malay',
]

/* ─── Country Phone Dropdown ─── */
function CountryPhoneInput({
  country,
  onCountryChange,
  phone,
  onPhoneChange,
}: {
  country: string
  onCountryChange: (code: string) => void
  phone: string
  onPhoneChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center h-[38px] rounded-full bg-white border border-slate-200 shadow-sm shrink-0 focus-within:border-[#8FB34A] focus-within:ring-1 focus-within:ring-[#8FB34A] transition-all">
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-full pl-2.5 pr-1 border-r border-slate-200 cursor-pointer shrink-0"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-[12px] font-semibold text-slate-600">{selected.dial}</span>
        <ChevronDown className={cn('h-3 w-3 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Phone input */}
      <input
        type="tel"
        value={phone}
        onChange={e => onPhoneChange(e.target.value)}
        placeholder="(555) 000-0000"
        className="w-[110px] h-full bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium pl-2 pr-2"
      />

      {/* Country dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[260px] rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Supported */}
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8FB34A] bg-[#EAF4D8]/50">
            Available
          </div>
          <div className="max-h-[120px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {COUNTRIES.filter(c => c.supported).map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onCountryChange(c.code); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                  c.code === country
                    ? 'bg-[#EAF4D8] font-semibold text-[#3a5e10]'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-left text-[13px]">{c.name}</span>
                <span className="text-[11px] text-slate-400">{c.dial}</span>
                {c.code === country && (
                  <svg className="h-3.5 w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
            ))}
          </div>
          {/* Coming soon */}
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Coming Soon
          </div>
          <div className="max-h-[140px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {COUNTRIES.filter(c => !c.supported).map(c => (
              <div
                key={c.code}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              >
                <span className="text-base grayscale opacity-50">{c.flag}</span>
                <span className="flex-1 text-left text-[13px]">{c.name}</span>
                <span className="text-[11px]">{c.dial}</span>
                <Lock className="h-3 w-3 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Language Dropdown (matches join page style, scrollable) ─── */
function LanguageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 h-[38px] px-3 rounded-full border shadow-sm text-[13px] font-semibold transition-all cursor-pointer',
          open
            ? 'border-[#8FB34A] bg-white ring-1 ring-[#8FB34A]/20'
            : 'border-slate-200 bg-white hover:border-slate-300'
        )}
      >
        <svg className="h-4 w-4 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-slate-700">{value}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-[200px] max-h-[200px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ scrollbarWidth: 'thin' }}
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => { onChange(lang); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors',
                lang === value
                  ? 'bg-[#EAF4D8] font-semibold text-[#3a5e10]'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {lang}
              {lang === value && (
                <svg className="h-3.5 w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MapPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLiveLocation, setIsLiveLocation] = useState(true)
  const [language, setLanguage] = useState('English')
  const [country, setCountry] = useState('CA')
  const [phone, setPhone] = useState('')

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

      {/* ─── Filter Pills Row ─── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1 -mx-4 px-4 scroll-smooth">

        {/* Language Dropdown */}
        <LanguageDropdown value={language} onChange={setLanguage} />

        {/* Describe Problem Input (wider) */}
        <div className="flex items-center h-[38px] pl-3 pr-2 rounded-full bg-white border border-slate-200 shadow-sm shrink-0 w-[220px] focus-within:border-[#8FB34A] focus-within:ring-1 focus-within:ring-[#8FB34A] transition-all">
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

        {/* Phone Input with Country Selector */}
        <CountryPhoneInput
          country={country}
          onCountryChange={setCountry}
          phone={phone}
          onPhoneChange={setPhone}
        />

        {/* GPS Toggle */}
        <label className="flex items-center gap-2 h-[38px] px-3 rounded-full bg-white border border-slate-200 shadow-sm shrink-0 cursor-pointer">
          <LocateFixed className={cn("h-4 w-4", isLiveLocation ? "text-[#8FB34A]" : "text-slate-400")} strokeWidth={2.5} />
          <span className="text-[13px] font-bold text-slate-600">GPS</span>
          <div className={cn("relative inline-flex h-4 w-7 items-center rounded-full transition-colors ml-1", isLiveLocation ? "bg-[#8FB34A]" : "bg-slate-200")}>
            <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform", isLiveLocation ? "translate-x-3.5" : "translate-x-0.5")} />
          </div>
          <input type="checkbox" className="hidden" checked={isLiveLocation} onChange={e => setIsLiveLocation(e.target.checked)} />
        </label>

        {/* Aria Button (Phone icon, after GPS) */}
        <button className="flex items-center gap-1.5 h-[38px] px-5 rounded-full bg-[#8FB34A] text-white text-[13px] font-bold shadow-[0_2px_8px_rgba(143,179,74,0.3)] shrink-0 transition-transform hover:bg-[#7da33f] active:scale-95 group">
          <Phone className="h-4 w-4 text-white group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
          Aria
        </button>
      </div>

      {/* ─── Map Container ─── */}
      <div className="flex-1 w-full relative rounded-[32px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[6px] border-white isolate min-h-[400px]">

        <GoogleMap
          center={coords || undefined}
          zoom={14}
          markers={markers}
          className="h-full w-full object-cover"
        />

        {/* Floating status tag */}
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

        {/* Floating Recenter Button */}
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
