'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import { LocateFixed, Phone, Lock, ChevronDown, Mic, Camera, Type, Upload } from 'lucide-react'

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
  const [flipUp, setFlipUp] = useState(false)

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const left = Math.min(rect.left, window.innerWidth - width - 12)
    const spaceBelow = window.innerHeight - rect.bottom
    const shouldFlip = spaceBelow < 260
    setFlipUp(shouldFlip)
    if (shouldFlip) {
      setPos({ top: rect.top - 6, left: Math.max(8, left) })
    } else {
      setPos({ top: rect.bottom + 6, left: Math.max(8, left) })
    }
  }, [open, anchorRef, width])

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        ...(flipUp ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
        left: pos.left,
        width,
        zIndex: 9999,
        animation: flipUp
          ? 'dropdownInUp 180ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'dropdownIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdownInUp {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
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
    <div ref={triggerRef} className="relative shrink-0 w-[200px]">
      <div
        className={cn(
          'flex items-center h-[36px] w-full rounded-full bg-white/95 backdrop-blur-md border transition-all duration-200',
          open ? 'border-[#8FB34A]/50 shadow-[0_0_0_3px_rgba(143,179,74,0.08)]' : 'border-white/60 shadow-sm'
        )}
      >
        <button
          type="button"
          data-no-focus-ring
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
          className="flex items-center gap-1 h-full pl-2.5 pr-1.5 border-r border-[#E2E8F0]/60 cursor-pointer shrink-0 outline-none"
        >
          <span className="text-[14px] leading-none">{selected.flag}</span>
          <span className="text-[11px] font-semibold text-[#334155] w-[36px] text-center tabular-nums">{selected.dial}</span>
          <ChevronDown className={cn('h-2.5 w-2.5 text-[#94A3B8] transition-transform duration-200', open && 'rotate-180')} />
        </button>
        <input
          type="tel"
          inputMode="numeric"
          data-no-focus-ring
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
          placeholder="(555) 000-0000"
          className="flex-1 min-w-0 h-full bg-transparent text-[12px] font-semibold text-[#0F172A] pl-2 pr-2 outline-none placeholder:text-[#94A3B8] placeholder:font-medium"
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
          'flex items-center gap-1.5 h-[36px] px-3 rounded-full border text-[12px] font-semibold transition-all cursor-pointer outline-none',
          open
            ? 'border-[#8FB34A] bg-white shadow-[0_0_0_3px_rgba(143,179,74,0.10)]'
            : 'border-white/60 bg-white/95 backdrop-blur-md hover:border-[#CBD5E1] shadow-sm'
        )}
      >
        <svg className="h-3.5 w-3.5 text-[#8FB34A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-[#0F172A] whitespace-nowrap">{value}</span>
        <ChevronDown className={cn('h-3 w-3 text-[#94A3B8] transition-transform duration-200', open && 'rotate-180')} />
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
   MapPage - Immersive mobile, classic desktop
   ═══════════════════════════════════════════ */
interface MapPageProps {
  onRequestCreated?: (requestId: string) => void
}

export function MapPage({ onRequestCreated }: MapPageProps) {
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
  const [callingAria, setCallingAria] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // Validation and call state
  const [validationError, setValidationError] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'active' | 'ended'>('idle')

  // Fetch nearby providers from API and set as markers
  const fetchNearbyProviders = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/providers/nearby?lat=${lat}&lng=${lng}&radius=15`)
      if (res.ok) {
        const data = await res.json()
        const providerMarkers = (data.providers || []).map((p: any, i: number) => ({
          id: `prov-${p.id || i}`,
          lat: p.lat,
          lng: p.lng,
          type: 'service' as const,
          label: p.trade || p.name || 'Pro',
        }))
        setMarkers([
          { id: 'user', lat, lng, type: 'user', pulse: true },
          ...providerMarkers,
        ])
      }
    } catch {
      // Silently fall back to just user marker
    }
  }, [])

  // Validate before call
  const validateCall = useCallback((): string | null => {
    if (!coords) return 'Please enable GPS location'
    if (!language) return 'Please select your language'
    if (!phone || phone.length < 7) return 'Please enter your phone number'
    const selectedCountry = COUNTRIES.find(c => c.code === country)
    if (!selectedCountry?.supported) return 'Service not available in this country yet'
    // Check if user has provided some input (text, voice, or photo)
    if (inputMode === 'text' && !searchQuery.trim()) {
      // Text mode but no description - that's okay, agent will ask
    }
    if (inputMode === 'photo' && !uploadedFile) {
      // Photo mode but no file - warn but allow
    }
    return null
  }, [coords, language, phone, country, inputMode, searchQuery, uploadedFile])

  // Call Aria: Validate, Create request, Trigger Retell call, Navigate to tracking
  const callAria = useCallback(async () => {
    if (callingAria) return
    
    // Validate first
    const error = validateCall()
    if (error) {
      setValidationError(error)
      setTimeout(() => setValidationError(null), 3000)
      return
    }
    
    setCallingAria(true)
    setCallStatus('connecting')
    setValidationError(null)
    
    try {
      const selectedCountry = COUNTRIES.find(c => c.code === country)
      const fullPhone = `${selectedCountry?.dial || '+1'}${phone.replace(/\D/g, '')}`
      
      // 1. Create service_request in Supabase
      const createRes = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coords!.lat,
          lng: coords!.lng,
          description: searchQuery || `${inputMode} request`,
          input_mode: inputMode,
          language,
          phone: fullPhone,
          country,
          status: 'qualified',
        }),
      })
      
      if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.error || 'Failed to create request')
      }
      
      const { request } = await createRes.json()
      const requestId = request.id
      
      // 2. If photo was uploaded, analyze it with Gemini
      if (uploadedFile && inputMode === 'photo') {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1]
          await fetch(`/api/requests/${requestId}/analyze-media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input_type: 'image',
              image_base64: base64,
            }),
          })
        }
        reader.readAsDataURL(uploadedFile)
      }
      
      // 3. Trigger Retell AI call to client
      setCallStatus('ringing')
      const callRes = await fetch('/api/retell/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          phone: fullPhone,
          country_code: country,
          language,
          lat: coords!.lat,
          lng: coords!.lng,
          customer_name: 'Customer',
        }),
      })
      
      if (!callRes.ok) {
        const err = await callRes.json()
        console.error('Call failed:', err)
        // Continue anyway - dispatch will still work
      } else {
        setCallStatus('active')
      }
      
      // 4. Start GPS streaming
      const streamGps = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await fetch(`/api/requests/${requestId}/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  role: 'client',
                }),
              })
            },
            () => {},
            { enableHighAccuracy: true }
          )
        }
      }
      streamGps()
      const gpsInterval = setInterval(streamGps, 30000)
      
      // 5. Trigger dispatch
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      
      // 6. Navigate to tracking after brief animation
      setTimeout(() => {
        if (onRequestCreated) {
          onRequestCreated(requestId)
        }
        setCallStatus('idle')
      }, 1500)
      
      return () => clearInterval(gpsInterval)
      
    } catch (err) {
      console.error('Failed to create request:', err)
      setValidationError(err instanceof Error ? err.message : 'Something went wrong')
      setCallStatus('idle')
    } finally {
      setCallingAria(false)
    }
  }, [callingAria, validateCall, coords, language, country, phone, searchQuery, inputMode, uploadedFile, onRequestCreated])

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
        // Set user marker immediately, then fetch real providers
        setMarkers([{ id: 'user', lat: userCoords.lat, lng: userCoords.lng, type: 'user', pulse: true }])
        fetchNearbyProviders(userCoords.lat, userCoords.lng)
      },
      () => {
        const fallback = { lat: 40.7128, lng: -74.006 }
        setCoords(fallback)
        setLoading(false)
        setError('Location access denied \u2014 showing default location.')
        setMarkers([{ id: 'user', lat: fallback.lat, lng: fallback.lng, type: 'user', pulse: true }])
        fetchNearbyProviders(fallback.lat, fallback.lng)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  useEffect(() => {
    if (isLiveLocation) requestLocation()
    else { setLoading(false); setError(null) }
  }, [isLiveLocation, requestLocation])

  return (
    <div className="relative h-full w-full flex flex-col">

      {/* ─── MOBILE: Full-bleed immersive map ─── */}
      <div className="flex flex-col h-full sm:hidden">
        {/* Map takes most of the screen, leaves room for bottom panel */}
        <div className="relative flex-1 min-h-0 max-h-[calc(100dvh-180px)]">
          <GoogleMap
            center={coords || undefined}
            zoom={14}
            markers={markers}
            className="h-full w-full"
          />

          {/* Floating header */}
          <div className="absolute top-0 inset-x-0 z-10 pt-3 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-xl px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/60">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span className="text-[13px] font-bold text-[#0F172A]">Request a Pro</span>
              </div>

              {/* GPS + Recenter */}
              <div className="flex items-center gap-2">
                <button
                  data-no-focus-ring
                  onClick={() => setIsLiveLocation(v => !v)}
                  className={cn(
                    'flex items-center gap-1.5 h-[34px] px-2.5 rounded-full border transition-all outline-none shadow-sm',
                    isLiveLocation
                      ? 'border-[#8FB34A]/30 bg-[#EAF4D8]/90 backdrop-blur-md'
                      : 'border-white/60 bg-white/90 backdrop-blur-md'
                  )}
                >
                  <LocateFixed className={cn('h-3.5 w-3.5 transition-colors', isLiveLocation ? 'text-[#8FB34A]' : 'text-[#94A3B8]')} strokeWidth={2.5} />
                  <div className={cn('relative inline-flex h-[16px] w-[26px] items-center rounded-full transition-colors duration-200', isLiveLocation ? 'bg-[#8FB34A]' : 'bg-[#CBD5E1]')}>
                    <span className={cn('inline-block h-[12px] w-[12px] transform rounded-full bg-white shadow-sm transition-transform duration-200', isLiveLocation ? 'translate-x-[12px]' : 'translate-x-[2px]')} />
                  </div>
                </button>
                <button
                  data-no-focus-ring
                  onClick={requestLocation}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/90 backdrop-blur-xl shadow-sm border border-white/60 outline-none active:scale-95 transition-transform"
                  aria-label="Recenter"
                >
                  {loading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#8FB34A]" />
                  ) : (
                    <LocateFixed className="h-3.5 w-3.5 text-[#334155]" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error toast */}
          {error && isLiveLocation && (
            <div className="absolute top-14 left-3 right-3 z-10 rounded-full border border-amber-200 bg-amber-50/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-amber-800 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.05)] justify-center">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="truncate">{error}</span>
            </div>
          )}

          {/* Validation error toast */}
          {validationError && (
            <div className="absolute top-14 left-3 right-3 z-20 rounded-full border border-red-200 bg-red-50/95 backdrop-blur-md px-3 py-2 text-[12px] font-semibold text-red-700 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)] justify-center animate-in fade-in slide-in-from-top-2 duration-200">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{validationError}</span>
            </div>
          )}

          {/* Calling Aria overlay */}
          {callStatus !== 'idle' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-[#0F172A]/95 to-[#1E293B]/95 backdrop-blur-md animate-in fade-in duration-300">
              {/* Pulsing rings */}
              <div className="relative mb-6">
                <div className="absolute inset-0 -m-8 rounded-full bg-[#8FB34A]/20 animate-ping" />
                <div className="absolute inset-0 -m-4 rounded-full bg-[#8FB34A]/30 animate-pulse" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#8FB34A] to-[#6B8C2F] shadow-xl shadow-[#8FB34A]/30">
                  <Phone className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
              
              {/* Status text */}
              <p className="text-white font-bold text-lg mb-1">
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'ringing' && 'Calling you now...'}
                {callStatus === 'active' && 'Aria is calling'}
              </p>
              <p className="text-white/60 text-sm">
                {callStatus === 'connecting' && 'Setting up your request'}
                {callStatus === 'ringing' && 'Answer the call from Aria'}
                {callStatus === 'active' && 'Describe your problem to Aria'}
              </p>
              
              {/* Soft connecting sound indicator */}
              <div className="flex items-center gap-1 mt-6">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-[#8FB34A] rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 16}px`,
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Status badge */}
          {!loading && !error && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-white/60">
              <div className="flex items-center justify-center p-0.5 rounded-sm bg-[#8FB34A] text-white">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[11px] font-bold text-[#334155] tracking-wide uppercase">Track Pro On Map</span>
            </div>
          )}
        </div>

        {/* ─── Bottom floating panel with fields ─── */}
        <div className="shrink-0 bg-white/95 backdrop-blur-xl border-t border-[#E2E8F0]/40 px-3 pt-3 pb-[78px]">
          {/* Row 1: Language + Describe Problem */}
          <div className="flex items-center gap-2">
            <LanguageDropdown value={language} onChange={setLanguage} />
            <div
              className={cn(
                'flex items-center h-[36px] flex-1 min-w-0 rounded-full bg-white border transition-all duration-200',
                'border-[#E2E8F0] focus-within:border-[#8FB34A]/50 focus-within:shadow-[0_0_0_3px_rgba(143,179,74,0.08)]'
              )}
            >
              <div className="flex items-center h-full pl-1 gap-0.5 shrink-0 border-r border-[#E2E8F0]/60">
                {(['voice', 'photo', 'text'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    data-no-focus-ring
                    onClick={() => { setInputMode(mode); if (mode === 'voice') setIsRecording(false) }}
                    className={cn(
                      'flex items-center justify-center h-[26px] w-[26px] rounded-full transition-all duration-200 outline-none',
                      inputMode === mode
                        ? 'bg-[#8FB34A] text-white shadow-sm'
                        : 'text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]',
                      mode === 'text' && 'mr-0.5'
                    )}
                    aria-label={`${mode} input`}
                  >
                    {mode === 'voice' && <Mic className="h-3 w-3" strokeWidth={2.5} />}
                    {mode === 'photo' && <Camera className="h-3 w-3" strokeWidth={2.5} />}
                    {mode === 'text' && <Type className="h-3 w-3" strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-0 h-full flex items-center px-2">
                {inputMode === 'text' && (
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    type="text"
                    data-no-focus-ring
                    placeholder="Describe problem..."
                    className="w-full h-full bg-transparent text-[12px] font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8] placeholder:font-medium"
                  />
                )}
                {inputMode === 'voice' && (
                  <button type="button" data-no-focus-ring onClick={() => setIsRecording(r => !r)} className="flex items-center gap-2 w-full outline-none">
                    <span className={cn('relative flex h-4 w-4 items-center justify-center', isRecording && 'animate-pulse')}>
                      {isRecording && <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />}
                      <span className={cn('relative h-2 w-2 rounded-full transition-colors', isRecording ? 'bg-red-500' : 'bg-[#94A3B8]')} />
                    </span>
                    <span className={cn('text-[12px] font-semibold', isRecording ? 'text-red-500' : 'text-[#94A3B8]')}>
                      {isRecording ? 'Recording...' : 'Tap to speak'}
                    </span>
                  </button>
                )}
                {inputMode === 'photo' && (
                  <div className="flex items-center gap-3 w-full">
                    {uploadedFile ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-semibold text-[#8FB34A] truncate max-w-[120px]">{uploadedFile.name}</span>
                        <button type="button" onClick={() => setUploadedFile(null)} className="text-[10px] text-[#94A3B8] hover:text-red-500">Remove</button>
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-1 cursor-pointer group whitespace-nowrap">
                          <Upload className="h-3 w-3 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2.5} />
                          <span className="text-[11px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]) }}
                          />
                        </label>
                        <span className="text-[#CBD5E1] text-[10px]">|</span>
                        <label className="flex items-center gap-1 cursor-pointer group whitespace-nowrap">
                          <Camera className="h-3 w-3 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2.5} />
                          <span className="text-[11px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Take pic</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]) }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Phone + Aria */}
          <div className="flex items-center gap-2 mt-2">
            <CountryPhoneInput
              country={country}
              onCountryChange={setCountry}
              phone={phone}
              onPhoneChange={setPhone}
            />
  <button
  type="button"
  data-no-focus-ring
  onClick={callAria}
  disabled={callingAria}
  className="flex-1 flex items-center justify-center gap-1.5 h-[36px] rounded-full bg-[#8FB34A] text-white text-[13px] font-bold shadow-[0_2px_12px_rgba(143,179,74,0.35)] transition-all hover:bg-[#7da33f] active:scale-[0.97] outline-none disabled:opacity-60"
  >
  <Phone className={cn("h-3.5 w-3.5", callingAria && "animate-pulse")} strokeWidth={2.5} />
  {callingAria ? 'Calling...' : 'Aria'}
  </button>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP: Classic layout ─── */}
      <div className="hidden sm:flex sm:flex-col sm:h-full sm:gap-2">
        {/* Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1">
          <LanguageDropdown value={language} onChange={setLanguage} />

          {/* Describe Problem */}
          <div
            className={cn(
              'flex items-center h-[38px] rounded-full bg-white/90 backdrop-blur-sm border shadow-sm shrink-0 min-w-[240px] flex-1 max-w-[340px] transition-all duration-200',
              'border-[#E2E8F0] focus-within:border-[#8FB34A]/50 focus-within:shadow-[0_0_0_3px_rgba(143,179,74,0.08)]'
            )}
          >
            <div className="flex items-center h-full pl-1 gap-0.5 shrink-0 border-r border-[#E2E8F0]">
              {(['voice', 'photo', 'text'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  data-no-focus-ring
                  onClick={() => { setInputMode(mode); if (mode === 'voice') setIsRecording(false) }}
                  className={cn(
                    'flex items-center justify-center h-[28px] w-[28px] rounded-full transition-all duration-200 outline-none',
                    inputMode === mode
                      ? 'bg-[#8FB34A] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]',
                    mode === 'text' && 'mr-0.5'
                  )}
                  aria-label={`${mode} input`}
                >
                  {mode === 'voice' && <Mic className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  {mode === 'photo' && <Camera className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  {mode === 'text' && <Type className="h-3.5 w-3.5" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
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
                <button type="button" data-no-focus-ring onClick={() => setIsRecording(r => !r)} className="flex items-center gap-2 w-full outline-none">
                  <span className={cn('relative flex h-5 w-5 items-center justify-center', isRecording && 'animate-pulse')}>
                    {isRecording && <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />}
                    <span className={cn('relative h-2.5 w-2.5 rounded-full transition-colors', isRecording ? 'bg-red-500' : 'bg-[#94A3B8]')} />
                  </span>
                  <span className={cn('text-[13px] font-semibold', isRecording ? 'text-red-500' : 'text-[#94A3B8]')}>
                    {isRecording ? 'Recording...' : 'Tap to speak'}
                  </span>
                </button>
              )}
              {inputMode === 'photo' && (
                <div className="flex items-center gap-3 w-full">
                  {uploadedFile ? (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[12px] font-semibold text-[#8FB34A] truncate max-w-[140px]">{uploadedFile.name}</span>
                      <button type="button" onClick={() => setUploadedFile(null)} className="text-[11px] text-[#94A3B8] hover:text-red-500">Remove</button>
                    </div>
                  ) : (
                    <>
                      <label className="flex items-center gap-1 cursor-pointer group whitespace-nowrap">
                        <Upload className="h-3 w-3 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2.5} />
                        <span className="text-[12px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Upload</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]) }}
                        />
                      </label>
                      <span className="text-[#CBD5E1] text-[10px]">|</span>
                      <label className="flex items-center gap-1 cursor-pointer group whitespace-nowrap">
                        <Camera className="h-3 w-3 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2.5} />
                        <span className="text-[12px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Take pic</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]) }}
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <CountryPhoneInput country={country} onCountryChange={setCountry} phone={phone} onPhoneChange={setPhone} />

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
            onClick={callAria}
            disabled={callingAria}
            className="flex items-center gap-1.5 h-[38px] px-5 rounded-full bg-[#8FB34A] text-white text-[13px] font-bold shadow-[0_2px_12px_rgba(143,179,74,0.35)] shrink-0 transition-all hover:bg-[#7da33f] hover:shadow-[0_4px_16px_rgba(143,179,74,0.4)] active:scale-[0.97] outline-none disabled:opacity-60"
          >
            <Phone className={cn("h-4 w-4", callingAria && "animate-pulse")} strokeWidth={2.5} />
            {callingAria ? 'Calling...' : 'Aria'}
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 w-full relative rounded-[28px] overflow-hidden shadow-[0_12px_48px_rgba(15,23,42,0.10),0_4px_16px_rgba(15,23,42,0.05),0_0_0_1px_rgba(226,232,240,0.6)] isolate min-h-[400px]">
          <GoogleMap
            center={coords || undefined}
            zoom={14}
            markers={markers}
            className="h-full w-full object-cover"
          />

          {!loading && !error && (
            <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-[#E2E8F0]/50">
              <div className="flex items-center justify-center p-0.5 rounded-sm bg-[#8FB34A] text-white">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[12px] font-bold text-[#334155] tracking-wide uppercase">Track Pro On Map</span>
            </div>
          )}

          {error && isLiveLocation && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 rounded-full border border-amber-200 bg-amber-50/95 backdrop-blur-md px-4 py-2 text-[12px] font-bold text-amber-800 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-11/12 max-w-sm justify-center">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="truncate">{error}</span>
            </div>
          )}

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
    </div>
  )
}
