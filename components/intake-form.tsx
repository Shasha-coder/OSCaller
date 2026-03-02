'use client'

import { useState, useCallback } from 'react'
import {
  MapPin, Building2, Droplets, Zap, Thermometer, KeyRound,
  Home, Bug, Square, Refrigerator, ChevronRight, AlertTriangle, Clock, CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RequestFormData, ServiceType, EmergencyLevel } from '@/lib/store'
import { SERVICE_OPTIONS, EMERGENCY_OPTIONS, createEmptyForm } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const ICON_MAP: Record<string, typeof Droplets> = {
  Droplets, Zap, Thermometer, KeyRound, Home, Bug, Square, Refrigerator,
}

const EMERGENCY_ICONS: Record<EmergencyLevel, typeof AlertTriangle> = {
  emergency: AlertTriangle,
  urgent: Clock,
  standard: CalendarDays,
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
    form.emergencyLevel !== null

  const handleSubmit = () => {
    if (canSubmit) onSubmit(form)
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-3xl bg-card p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)] sm:p-8">
        {/* Step 1: Address */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your address
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter your address"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              onFocus={() => setStep(0)}
              className="h-12 rounded-2xl border-border bg-background pl-11 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Apartment toggle */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-background px-4 py-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="apartment-toggle" className="text-sm font-medium text-foreground cursor-pointer">
              Apartment / Building
            </Label>
          </div>
          <Switch
            id="apartment-toggle"
            checked={form.isApartment}
            onCheckedChange={v => update('isApartment', v)}
          />
        </div>

        {form.isApartment && (
          <div className="mb-6 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Input
              placeholder="Building name"
              value={form.buildingName}
              onChange={e => update('buildingName', e.target.value)}
              className="h-11 flex-1 rounded-2xl text-sm"
            />
            <Input
              placeholder="Unit #"
              value={form.unitNumber}
              onChange={e => update('unitNumber', e.target.value)}
              className="h-11 w-24 rounded-2xl text-sm"
            />
          </div>
        )}

        {/* Step 2: Service selection */}
        <div className="mb-6">
          <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What do you need?
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SERVICE_OPTIONS.map(({ type, label, icon }) => {
              const Icon = ICON_MAP[icon] || Droplets
              const isSelected = form.service === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => { update('service', type); setStep(2) }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-secondary text-primary shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-secondary/50'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 3: Emergency level */}
        <div className="mb-6">
          <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            How urgent?
          </label>
          <div className="flex gap-2">
            {EMERGENCY_OPTIONS.map(({ level, label, sublabel }) => {
              const Icon = EMERGENCY_ICONS[level]
              const isSelected = form.emergencyLevel === level
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => { update('emergencyLevel', level); setStep(3) }}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-2xl border py-3 transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-secondary text-primary shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{sublabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 4: Description */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {"What's happening?"}
          </label>
          <Textarea
            placeholder="Briefly describe the issue..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={2}
            className="resize-none rounded-2xl text-sm placeholder:text-muted-foreground/60"
          />
        </div>

        {/* CTA */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:shadow-none"
        >
          Request help
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
