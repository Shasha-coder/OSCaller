'use client'

import { Droplets, Zap, Thermometer, KeyRound, Home, Bug, Wrench, ShieldCheck } from 'lucide-react'

const SERVICES = [
  { label: 'Plumbing', icon: Droplets },
  { label: 'Electrical', icon: Zap },
  { label: 'HVAC', icon: Thermometer },
  { label: 'Locksmith', icon: KeyRound },
  { label: 'Roofing', icon: Home },
  { label: 'Pest Control', icon: Bug },
  { label: 'Appliance Repair', icon: Wrench },
  { label: 'Security', icon: ShieldCheck },
]

function ServiceCard({ label, icon: Icon }: { label: string; icon: typeof Droplets }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{label}</span>
    </div>
  )
}

export function ServicesTicker() {
  const doubled = [...SERVICES, ...SERVICES]

  return (
    <section className="w-full overflow-hidden py-6" aria-label="Available services">
      <div className="flex gap-4 animate-ticker" style={{ width: 'max-content' }}>
        {doubled.map((s, i) => (
          <ServiceCard key={`${s.label}-${i}`} label={s.label} icon={s.icon} />
        ))}
      </div>
    </section>
  )
}
