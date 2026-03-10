'use client'

import { cn } from '@/lib/utils'

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

function RoofingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
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

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

const SERVICES = [
  { label: 'Plumbing', icon: PlumbingIcon },
  { label: 'Electrical', icon: ElectricalIcon },
  { label: 'HVAC', icon: HvacIcon },
  { label: 'Locksmith', icon: LocksmithIcon },
  { label: 'Roofing', icon: RoofingIcon },
  { label: 'Pest Control', icon: PestIcon },
  { label: 'Appliance Repair', icon: WrenchIcon },
  { label: 'Security', icon: ShieldIcon },
]

function ServiceCard({ label, icon: Icon }: { label: string; icon: React.FC<{ className?: string }> }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 glass-card-v2 hover:bg-white/[0.06]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8E64C]/10 shadow-[0_0_12px_rgba(200,230,76,0.1)]">
        <Icon className="h-4.5 w-4.5 text-[#C8E64C]" />
      </div>
      <span className="text-sm font-semibold whitespace-nowrap text-white/80">{label}</span>
    </div>
  )
}

export function ServicesTicker({ variant }: { variant?: 'dark' | 'light' }) {
  const doubled = [...SERVICES, ...SERVICES]

  return (
    <section className="w-full overflow-hidden py-4" aria-label="Available services">
      <div className="flex gap-3 animate-ticker" style={{ width: 'max-content' }}>
        {doubled.map((s, i) => (
          <ServiceCard key={`${s.label}-${i}`} label={s.label} icon={s.icon} />
        ))}
      </div>
    </section>
  )
}
