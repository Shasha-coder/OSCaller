'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import { LocateFixed, Phone, Lock, ChevronDown, Mic, Camera, Type } from 'lucide-react'

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
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '\u{1F1EC}\u{1F1ED}', supported: false },
  { code: 'IN', name: 'India', dial: '+91', flag: '\u{1F1EE}\u{1F1F3}', supported: false },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '\u{1F1EE}\u{1F1F9}', supported: false },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '\u{1F1EF}\u{1F1F5}', supported: false },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '\u{1F1F0}\u{1F1EA}', supported: false },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '\u{1F1F0}\u{1F1F7}', supported: false },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: '\u{1F1F2}\u{1F1E6}', supported: false },
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

/* ─── Floating dropdown positioned via portal ─── */
function FloatingDropdown({
  anchorRef,
  open,
  children,
  width = 200,
}: {
  anchorRef: React.RefObject<HTMLElement | null>
  open: boolean
  children: React.ReactNode
  width?: number
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, left: rect.left })
  }, [open, anchorRef])

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width,
        zIndex: 9999,
        animation: 'dropdownIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {children}
    </div>,
    document.body
  )
}

/* ═══════════════════════════════════════════
   Country Phone Input
   ═══════════════════════════════════════════ */
function CountryPhoneInput({
  country, onCountryChange, phone, onPhoneChange,
}: {
  country: string
  onCountryChange: (code: string) => void
  phone: string
  onPhoneChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler, true)
    document.addEventListener('touchstart', handler, true)
    return () => {
      document.removeEventListener('mousedown', handler, true)
      document.removeEventListener('touchstart', handler, true)
    }
  }, [open])

  return (
    <div ref={triggerRef} className="relative shrink-0 w-[220px]">
      <div
        className={cn(
          'flex items-center h-[38px] w-full rounded-full bg-white/90 backdrop-blur-sm border shadow-sm transition-all duration-200',
          open ? 'border-[#8FB34A]/50 shadow-[0_0_0_3px_rgba(143,179,74,0.08)]' : 'border-[#E2E8F0]'
        )}
      >
        <button
          type="button"
          data-no-focus-ring
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
          className="flex items-center gap-1 h-full pl-2.5 pr-1.5 border-r border-[#E2E8F0] cursor-pointer shrink-0 outline-none"
        >
          <span className="text-[15px] leading-none">{selected.flag}</span>
          <span className="text-[12px] font-semibold text-[#334155] w-[40px] text-center tabular-nums">{selected.dial}</span>
          <ChevronDown className={cn('h-3 w-3 text-[#94A3B8] transition-transform duration-200', open && 'rotate-180')} />
        </button>
        <input
          type="tel"
          inputMode="numeric"
          data-no-focus-ring
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
          placeholder="(555) 000-0000"
          className="flex-1 min-w-0 h-full bg-transparent text-[13px] font-semibold text-[#0F172A] pl-2 pr-2.5 outline-none placeholder:text-[#94A3B8] placeholder:font-medium"
        />
      </div>

      <FloatingDropdown anchorRef={triggerRef} open={open} width={260}>
        <div ref={dropdownRef} className="rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#8FB34A] bg-[#EAF4D8]/40 border-b border-[#EAF4D8]">
            Available
          </div>
          <div className="max-h-[130px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {COUNTRIES.filter(c => c.supported).map(c => (
              <button
                key={c.code}
                type="button"
                data-no-focus-ring
                onClick={() => { onCountryChange(c.code); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] transition-colors outline-none',
                  c.code === country
                    ? 'bg-[#EAF4D8] font-semibold text-[#3a5e10]'
                    : 'text-[#0F172A] hover:bg-[#F8FAFB] active:bg-[#F1F5F9]'
                )}
              >
                <span className="text-[16px] leading-none">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-[11px] text-[#94A3B8] font-medium">{c.dial}</span>
                {c.code === country && (
                  <svg className="h-3.5 w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
            ))}
          </div>
          <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] bg-[#F8FAFB] border-y border-[#E2E8F0] flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Coming Soon
          </div>
          <div className="max-h-[160px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {COUNTRIES.filter(c => !c.supported).map(c => (
              <div
                key={c.code}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#94A3B8] cursor-not-allowed select-none"
              >
                <span className="text-[16px] leading-none grayscale opacity-50">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-[11px]">{c.dial}</span>
                <Lock className="h-3 w-3 text-[#CBD5E1]" />
              </div>
            ))}
          </div>
        </div>
      </FloatingDropdown>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Language Dropdown
   ═══════════════════════════════════════════ */
function LanguageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler, true)
    document.addEventListener('touchstart', handler, true)
    return () => {
      document.removeEventListener('mousedown', handler, true)
      document.removeEventListener('touchstart', handler, true)
    }
  }, [open])

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        data-no-focus-ring
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={cn(
          'flex items-center gap-1.5 h-[38px] px-3 rounded-full border text-[13px] font-semibold transition-all cursor-pointer outline-none',
          open
            ? 'border-[#8FB34A] bg-white shadow-[0_0_0_3px_rgba(143,179,74,0.10)]'
            : 'border-[#E2E8F0] bg-white/90 backdrop-blur-sm hover:border-[#CBD5E1] shadow-sm'
        )}
      >
        <svg className="h-4 w-4 text-[#8FB34A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-[#0F172A] whitespace-nowrap">{value}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <FloatingDropdown anchorRef={triggerRef} open={open} width={200}>
        <div
          ref={dropdownRef}
          className="max-h-[220px] overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
          style={{ scrollbarWidth: 'thin' }}
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              data-no-focus-ring
              onClick={() => { onChange(lang); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between px-3.5 py-2.5 text-[13px] transition-colors outline-none',
                lang === value
                  ? 'bg-[#EAF4D8] font-semibold text-[#3a5e10]'
                  : 'text-[#0F172A] hover:bg-[#F8FAFB] active:bg-[#F1F5F9]'
              )}
            >
              {lang}
              {lang === value && (
                <svg className="h-3.5 w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      </FloatingDropdown>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MapPage
   ═══════════════════════════════════════════ */
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
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'photo'>('text')
  const [isRecording, setIsRecording] = useState(false)

  const requestLocation = useCallback(() => {
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
        setError('Location access denied \u2014 showing default location.')
        setMarkers([
          { id: 'user', lat: fallback.lat, lng: fallback.lng, type: 'user', pulse: true },
          { id: 'svc1', lat: fallback.lat + 0.008, lng: fallback.lng + 0.005, type: 'service', label: 'Plumber' },
          { id: 'svc2', lat: fallback.lat - 0.004, lng: fallback.lng + 0.009, type: 'service', label: 'Electrician' },
        ])
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  useEffect(() => {
    if (isLiveLocation) requestLocation()
    else { setLoading(false); setError(null) }
  }, [isLiveLocation, requestLocation])

  return (
    <div className="flex flex-col h-full w-full px-4 pt-2 pb-[80px] gap-2">

      {/* ─── Filter Row ─── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 -mx-4 px-4 pb-1">

        {/* Language */}
        <LanguageDropdown value={language} onChange={setLanguage} />

        {/* Describe Problem - Multi-mode */}
        <div
          className={cn(
            'flex items-center h-[38px] rounded-full bg-white/90 backdrop-blur-sm border shadow-sm shrink-0 min-w-[240px] flex-1 max-w-[340px] transition-all duration-200',
            'border-[#E2E8F0] focus-within:border-[#8FB34A]/50 focus-within:shadow-[0_0_0_3px_rgba(143,179,74,0.08)]'
          )}
        >
          {/* Mode buttons */}
          <div className="flex items-center h-full pl-1 gap-0.5 shrink-0 border-r border-[#E2E8F0]">
            <button
              type="button"
              data-no-focus-ring
              onClick={() => { setInputMode('voice'); setIsRecording(false) }}
              className={cn(
                'flex items-center justify-center h-[28px] w-[28px] rounded-full transition-all duration-200 outline-none',
                inputMode === 'voice'
                  ? 'bg-[#8FB34A] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]'
              )}
              aria-label="Voice input"
            >
              <Mic className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              data-no-focus-ring
              onClick={() => setInputMode('photo')}
              className={cn(
                'flex items-center justify-center h-[28px] w-[28px] rounded-full transition-all duration-200 outline-none',
                inputMode === 'photo'
                  ? 'bg-[#8FB34A] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]'
              )}
              aria-label="Photo input"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              data-no-focus-ring
              onClick={() => setInputMode('text')}
              className={cn(
                'flex items-center justify-center h-[28px] w-[28px] rounded-full transition-all duration-200 outline-none mr-0.5',
                inputMode === 'text'
                  ? 'bg-[#8FB34A] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]'
              )}
              aria-label="Text input"
            >
              <Type className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Input area */}
          <div className="flex-1 min-w-0 h-full flex items-center px-2.5">
            {inputMode === 'text' && (
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                type="text"
                data-no-focus-ring
                placeholder="Describe problem..."
                className="w-full h-full bg-transparent text-[13px] font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8] placeholder:font-medium"
              />
            )}
            {inputMode === 'voice' && (
              <button
                type="button"
                data-no-focus-ring
                onClick={() => setIsRecording(r => !r)}
                className="flex items-center gap-2 w-full outline-none"
              >
                <span className={cn(
                  'relative flex h-5 w-5 items-center justify-center',
                  isRecording && 'animate-pulse'
                )}>
                  {isRecording && <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />}
                  <span className={cn('relative h-2.5 w-2.5 rounded-full transition-colors', isRecording ? 'bg-red-500' : 'bg-[#94A3B8]')} />
                </span>
                <span className={cn('text-[13px] font-semibold', isRecording ? 'text-red-500' : 'text-[#94A3B8]')}>
                  {isRecording ? 'Recording...' : 'Tap to speak'}
                </span>
              </button>
            )}
            {inputMode === 'photo' && (
              <label className="flex items-center gap-2 w-full cursor-pointer">
                <div className="flex items-center justify-center h-5 w-5 rounded-md border border-dashed border-[#CBD5E1] bg-[#F8FAFB]">
                  <Camera className="h-3 w-3 text-[#94A3B8]" strokeWidth={2} />
                </div>
                <span className="text-[13px] font-semibold text-[#94A3B8]">Upload photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Phone */}
        <CountryPhoneInput
          country={country}
          onCountryChange={setCountry}
          phone={phone}
          onPhoneChange={setPhone}
        />

        {/* GPS Toggle */}
        <button
          type="button"
          data-no-focus-ring
          onClick={() => setIsLiveLocation(v => !v)}
          className={cn(
            'flex items-center gap-2 h-[38px] px-3 rounded-full border shadow-sm shrink-0 cursor-pointer transition-all outline-none',
            isLiveLocation
              ? 'border-[#8FB34A]/30 bg-[#EAF4D8]/60'
              : 'border-[#E2E8F0] bg-white/90 backdrop-blur-sm'
          )}
        >
          <LocateFixed className={cn('h-4 w-4 transition-colors', isLiveLocation ? 'text-[#8FB34A]' : 'text-[#94A3B8]')} strokeWidth={2.5} />
          <span className="text-[13px] font-bold text-[#334155]">GPS</span>
          <div className={cn('relative inline-flex h-[18px] w-[30px] items-center rounded-full transition-colors duration-200 ml-0.5', isLiveLocation ? 'bg-[#8FB34A]' : 'bg-[#CBD5E1]')}>
            <span className={cn('inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-sm transition-transform duration-200', isLiveLocation ? 'translate-x-[14px]' : 'translate-x-[2px]')} />
          </div>
        </button>

        {/* Aria Button */}
        <button
          type="button"
          data-no-focus-ring
          className="flex items-center gap-1.5 h-[38px] px-5 rounded-full bg-[#8FB34A] text-white text-[13px] font-bold shadow-[0_2px_12px_rgba(143,179,74,0.35)] shrink-0 transition-all hover:bg-[#7da33f] hover:shadow-[0_4px_16px_rgba(143,179,74,0.4)] active:scale-[0.97] outline-none"
        >
          <Phone className="h-4 w-4" strokeWidth={2.5} />
          Aria
        </button>
      </div>

      {/* ─── Map ─── */}
      <div className="flex-1 w-full relative rounded-[28px] overflow-hidden shadow-[0_12px_48px_rgba(15,23,42,0.10),0_4px_16px_rgba(15,23,42,0.05),0_0_0_1px_rgba(226,232,240,0.6)] isolate min-h-[400px]">
        <GoogleMap
          center={coords || undefined}
          zoom={14}
          markers={markers}
          className="h-full w-full object-cover"
        />

        {/* Status badge */}
        {!loading && !error && (
          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-[#E2E8F0]/50">
            <div className="flex items-center justify-center p-0.5 rounded-sm bg-[#8FB34A] text-white">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-[12px] font-bold text-[#334155] tracking-wide uppercase">Track Pro On Map</span>
          </div>
        )}

        {/* Error */}
        {error && isLiveLocation && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 rounded-full border border-amber-200 bg-amber-50/95 backdrop-blur-md px-4 py-2 text-[12px] font-bold text-amber-800 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-11/12 max-w-sm justify-center">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Recenter button */}
        <button
          data-no-focus-ring
          onClick={requestLocation}
          className="absolute top-5 left-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-[#E2E8F0]/50 transition-transform hover:scale-105 active:scale-95 text-[#334155] outline-none"
          aria-label="Use my current GPS location"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-[2.5px] border-[#E2E8F0] border-t-[#8FB34A]" />
          ) : (
            <LocateFixed className="h-4 w-4" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  )
}
