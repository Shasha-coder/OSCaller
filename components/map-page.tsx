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
  const spaceAbove = rect.top
  // Flip up if not enough space below AND there's more space above
  const shouldFlip = spaceBelow < 300 && spaceAbove > spaceBelow
  setFlipUp(shouldFlip)
  if (shouldFlip) {
  setPos({ top: rect.top - 8, left: Math.max(8, left) })
  } else {
  setPos({ top: rect.bottom + 8, left: Math.max(8, left) })
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
    <div ref={triggerRef} className="relative w-full">
      <div
        className={cn(
          'flex items-center h-[48px] w-full rounded-xl bg-[#F8FAFB] border-2 transition-all duration-200',
          open ? 'border-[#8FB34A] bg-white shadow-[0_0_0_4px_rgba(143,179,74,0.08)]' : 'border-[#E2E8F0]'
        )}
      >
        <button
          type="button"
          data-no-focus-ring
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
          className="flex items-center gap-2 h-full pl-3.5 pr-2.5 border-r border-[#E2E8F0]/80 cursor-pointer shrink-0 outline-none"
        >
          <span className="text-[18px] leading-none">{selected.flag}</span>
          <span className="text-[14px] font-bold text-[#334155] tabular-nums">{selected.dial}</span>
          <ChevronDown className={cn('h-4 w-4 text-[#94A3B8] transition-transform duration-200', open && 'rotate-180')} />
        </button>
        <input
          type="tel"
          inputMode="tel"
          data-no-focus-ring
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
          placeholder="(555) 000-0000"
          className="flex-1 min-w-0 h-full bg-transparent text-[15px] font-semibold text-[#0F172A] pl-3 pr-3 outline-none placeholder:text-[#94A3B8] placeholder:font-normal tabular-nums"
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
   Mobile Phone Input - Large, touch-friendly
   ═══════════════════════════════════════════ */
function MobilePhoneInput({
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
    <div ref={triggerRef} className="relative w-full">
      <div
        className={cn(
          'flex items-center h-[52px] w-full rounded-2xl bg-[#F8FAFB] border-2 transition-all duration-200',
          open ? 'border-[#8FB34A] bg-white shadow-[0_0_0_4px_rgba(143,179,74,0.1)]' : 'border-[#E2E8F0]'
        )}
      >
        <button
          type="button"
          data-no-focus-ring
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
          className="flex items-center gap-2 h-full pl-4 pr-3 border-r border-[#E2E8F0]/80 cursor-pointer shrink-0 outline-none"
        >
          <span className="text-[20px] leading-none">{selected.flag}</span>
          <span className="text-[15px] font-bold text-[#334155] tabular-nums">{selected.dial}</span>
          <ChevronDown className={cn('h-4 w-4 text-[#94A3B8] transition-transform duration-200', open && 'rotate-180')} />
        </button>
        <input
          type="tel"
          inputMode="tel"
          data-no-focus-ring
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
          placeholder="(555) 000-0000"
          className="flex-1 min-w-0 h-full bg-transparent text-[17px] font-semibold text-[#0F172A] pl-3 pr-4 outline-none placeholder:text-[#94A3B8] placeholder:font-normal tabular-nums"
        />
      </div>

      <FloatingDropdown anchorRef={triggerRef} open={open} width={300}>
        <div ref={dropdownRef} className="rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#8FB34A] bg-[#EAF4D8]/40 border-b border-[#EAF4D8]">
            Available Countries
          </div>
          <div className="max-h-[180px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {COUNTRIES.filter(c => c.supported).map(c => (
              <button
                key={c.code}
                type="button"
                data-no-focus-ring
                onClick={() => { onCountryChange(c.code); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3.5 text-[15px] transition-colors outline-none',
                  c.code === country
                    ? 'bg-[#EAF4D8] font-semibold text-[#3a5e10]'
                    : 'text-[#0F172A] hover:bg-[#F8FAFB] active:bg-[#F1F5F9]'
                )}
              >
                <span className="text-[22px] leading-none">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-[13px] text-[#94A3B8] font-semibold tabular-nums">{c.dial}</span>
                {c.code === country && (
                  <svg className="h-5 w-5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] bg-[#F8FAFB] border-y border-[#E2E8F0] flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Coming Soon
          </div>
          <div className="max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {COUNTRIES.filter(c => !c.supported).map(c => (
              <div
                key={c.code}
                className="flex w-full items-center gap-3 px-4 py-3 text-[15px] text-[#94A3B8] cursor-not-allowed select-none"
              >
                <span className="text-[22px] leading-none grayscale opacity-50">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-[13px] tabular-nums">{c.dial}</span>
                <Lock className="h-4 w-4 text-[#CBD5E1]" />
              </div>
            ))}
          </div>
        </div>
      </FloatingDropdown>
    </div>
  )
}

/* ══════════════════���������������════════════════════════
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
    <div className="relative w-full sm:w-auto sm:shrink-0">
      <button
        ref={triggerRef}
        type="button"
        data-no-focus-ring
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={cn(
          'flex items-center gap-2 w-full sm:w-auto h-[52px] sm:h-[36px] px-4 sm:px-3 rounded-2xl sm:rounded-full border-2 sm:border text-[15px] sm:text-[12px] font-semibold transition-all cursor-pointer outline-none',
          open
            ? 'border-[#8FB34A] bg-white shadow-[0_0_0_4px_rgba(143,179,74,0.1)] sm:shadow-[0_0_0_3px_rgba(143,179,74,0.10)]'
            : 'border-[#E2E8F0] sm:border-white/60 bg-[#F8FAFB] sm:bg-white/95 sm:backdrop-blur-md hover:border-[#CBD5E1] sm:shadow-sm'
        )}
      >
        <svg className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-[#8FB34A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-[#0F172A] whitespace-nowrap flex-1 sm:flex-none text-left">{value}</span>
        <ChevronDown className={cn('h-5 w-5 sm:h-3 sm:w-3 text-[#94A3B8] transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <FloatingDropdown anchorRef={triggerRef} open={open} width={260}>
        <div
          ref={dropdownRef}
          className="max-h-[280px] overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
          style={{ scrollbarWidth: 'thin' }}
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              data-no-focus-ring
              onClick={() => { onChange(lang); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3.5 sm:py-2.5 text-[15px] sm:text-[13px] transition-colors outline-none',
                lang === value
                  ? 'bg-[#EAF4D8] font-semibold text-[#3a5e10]'
                  : 'text-[#0F172A] hover:bg-[#F8FAFB] active:bg-[#F1F5F9]'
              )}
            >
              {lang}
              {lang === value && (
                <svg className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
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
  const [customerName, setCustomerName] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'photo'>('text')
  const [isRecording, setIsRecording] = useState(false)
  const [callingAria, setCallingAria] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // Validation and call state
  const [validationError, setValidationError] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'active' | 'dispatched' | 'ended'>('idle')
  const [matchedProvider, setMatchedProvider] = useState<{
    name: string
    trade: string
    distance: number // km
    eta: number // minutes
    lat: number
    lng: number
    rating?: number
  } | null>(null)

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
    const missingFields: string[] = []
    
    if (!coords) missingFields.push('GPS location')
    if (!language) missingFields.push('language')
    if (!phone || phone.length < 7) missingFields.push('phone number')
    
    if (missingFields.length > 0) {
      return `Please fill the form to make the call`
    }
    
    const selectedCountry = COUNTRIES.find(c => c.code === country)
    if (!selectedCountry?.supported) return 'Service not available in this country yet'
    
    return null
  }, [coords, language, phone, country])

  // Voice recording handlers
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('[v0] Microphone access denied:', err)
      setValidationError('Microphone access required for voice recording')
      setTimeout(() => setValidationError(null), 3000)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

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
      
      // 2. If photo was uploaded, analyze it with Gemini FIRST (before call)
      let photoSummary = ''
      let audioSummary = ''
      
      if (uploadedFile && inputMode === 'photo') {
        try {
          // First upload the image to get a URL
          const formData = new FormData()
          formData.append('file', uploadedFile)
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            console.log('[v0] Photo uploaded to:', uploadData.url)
            
            // Now analyze with the URL
            const analyzeRes = await fetch(`/api/requests/${requestId}/analyze-media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                media_type: 'image',
                media_url: uploadData.url,
              }),
            })
            
            if (analyzeRes.ok) {
              const analyzeData = await analyzeRes.json()
              // The API returns agent_prompt which is the formatted string for Aria
              photoSummary = analyzeData.agent_prompt || analyzeData.analysis?.summary || ''
              console.log('[v0] Photo analysis result:', photoSummary)
            } else {
              const errText = await analyzeRes.text()
              console.error('[v0] Photo analysis failed:', errText)
            }
          } else {
            const errText = await uploadRes.text()
            console.error('[v0] Photo upload failed:', errText)
          }
        } catch (e) {
          console.error('[v0] Photo upload/analysis error:', e)
        }
      }
      
      // 2b. If voice recording exists, analyze it
      if (audioBlob && inputMode === 'voice') {
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve((reader.result as string).split(',')[1])
            reader.readAsDataURL(audioBlob)
          })
          console.log('[v0] Audio blob size:', audioBlob.size, 'type:', audioBlob.type)
          
          const analyzeRes = await fetch(`/api/requests/${requestId}/analyze-media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              media_type: 'audio',
              audio_base64: base64,
              mime_type: audioBlob.type || 'audio/webm',
            }),
          })
          
          if (analyzeRes.ok) {
            const analyzeData = await analyzeRes.json()
            // The API returns agent_prompt which is the formatted string for Aria
            audioSummary = analyzeData.agent_prompt || analyzeData.analysis?.summary || ''
            console.log('[v0] Audio analysis result:', audioSummary)
          } else {
            const errText = await analyzeRes.text()
            console.error('[v0] Audio analysis failed:', errText)
          }
        } catch (e) {
          console.error('[v0] Audio analysis error:', e)
        }
      }
      
      // 3. Trigger Retell AI call to client with full context
      setCallStatus('ringing')
      
      // Play call sound effect using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const playTone = (freq: number, duration: number, startTime: number) => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          oscillator.frequency.value = freq
          oscillator.type = 'sine'
          gainNode.gain.setValueAtTime(0.15, startTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
          oscillator.start(startTime)
          oscillator.stop(startTime + duration)
        }
        // Play a pleasant two-tone ring (similar to modern phone ringtone)
        const now = audioContext.currentTime
        playTone(880, 0.15, now)        // A5
        playTone(1047, 0.15, now + 0.15) // C6
        playTone(880, 0.15, now + 0.4)
        playTone(1047, 0.15, now + 0.55)
      } catch (e) {
        // Ignore sound errors on browsers that don't support Web Audio
      }
      
      const callPayload = {
        request_id: requestId,
        phone: fullPhone,
        country_code: country,
        language,
        lat: coords!.lat,
        lng: coords!.lng,
        customer_name: customerName || 'there',
        // Pass context for Aria's dynamic variables
        issue_description: inputMode === 'text' ? searchQuery : '',
        photo_summary: photoSummary,
        audio_summary: audioSummary,
        service_type: 'general',
        urgency: 'standard',
      }
      
      console.log('[v0] Calling Retell with payload:', callPayload)
      
      const callRes = await fetch('/api/retell/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callPayload),
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
      
      // 5. Fetch nearest provider for animation
      try {
        const providerRes = await fetch(`/api/providers/nearby?lat=${coords!.lat}&lng=${coords!.lng}&radius=25&limit=1`)
        if (providerRes.ok) {
          const providerData = await providerRes.json()
          if (providerData.providers?.[0]) {
            const p = providerData.providers[0]
            // Calculate distance using Haversine formula
            const R = 6371 // km
            const dLat = (p.lat - coords!.lat) * Math.PI / 180
            const dLng = (p.lng - coords!.lng) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(coords!.lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            const distance = R * c
            const eta = Math.round(distance * 3 + 5) // Rough ETA: 3 min/km + 5 min buffer
            
            setMatchedProvider({
              name: p.name || p.business_name || 'Professional',
              trade: p.trade || 'Service Pro',
              distance: Math.round(distance * 10) / 10,
              eta,
              lat: p.lat,
              lng: p.lng,
              rating: p.rating || 4.8,
            })
            setCallStatus('dispatched')
            
            // Play success sound
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
              const playTone = (freq: number, duration: number, startTime: number) => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                oscillator.frequency.value = freq
                oscillator.type = 'sine'
                gainNode.gain.setValueAtTime(0.12, startTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
                oscillator.start(startTime)
                oscillator.stop(startTime + duration)
              }
              // Play ascending success tones (C5, E5, G5)
              const now = audioContext.currentTime
              playTone(523, 0.12, now)       // C5
              playTone(659, 0.12, now + 0.1) // E5
              playTone(784, 0.2, now + 0.2)  // G5
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Failed to fetch provider:', e)
      }
      
      // 6. Trigger dispatch
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      
      // 7. Navigate to tracking after showing provider animation
      setTimeout(() => {
        if (onRequestCreated) {
          onRequestCreated(requestId)
        }
        setCallStatus('idle')
        setMatchedProvider(null)
      }, 4000) // Give time to see the provider info
      
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
        {/* Map takes upper portion, leaves room for larger bottom panel */}
        <div className="relative flex-1 min-h-0 max-h-[calc(100dvh-320px)]">
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
              
              {/* Provider dispatched state */}
              {callStatus === 'dispatched' && matchedProvider ? (
                <>
                  {/* Connection animation */}
                  <div className="relative w-full max-w-[280px] mb-8">
                    {/* Client marker */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#8FB34A] flex items-center justify-center shadow-lg shadow-[#8FB34A]/30">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <span className="text-[10px] text-white/70 mt-1.5 font-medium">You</span>
                    </div>
                    
                    {/* Animated connection line */}
                    <div className="absolute left-14 right-14 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-gradient-to-r from-[#8FB34A] to-[#BFFF4D] rounded-full animate-[slideRight_1.5s_ease-in-out_infinite]" />
                    </div>
                    
                    {/* Provider marker */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#BFFF4D] flex items-center justify-center shadow-lg shadow-[#BFFF4D]/30">
                        <svg className="w-6 h-6 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>
                      </div>
                      <span className="text-[10px] text-white/70 mt-1.5 font-medium">Pro</span>
                    </div>
                  </div>
                  
                  {/* Provider info */}
                  <div className="text-center mb-6">
                    <p className="text-[#BFFF4D] font-bold text-xl mb-1">{matchedProvider.name}</p>
                    <p className="text-white/60 text-sm capitalize">{matchedProvider.trade}</p>
                    {matchedProvider.rating && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span className="text-white/80 text-sm font-medium">{matchedProvider.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Distance and ETA */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-white font-bold text-2xl">{matchedProvider.distance}<span className="text-sm ml-1">km</span></p>
                      <p className="text-white/50 text-xs">Distance</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                      <p className="text-white font-bold text-2xl">{matchedProvider.eta}<span className="text-sm ml-1">min</span></p>
                      <p className="text-white/50 text-xs">ETA</p>
                    </div>
                  </div>
                  
                  {/* Status message */}
                  <p className="text-[#8FB34A] text-sm font-medium mt-6 animate-pulse">Dispatching to your location...</p>
                </>
              ) : (
                <>
                  {/* Pulsing rings */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 -m-8 rounded-full bg-[#8FB34A]/20 animate-ping" />
                    <div className="absolute inset-0 -m-4 rounded-full bg-[#8FB34A]/30 animate-pulse" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#8FB34A] to-[#6B8C2F] shadow-xl shadow-[#8FB34A]/30">
                      <Phone className={cn("h-8 w-8 text-white", callStatus === 'ringing' && "animate-[wiggle_0.5s_ease-in-out_infinite]")} />
                    </div>
                  </div>
                  
                  {/* Status text */}
                  <p className="text-white font-bold text-lg mb-1">
                    {callStatus === 'connecting' && 'Connecting...'}
                    {callStatus === 'ringing' && 'Calling you now...'}
                    {callStatus === 'active' && 'Aria is on the line'}
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
                </>
              )}
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
        <div className="shrink-0 bg-white border-t border-[#E2E8F0]/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 pt-4 pb-[84px]">
          
          {/* Row 1: Name and Language */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 pl-1">Your name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="First name"
                data-no-focus-ring
                className="w-full h-[52px] px-4 rounded-2xl bg-[#F8FAFB] border-2 border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#8FB34A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(143,179,74,0.1)] transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 pl-1">Language</label>
              <LanguageDropdown value={language} onChange={setLanguage} />
            </div>
          </div>

          {/* Row 2: Describe Problem - Full width, taller */}
          <div className="mb-3">
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 pl-1">Describe your problem</label>
            <div
              className={cn(
                'flex items-center h-[52px] w-full rounded-2xl bg-[#F8FAFB] border-2 transition-all duration-200',
                'border-[#E2E8F0] focus-within:border-[#8FB34A] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(143,179,74,0.1)]'
              )}
            >
              <div className="flex items-center h-full pl-2 gap-1 shrink-0 border-r border-[#E2E8F0]/80">
                {(['voice', 'photo', 'text'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    data-no-focus-ring
                    onClick={() => { setInputMode(mode); if (mode !== 'voice') { stopRecording(); setAudioBlob(null); } }}
                    className={cn(
                      'flex items-center justify-center h-[36px] w-[36px] rounded-xl transition-all duration-200 outline-none',
                      inputMode === mode
                        ? 'bg-[#8FB34A] text-white shadow-md'
                        : 'text-[#94A3B8] hover:text-[#64748B] hover:bg-white',
                      mode === 'text' && 'mr-1'
                    )}
                    aria-label={`${mode} input`}
                  >
                    {mode === 'voice' && <Mic className="h-4 w-4" strokeWidth={2} />}
                    {mode === 'photo' && <Camera className="h-4 w-4" strokeWidth={2} />}
                    {mode === 'text' && <Type className="h-4 w-4" strokeWidth={2} />}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-0 h-full flex items-center px-3">
                {inputMode === 'text' && (
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    type="text"
                    data-no-focus-ring
                    placeholder="e.g. Leaking pipe under sink..."
                    className="w-full h-full bg-transparent text-[15px] font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                  />
                )}
                {inputMode === 'voice' && (
<button type="button" data-no-focus-ring onClick={toggleRecording} className="flex items-center gap-3 w-full outline-none">
  <span className={cn('relative flex h-6 w-6 items-center justify-center', isRecording && 'animate-pulse')}>
  {isRecording && <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />}
  <span className={cn('relative h-3 w-3 rounded-full transition-colors', isRecording ? 'bg-red-500' : audioBlob ? 'bg-[#8FB34A]' : 'bg-[#94A3B8]')} />
  </span>
  <span className={cn('text-[15px] font-medium', isRecording ? 'text-red-500' : audioBlob ? 'text-[#8FB34A]' : 'text-[#94A3B8]')}>
                      {isRecording ? 'Recording...' : audioBlob ? 'Recording saved' : 'Tap to speak'}
                    </span>
                  </button>
                )}
                {inputMode === 'photo' && (
                  <div className="flex items-center gap-4 w-full">
                    {uploadedFile ? (
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-[14px] font-semibold text-[#8FB34A] truncate max-w-[140px]">{uploadedFile.name}</span>
                        <button type="button" onClick={() => setUploadedFile(null)} className="text-[13px] text-[#94A3B8] hover:text-red-500 font-medium">Remove</button>
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                          <Upload className="h-4 w-4 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2} />
                          <span className="text-[14px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]) }}
                          />
                        </label>
                        <span className="text-[#CBD5E1]">|</span>
                        <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                          <Camera className="h-4 w-4 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2} />
                          <span className="text-[14px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Camera</span>
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

          {/* Row 3: Phone number - Full width */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 pl-1">Phone number</label>
            <MobilePhoneInput
              country={country}
              onCountryChange={setCountry}
              phone={phone}
              onPhoneChange={setPhone}
            />
          </div>

          {/* Row 4: Call Aria button - Full width, prominent */}
          <button
            type="button"
            data-no-focus-ring
            onClick={callAria}
            disabled={callingAria}
            className="w-full flex items-center justify-center gap-2.5 h-[56px] rounded-2xl bg-gradient-to-r from-[#8FB34A] to-[#7DA33F] text-white text-[17px] font-bold shadow-[0_4px_20px_rgba(143,179,74,0.4)] transition-all hover:shadow-[0_6px_28px_rgba(143,179,74,0.5)] active:scale-[0.98] outline-none disabled:opacity-60"
          >
            <Phone className={cn("h-5 w-5", callingAria && "animate-pulse")} strokeWidth={2.5} />
            {callingAria ? 'Calling Aria...' : 'Call Aria'}
          </button>
        </div>
      </div>

      {/* ─── DESKTOP: Premium two-column layout ─── */}
      <div className="hidden sm:grid sm:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr] sm:gap-5 sm:pb-8" style={{ height: 'calc(100% - 16px)' }}>
        
        {/* Left Panel - Request Form */}
        <div className="flex flex-col h-full">
          {/* Form Card - Same height as map */}
          <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#E2E8F0]/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5">
            
            {/* Name and Language row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Your name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="First name"
                  data-no-focus-ring
                  className="w-full h-[48px] px-4 rounded-xl bg-[#F8FAFB] border-2 border-[#E2E8F0] text-[14px] font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#8FB34A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(143,179,74,0.08)] transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Language</label>
                <LanguageDropdown value={language} onChange={setLanguage} />
              </div>
            </div>

            {/* Describe Problem */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Describe your problem</label>
              <div
                className={cn(
                  'flex items-center h-[48px] w-full rounded-xl bg-[#F8FAFB] border-2 transition-all duration-200',
                  'border-[#E2E8F0] focus-within:border-[#8FB34A] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(143,179,74,0.08)]'
                )}
              >
                <div className="flex items-center h-full pl-1.5 gap-1 shrink-0 border-r border-[#E2E8F0]/80">
                  {(['voice', 'photo', 'text'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      data-no-focus-ring
                      onClick={() => { setInputMode(mode); if (mode !== 'voice') { stopRecording(); setAudioBlob(null); } }}
                      className={cn(
                        'flex items-center justify-center h-[32px] w-[32px] rounded-lg transition-all duration-200 outline-none',
                        inputMode === mode
                          ? 'bg-[#8FB34A] text-white shadow-sm'
                          : 'text-[#94A3B8] hover:text-[#64748B] hover:bg-white',
                        mode === 'text' && 'mr-0.5'
                      )}
                      aria-label={`${mode} input`}
                    >
                      {mode === 'voice' && <Mic className="h-4 w-4" strokeWidth={2} />}
                      {mode === 'photo' && <Camera className="h-4 w-4" strokeWidth={2} />}
                      {mode === 'text' && <Type className="h-4 w-4" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-w-0 h-full flex items-center px-3">
                  {inputMode === 'text' && (
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      type="text"
                      data-no-focus-ring
                      placeholder="e.g. Leaking pipe under sink..."
                      className="w-full h-full bg-transparent text-[14px] font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                    />
                  )}
                  {inputMode === 'voice' && (
<button type="button" data-no-focus-ring onClick={toggleRecording} className="flex items-center gap-2.5 w-full outline-none">
  <span className={cn('relative flex h-5 w-5 items-center justify-center', isRecording && 'animate-pulse')}>
  {isRecording && <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />}
  <span className={cn('relative h-2.5 w-2.5 rounded-full transition-colors', isRecording ? 'bg-red-500' : audioBlob ? 'bg-[#8FB34A]' : 'bg-[#94A3B8]')} />
  </span>
  <span className={cn('text-[14px] font-medium', isRecording ? 'text-red-500' : audioBlob ? 'text-[#8FB34A]' : 'text-[#94A3B8]')}>
  {isRecording ? 'Recording...' : audioBlob ? 'Recording saved' : 'Click to speak'}
                      </span>
                    </button>
                  )}
                  {inputMode === 'photo' && (
                    <div className="flex items-center gap-3 w-full">
                      {uploadedFile ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[13px] font-semibold text-[#8FB34A] truncate max-w-[160px]">{uploadedFile.name}</span>
                          <button type="button" onClick={() => setUploadedFile(null)} className="text-[12px] text-[#94A3B8] hover:text-red-500 font-medium">Remove</button>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-center gap-1.5 cursor-pointer group whitespace-nowrap">
                            <Upload className="h-4 w-4 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2} />
                            <span className="text-[13px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Upload</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]) }}
                            />
                          </label>
                          <span className="text-[#CBD5E1]">|</span>
                          <label className="flex items-center gap-1.5 cursor-pointer group whitespace-nowrap">
                            <Camera className="h-4 w-4 text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors" strokeWidth={2} />
                            <span className="text-[13px] font-medium text-[#94A3B8] group-hover:text-[#8FB34A] transition-colors">Camera</span>
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

            {/* Phone Number */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Phone number</label>
              <div className="relative">
                <CountryPhoneInput country={country} onCountryChange={setCountry} phone={phone} onPhoneChange={setPhone} />
              </div>
            </div>

            {/* GPS Toggle */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Location</label>
              <button
                type="button"
                data-no-focus-ring
                onClick={() => setIsLiveLocation(v => !v)}
                className={cn(
                  'flex items-center justify-between w-full h-[48px] px-4 rounded-xl border-2 transition-all outline-none',
                  isLiveLocation
                    ? 'border-[#8FB34A] bg-[#EAF4D8]/40'
                    : 'border-[#E2E8F0] bg-[#F8FAFB] hover:border-[#CBD5E1]'
                )}
              >
                <div className="flex items-center gap-3">
                  <LocateFixed className={cn('h-5 w-5 transition-colors', isLiveLocation ? 'text-[#8FB34A]' : 'text-[#94A3B8]')} strokeWidth={2} />
                  <span className="text-[14px] font-semibold text-[#334155]">Use my GPS location</span>
                </div>
                <div className={cn('relative inline-flex h-[24px] w-[44px] items-center rounded-full transition-colors duration-200', isLiveLocation ? 'bg-[#8FB34A]' : 'bg-[#CBD5E1]')}>
                  <span className={cn('inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-sm transition-transform duration-200', isLiveLocation ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
                </div>
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Validation Error */}
            {validationError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>{validationError}</span>
              </div>
            )}

            {/* Call Aria Button */}
            <button
              type="button"
              data-no-focus-ring
              onClick={callAria}
              disabled={callingAria}
              className="w-full flex items-center justify-center gap-3 h-[56px] px-6 rounded-2xl bg-gradient-to-r from-[#8FB34A] to-[#7DA33F] text-white text-[17px] font-bold shadow-[0_4px_20px_rgba(143,179,74,0.35)] transition-all hover:shadow-[0_6px_28px_rgba(143,179,74,0.45)] hover:translate-y-[-1px] active:translate-y-0 active:scale-[0.99] outline-none disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <Phone className={cn("h-5 w-5", callingAria && "animate-[wiggle_0.5s_ease-in-out_infinite]")} strokeWidth={2.5} />
              {callingAria ? 'Calling Aria...' : 'Call Aria'}
            </button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#E2E8F0]/60">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <svg className="h-3.5 w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                <span className="font-semibold">Verified Pros</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <svg className="h-3.5 w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-semibold">Fast Response</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <svg className="h-3.5 w-3.5 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                <span className="font-semibold">Secure Payment</span>
              </div>
            </div>

            {/* Aria AI branding - centered in card */}
            <div className="mt-4 pt-3 border-t border-[#E2E8F0]/40">
              <p className="text-[12px] text-[#94A3B8] text-center leading-relaxed">
                Powered by <span className="font-bold text-[#8FB34A]">Aria AI</span> - Your 24/7 assistant
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 h-full relative rounded-3xl overflow-hidden shadow-[0_12px_48px_rgba(15,23,42,0.08),0_0_0_1px_rgba(226,232,240,0.5)] isolate">
          <GoogleMap
            center={coords || undefined}
            zoom={14}
            markers={markers}
            className="h-full w-full"
          />

          {/* Recenter button */}
          <button
            data-no-focus-ring
            onClick={requestLocation}
            className="absolute top-5 left-5 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-white/60 transition-all hover:scale-105 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] active:scale-95 text-[#334155] outline-none"
            aria-label="Use my current GPS location"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-[#E2E8F0] border-t-[#8FB34A]" />
            ) : (
              <LocateFixed className="h-5 w-5" strokeWidth={2} />
            )}
          </button>

          {/* Status badge */}
          {!loading && !error && (
            <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-white/60">
              <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-[#8FB34A] text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <span className="block text-[13px] font-bold text-[#0F172A]">Providers nearby</span>
                <span className="block text-[11px] text-[#64748B]">Track your pro on map</span>
              </div>
            </div>
          )}

          {/* Error toast */}
          {error && isLiveLocation && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 rounded-2xl border border-amber-200 bg-amber-50/95 backdrop-blur-md px-5 py-3 text-[13px] font-semibold text-amber-800 flex items-center gap-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] max-w-md">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Calling Aria overlay - premium animation */}
          {callStatus !== 'idle' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-[#0F172A]/95 to-[#1E293B]/95 backdrop-blur-xl rounded-3xl">
              
              {/* Provider dispatched state */}
              {callStatus === 'dispatched' && matchedProvider ? (
                <>
                  {/* Connection animation - larger for desktop */}
                  <div className="relative w-full max-w-[400px] mb-10">
                    {/* Client marker */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-[#8FB34A] flex items-center justify-center shadow-lg shadow-[#8FB34A]/30">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <span className="text-xs text-white/70 mt-2 font-medium">You</span>
                    </div>
                    
                    {/* Animated connection line */}
                    <div className="absolute left-20 right-20 top-1/2 -translate-y-1/2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-[#8FB34A] to-[#BFFF4D] rounded-full animate-[slideRight_1.5s_ease-in-out_infinite]" />
                    </div>
                    
                    {/* Provider marker */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-[#BFFF4D] flex items-center justify-center shadow-lg shadow-[#BFFF4D]/30">
                        <svg className="w-8 h-8 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>
                      </div>
                      <span className="text-xs text-white/70 mt-2 font-medium">Pro</span>
                    </div>
                  </div>
                  
                  {/* Provider info */}
                  <div className="text-center mb-8">
                    <p className="text-[#BFFF4D] font-bold text-2xl mb-1">{matchedProvider.name}</p>
                    <p className="text-white/60 text-base capitalize">{matchedProvider.trade}</p>
                    {matchedProvider.rating && (
                      <div className="flex items-center justify-center gap-1.5 mt-3">
                        <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span className="text-white/80 text-base font-medium">{matchedProvider.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Distance and ETA - larger */}
                  <div className="flex items-center gap-10 bg-white/5 rounded-2xl px-8 py-5">
                    <div className="text-center">
                      <p className="text-white font-bold text-3xl">{matchedProvider.distance}<span className="text-base ml-1">km</span></p>
                      <p className="text-white/50 text-sm mt-1">Distance</p>
                    </div>
                    <div className="w-px h-14 bg-white/20" />
                    <div className="text-center">
                      <p className="text-white font-bold text-3xl">{matchedProvider.eta}<span className="text-base ml-1">min</span></p>
                      <p className="text-white/50 text-sm mt-1">ETA</p>
                    </div>
                  </div>
                  
                  {/* Status message */}
                  <p className="text-[#8FB34A] text-base font-medium mt-8 animate-pulse">Dispatching to your location...</p>
                </>
              ) : (
                <>
                  {/* Animated rings */}
                  <div className="relative mb-10">
                    <div className="absolute inset-0 -m-16 rounded-full border-2 border-[#8FB34A]/20 animate-[ping_2s_ease-out_infinite]" />
                    <div className="absolute inset-0 -m-12 rounded-full border-2 border-[#8FB34A]/30 animate-[ping_2s_ease-out_infinite_0.5s]" />
                    <div className="absolute inset-0 -m-8 rounded-full bg-[#8FB34A]/10 animate-pulse" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#8FB34A] to-[#6B8C2F] shadow-[0_0_60px_rgba(143,179,74,0.4)]">
                      <Phone className={cn(
                        "h-12 w-12 text-white transition-transform duration-300",
                        callStatus === 'ringing' && "animate-[wiggle_0.5s_ease-in-out_infinite]",
                        callStatus === 'active' && "animate-pulse"
                      )} />
                    </div>
                  </div>
                  
                  {/* Status text */}
                  <p className="text-white font-bold text-2xl mb-2 tracking-tight">
                    {callStatus === 'connecting' && 'Connecting...'}
                    {callStatus === 'ringing' && 'Calling you now...'}
                    {callStatus === 'active' && 'Aria is on the line'}
                  </p>
                  <p className="text-white/50 text-sm font-medium">
                    {callStatus === 'connecting' && 'Setting up your request'}
                    {callStatus === 'ringing' && 'Please answer the incoming call'}
                    {callStatus === 'active' && 'Describe your problem to Aria'}
                  </p>
                  
                  {/* Sound wave animation */}
                  <div className="flex items-end gap-1 mt-10 h-8">
                    {[0, 1, 2, 3, 4, 5, 6].map(i => (
                      <div
                        key={i}
                        className="w-1 bg-[#8FB34A] rounded-full transition-all duration-150"
                        style={{ 
                          height: callStatus === 'active' ? `${12 + Math.sin(Date.now() / 200 + i) * 16}px` : '4px',
                          animationDelay: `${i * 100}ms`,
                          opacity: callStatus === 'active' ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
