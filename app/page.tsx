'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { AppPage, RequestFormData, ServiceRequest } from '@/lib/store'
import { OSSymbol, OSCallerWordmark } from '@/components/os-logo'
import { AppSidebar } from '@/components/app-sidebar'
import { IntakeForm } from '@/components/intake-form'
import { ServicesTicker } from '@/components/services-ticker'
import { TrackingPage } from '@/components/tracking-page'
import { HistoryPage } from '@/components/history-page'
import { SupportPage } from '@/components/support-page'
import { MapPage } from '@/components/map-page'
import { SearchPage } from '@/components/search-page'

const PAGE_ORDER: AppPage[] = ['home', 'tracking', 'history', 'support', 'map', 'search']

export default function Root() {
  const [active, setActive]       = useState<AppPage>('home')
  const [exiting, setExiting]     = useState<AppPage | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [request, setRequest]     = useState<ServiceRequest | null>(null)

  const navigate = useCallback((target: AppPage) => {
    if (target === active || exiting) return
    const fromIdx = PAGE_ORDER.indexOf(active)
    const toIdx   = PAGE_ORDER.indexOf(target)
    setDirection(toIdx > fromIdx ? 1 : -1)
    setExiting(active)
    setActive(target)
    setTimeout(() => setExiting(null), 420)
  }, [active, exiting])

  const handleSubmit = useCallback((form: RequestFormData) => {
    setRequest({
      id: `req-${Date.now()}`,
      form,
      status: 'submitted',
      timeline: [],
      createdAt: new Date(),
      paymentStatus: 'none',
    })
    navigate('tracking')
  }, [navigate])

  const handleCancel = useCallback(() => {
    setRequest(null)
    navigate('home')
  }, [navigate])

  const EASE = 'cubic-bezier(0.32,0.72,0,1)'
  const DUR  = '420ms'

  const inAnim  = direction === 1
    ? `slideInUp ${DUR} ${EASE} both`
    : `slideInDown ${DUR} ${EASE} both`
  const outAnim = direction === 1
    ? `slideOutUp ${DUR} ${EASE} both`
    : `slideOutDown ${DUR} ${EASE} both`

  return (
    <div className="relative flex h-dvh w-full overflow-hidden" style={{ backgroundColor: '#8FB34A' }}>

      {/* EXITING page */}
      {exiting && (
        <div
          key={`exit-${exiting}`}
          className="absolute inset-0"
          style={{ zIndex: 1, animation: outAnim, willChange: 'transform' }}
        >
          <PageContent page={exiting} request={request} navigate={navigate} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      )}

      {/* ENTERING page */}
      <div
        key={`enter-${active}`}
        className="absolute inset-0"
        style={{ zIndex: 2, animation: exiting ? inAnim : 'none', willChange: 'transform' }}
      >
        <PageContent page={active} request={request} navigate={navigate} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>

      {/* Sidebar always on top */}
      <div className="pointer-events-none absolute inset-0 z-50">
        <div className="pointer-events-auto absolute right-0 top-0 h-full">
          <AppSidebar currentPage={active} onNavigate={navigate} isHomePage={active === 'home'} />
        </div>
      </div>
    </div>
  )
}

// ─── Hero icons ──────────────────────────────────────────────
function HeroIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
      {children}
    </div>
  )
}

// ─── Page content renderer ───────────────────────────────────
function PageContent({ page, request, navigate, onSubmit, onCancel }: {
  page: AppPage
  request: ServiceRequest | null
  navigate: (p: AppPage) => void
  onSubmit: (f: RequestFormData) => void
  onCancel: () => void
}) {
  const isHome = page === 'home'

  return (
    <div className={cn('flex h-dvh w-full flex-col overflow-hidden', !isHome && 'bg-[#F6F8F4]')}>

      {/* ══ HOME ══ */}
      {isHome && (
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{ backgroundImage: "url('/bg1.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-12">
            <div className="flex flex-col items-center">
              <div style={{
                width: 192, height: 192, borderRadius: 38,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(255,255,255,0.28)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <OSSymbol className="h-32 w-32" color="#FFFFFF" />
              </div>
              <div
                className="mt-4 rounded-2xl px-10 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              >
                <OSCallerWordmark className="h-8 w-auto sm:h-10" color="#FFFFFF" />
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center gap-1 text-center">
              <p className="text-sm text-white/85 sm:text-[15px]">This is where help arrives fast, anytime</p>
              <p className="text-sm text-white/85 sm:text-[15px]">Pros get dispatched fast, anytime</p>
              <p className="text-sm text-white/55 sm:text-[15px]">Emergencies get handled fast</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom)]">
            <ServicesTicker variant="dark" />
          </div>
        </div>
      )}

      {/* ══ REQUEST FORM ══ */}
      {page === 'tracking' && !request && (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#1a2e06]">Request help</h1>
              <p className="mt-1 text-sm text-[#5a7040]">Select a service and we handle the rest.</p>
            </div>
          </div>
          <section className="flex flex-1 flex-col items-center px-5 pb-28 pt-2 sm:px-8">
            <IntakeForm onSubmit={onSubmit} />
          </section>
        </div>
      )}

      {/* ══ TRACKING ══ */}
      {page === 'tracking' && request && (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#1a2e06]">Live tracking</h1>
              <p className="mt-1 text-sm text-[#5a7040]">Your pro is being dispatched.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8">
            <TrackingPage request={request} onCancel={onCancel} />
          </div>
        </div>
      )}

      {/* ══ HISTORY ══ */}
      {page === 'history' && (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#1a2e06]">History</h1>
              <p className="mt-1 text-sm text-[#5a7040]">Your past requests and receipts.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8"><HistoryPage /></div>
        </div>
      )}

      {/* ══ SUPPORT ══ */}
      {page === 'support' && (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18.75h.008v.008H12v-.008Z" strokeWidth="2" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#1a2e06]">Support</h1>
              <p className="mt-1 text-sm text-[#5a7040]">We typically respond within minutes.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8"><SupportPage /></div>
        </div>
      )}

      {/* ══ MAP ══ */}
      {page === 'map' && (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#1a2e06]">Nearby Pros</h1>
              <p className="mt-1 text-sm text-[#5a7040]">Find professionals near your location.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8"><MapPage /></div>
        </div>
      )}

      {/* ══ SEARCH ══ */}
      {page === 'search' && (
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#1a2e06]">Search</h1>
              <p className="mt-1 text-sm text-[#5a7040]">Find any service or issue instantly.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8"><SearchPage /></div>
        </div>
      )}
    </div>
  )
}
