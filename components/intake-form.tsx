'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  MapPin, Building2, ChevronRight, AlertTriangle, Clock, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RequestFormData, ServiceType, EmergencyLevel } from '@/lib/store'
import { SERVICE_OPTIONS, EMERGENCY_OPTIONS, createEmptyForm } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

/* ---- Beautiful service icons as inline SVGs for crisp rendering ---- */
function PlumbingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6m0 0a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3m0-7a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3m0 0v7" />
      <path d="M6 8h12" />
    </svg>
  )
}

function ElectricalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function HvacIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9a4 4 0 0 0-2 7.5" />
      <path d="M12 3v2" />
      <path d="m6.6 18.4-1.4 1.4" />
      <path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      <path d="M4 13H2" />
      <path d="M6.34 7.34 4.93 5.93" />
    </svg>
  )
}

function LocksmithIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m12 9.5 3.5-3.5" />
      <path d="m15.5 6 2.14 2.14" />
      <path d="m18 3-4.5 4.5" />
      <path d="m14.5 11-1-1" />
    </svg>
  )
}

function ApplianceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z" />
      <path d="M9 6h6" />
      <path d="M12 10v6" />
      <path d="M9 13h6" />
    </svg>
  )
}

function RoofingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function GlassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <line x1="3" x2="21" y1="3" y2="21" />
      <path d="m21 3-8 8" />
      <path d="m11 13-8 8" />
    </svg>
  )
}

function PestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  )
}

const SERVICE_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Droplets: PlumbingIcon,
  Zap: ElectricalIcon,
  Thermometer: HvacIcon,
  KeyRound: LocksmithIcon,
  Refrigerator: ApplianceIcon,
  Home: RoofingIcon,
  Square: GlassIcon,
  Bug: PestIcon,
}

const EMERGENCY_ICONS: Record<EmergencyLevel, typeof AlertTriangle> = {
  emergency: AlertTriangle,
  urgent: Clock,
  standard: CalendarDays,
}

const EMERGENCY_COLORS: Record<EmergencyLevel, { ring: string; bg: string; icon: string }> = {
  emergency: {
    ring: 'ring-red-200 border-red-300',
    bg: 'bg-red-50',
    icon: 'text-red-500',
  },
  urgent: {
    ring: 'ring-amber-200 border-amber-300',
    bg: 'bg-amber-50',
    icon: 'text-amber-500',
  },
  standard: {
    ring: 'ring-primary/20 border-primary/40',
    bg: 'bg-secondary',
    icon: 'text-primary',
  },
}

const LANGUAGES = [
  'English', 'French', 'Spanish', 'Arabic', 'Portuguese', 'Hindi', 'Mandarin',
  'German', 'Japanese', 'Korean', 'Italian', 'Dutch', 'Polish', 'Turkish',
  'Swedish', 'Indonesian', 'Filipino', 'Romanian', 'Ukrainian', 'Greek',
  'Czech', 'Danish', 'Finnish', 'Bulgarian', 'Croatian', 'Slovak', 'Tamil', 'Malay',
]

function LanguageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Language</label>
      <button type="button" onClick={() => setOpen(!open)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-2xl border px-3 text-sm font-medium transition-all cursor-pointer',
          open
            ? 'border-[#8FB34A] bg-white ring-2 ring-[#8FB34A]/20'
            : 'border-border/60 bg-muted/40 hover:border-border'
        )}>
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          {value}
        </span>
        <svg className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-48 overflow-y-auto rounded-2xl border border-border/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ scrollbarWidth: 'thin' }}>
          {LANGUAGES.map(lang => (
            <button key={lang} type="button"
              onClick={() => { onChange(lang); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors',
                lang === value
                  ? 'bg-[#EAF4D8] font-semibold text-[#3a5e10]'
                  : 'text-foreground hover:bg-muted/50'
              )}>
              {lang}
              {lang === value && (
                <svg className="h-4 w-4 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface IntakeFormProps {
  onSubmit: (form: RequestFormData) => void
}

export function IntakeForm({ onSubmit }: IntakeFormProps) {
  const [form, setForm] = useState<RequestFormData>(createEmptyForm())
  const [step, setStep] = useState(0)

  const update = useCallback(
    <K extends keyof RequestFormData>(key: K, value: RequestFormData[K]) => {
      setForm(prev => ({ ...prev, [key]: value }))
    },
    []
  )

  const canSubmit =
    form.address.trim().length > 0 &&
    form.service !== null &&
    form.emergencyLevel !== null &&
    form.consent

  const handleSubmit = () => {
    if (canSubmit) onSubmit(form)
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-3xl bg-white/70 backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] sm:p-8">

        {/* Address */}
        <div className="mb-6">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Your address
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary" />
            <Input
              placeholder="Enter your address"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              onFocus={() => setStep(0)}
              className="h-13 rounded-2xl border-border/60 bg-muted/40 pl-11 text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60"
            />
          </div>
        </div>

        {/* Phone + Language — compact row */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Phone</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              <Input type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={e => update('phone', e.target.value)} autoComplete="tel"
                className="h-12 rounded-2xl border-border/60 bg-muted/40 pl-9 text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/30" />
            </div>
          </div>
          <LanguageDropdown value={form.language} onChange={v => update('language', v)} />
        </div>

        {/* Service selection -- polished cards */}
        <div className="mb-6">
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            What do you need?
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {SERVICE_OPTIONS.map(({ type, label, icon }) => {
              const Icon = SERVICE_ICON_MAP[icon] || PlumbingIcon
              const isSelected = form.service === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => { update('service', type); setStep(2) }}
                  className={cn(
                    'group relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'border-primary bg-secondary ring-2 ring-primary/20 shadow-[0_4px_20px_rgba(143,179,74,0.15)]'
                      : 'border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                  )}
                >
                  <div className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200',
                    isSelected
                      ? 'bg-primary shadow-sm'
                      : 'bg-muted/70 group-hover:bg-secondary'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                    )} />
                  </div>
                  <span className={cn(
                    'text-xs font-semibold transition-colors duration-200',
                    isSelected ? 'text-secondary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}>{label}</span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-sm">
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Emergency level -- color-coded */}
        <div className="mb-6">
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            How urgent?
          </label>
          <div className="flex gap-2.5">
            {EMERGENCY_OPTIONS.map(({ level, label, sublabel }) => {
              const Icon = EMERGENCY_ICONS[level]
              const colors = EMERGENCY_COLORS[level]
              const isSelected = form.emergencyLevel === level
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => { update('emergencyLevel', level); setStep(3) }}
                  className={cn(
                    'group flex flex-1 flex-col items-center gap-1.5 rounded-2xl border py-4 transition-all duration-200 cursor-pointer',
                    isSelected
                      ? `${colors.ring} ring-2 shadow-sm ${colors.bg}`
                      : 'border-border/50 bg-card hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                    isSelected ? colors.bg : 'bg-muted/60'
                  )}>
                    <Icon className={cn(
                      'h-4 w-4 transition-colors',
                      isSelected ? colors.icon : 'text-muted-foreground'
                    )} />
                  </div>
                  <span className={cn(
                    'text-xs font-bold',
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  )}>{label}</span>
                  <span className="text-[10px] text-muted-foreground">{sublabel}</span>
                </button>
              )
            })}
          </div>
        </div>


        {/* Description */}
        <div className="mb-6">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {"What's happening?"}
          </label>
          <Textarea
            placeholder="Briefly describe the issue..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={2}
            className="resize-none rounded-2xl text-sm bg-muted/40 border-border/60 placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>

        {/* Consent Checkbox */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-5 items-center">
            <input
              id="consent"
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update('consent', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
            />
          </div>
          <label htmlFor="consent" className="text-xs leading-tight text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            I agree to the <a href="/terms" className="underline hover:text-primary transition-colors">Terms of Service</a> and <a href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>, and I consent to being contacted at the phone number provided above via SMS and voice calls.
          </label>
        </div>

        {/* CTA */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_6px_24px_rgba(143,179,74,0.3)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_8px_32px_rgba(143,179,74,0.4)] hover:-translate-y-0.5 disabled:opacity-40 disabled:shadow-none disabled:translate-y-0"
        >
          Request help
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
