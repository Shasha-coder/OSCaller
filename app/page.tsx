'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'
import type { AppPage, RequestFormData, ServiceRequest } from '@/lib/store'
import { OSSymbol, OSCallerWordmark } from '@/components/os-logo'
import { AppSidebar } from '@/components/app-sidebar'
import { IntakeForm } from '@/components/intake-form'
import { ServicesTicker } from '@/components/services-ticker'
import { HeroBackground } from '@/components/hero-background'
import { TrackingPage } from '@/components/tracking-page'
import { HistoryPage } from '@/components/history-page'
import { SupportPage } from '@/components/support-page'
import { MapPage } from '@/components/map-page'
import { SearchPage } from '@/components/search-page'
import { ServicePageBackground } from '@/components/service-bg-art'

const PAGE_ORDER: AppPage[] = ['home', 'tracking', 'history', 'support', 'map', 'search']

export default function Root() {
  const [active, setActive] = useState<AppPage>('home')
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const enterRef = useRef<HTMLDivElement>(null)
  const exitRef = useRef<HTMLDivElement>(null)
  const [exitPage, setExitPage] = useState<AppPage | null>(null)

  const navigate = useCallback((target: AppPage) => {
    if (target === active || isAnimating) return
    setIsAnimating(true)
    setExitPage(active)
    setActive(target)
  }, [active, isAnimating])

  /* GSAP animation trigger */
  useEffect(() => {
    if (!isAnimating || !enterRef.current) return

    const tl = gsap.timeline({
      onComplete: () => {
        setExitPage(null)
        setIsAnimating(false)
      }
    })

    // Enter: slide up from below with opacity
    tl.fromTo(
      enterRef.current,
      { y: '60%', opacity: 0, scale: 0.97 },
      { y: '0%', opacity: 1, scale: 1, duration: 0.5, ease: 'power4.out' },
      0
    )

    // Exit: fade + scale down
    if (exitRef.current) {
      tl.fromTo(
        exitRef.current,
        { y: '0%', opacity: 1, scale: 1 },
        { y: '-8%', opacity: 0, scale: 0.97, duration: 0.4, ease: 'power3.in' },
        0
      )
    }

    return () => { tl.kill() }
  }, [isAnimating, active])

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

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-white">

      {/* EXITING page (behind) */}
      {exitPage && (
        <div
          ref={exitRef}
          key={`exit-${exitPage}`}
          className="absolute inset-0"
          style={{ zIndex: 1, willChange: 'transform, opacity' }}
        >
          <PageContent page={exitPage} request={request} navigate={navigate} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      )}

      {/* ENTERING / ACTIVE page (front) */}
      <div
        ref={enterRef}
        key={`enter-${active}`}
        className="absolute inset-0"
        style={{ zIndex: 2, willChange: 'transform, opacity' }}
      >
        <PageContent page={active} request={request} navigate={navigate} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>

      {/* Sidebar always on top */}
      <div className="pointer-events-none absolute inset-0 z-50">
        <AppSidebar currentPage={active} onNavigate={navigate} isHomePage={active === 'home'} />
      </div>
    </div>
  )
}

// ─── Hero icons ──────────────────────────────────────────────
function HeroIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EAF4D8]">
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
    <div className={cn(
      'flex h-dvh w-full flex-col overflow-hidden relative z-10',
      !isHome && 'bg-[#F6F8F4]/80'
    )}>

      {/* SVG art background for service pages — renders at z-0, behind content */}
      {!isHome && <ServicePageBackground />}

      {/* ══ HOME ══ */}
      {isHome && (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          {/* Animated background — replaces static bg1.webp */}
          <HeroBackground />

          {/* Top trust indicators */}
          <div className="relative z-10 flex items-center justify-center gap-5 pt-[max(env(safe-area-inset-top),12px)] pb-2 px-6 text-[11px] font-medium text-white/50">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              24/7
            </span>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              GPS Tracked
            </span>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Licensed Pros
            </span>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
            <div className="flex flex-col items-center">
              {/* Logo with refined glassmorphism */}
              <div
                className="relative"
                style={{
                  width: 160, height: 160, borderRadius: 36,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <OSSymbol className="h-24 w-24" color="#FFFFFF" />
              </div>

              {/* Wordmark */}
              <div
                className="mt-5 rounded-2xl px-8 py-2.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <OSCallerWordmark className="h-7 w-auto sm:h-9" color="#FFFFFF" />
              </div>
            </div>

            {/* Tagline */}
            <div className="mt-8 flex flex-col items-center gap-2.5 text-center">
              <p className="text-lg font-bold text-white sm:text-xl tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                Get emergency help in minutes.
              </p>
              <p className="max-w-[300px] text-sm text-white/65 sm:text-[15px] leading-relaxed">
                Pros dispatched fast. Pre-authorized. Tracked live.
              </p>
            </div>

            {/* CTA button */}
            <button
              onClick={() => navigate('tracking')}
              className="mt-8 flex items-center gap-2.5 rounded-2xl bg-white/85 backdrop-blur-sm px-8 py-3.5 font-bold text-[#3a5e10] shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all hover:bg-white hover:shadow-[0_16px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Request a Pro Now
            </button>
          </div>

          {/* Services ticker + Join link — above mobile nav bar */}
          <div className="relative z-10 flex flex-col items-center pb-[80px] lg:pb-0">
            <div className="mb-2 flex items-center justify-center px-4">
              <a href="/join" className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-5 py-1.5 text-[11px] font-medium text-white/70 transition-all hover:bg-white/20 hover:text-white">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Are you a service provider? Join our network
              </a>
            </div>
            <div className="w-full">
              <ServicesTicker variant="dark" />
            </div>
          </div>
        </div>
      )}

      {/* ══ REQUEST FORM ══ */}
      {page === 'tracking' && !request && (
        <div className="flex h-full flex-col overflow-y-auto lg:pr-[80px]">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Request help</h1>
              <p className="mt-1 text-sm text-[#64748B]">Select a service and we handle the rest.</p>
            </div>
          </div>
          <section className="flex flex-1 flex-col items-center px-5 pb-28 pt-2 sm:px-8">
            <IntakeForm onSubmit={onSubmit} />
          </section>
        </div>
      )}

      {/* ══ TRACKING ══ */}
      {page === 'tracking' && request && (
        <div className="flex h-full flex-col overflow-y-auto lg:pr-[80px]">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Live tracking</h1>
              <p className="mt-1 text-sm text-[#64748B]">Your pro is being dispatched.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8">
            <TrackingPage request={request} onCancel={onCancel} />
          </div>
        </div>
      )}

      {/* ══ HISTORY ══ */}
      {page === 'history' && (
        <div className="flex h-full flex-col overflow-y-auto lg:pr-[80px]">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">History</h1>
              <p className="mt-1 text-sm text-[#64748B]">Your past requests and receipts.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8"><HistoryPage /></div>
        </div>
      )}

      {/* ══ SUPPORT ══ */}
      {page === 'support' && (
        <div className="flex h-full flex-col overflow-hidden lg:pr-[80px]">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-4 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18.75h.008v.008H12v-.008Z" strokeWidth="2" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Support</h1>
              <p className="mt-1 text-sm text-[#64748B]">We typically respond within minutes.</p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-5 pb-2 sm:px-8"><SupportPage /></div>
        </div>
      )}

      {/* ══ MAP ══ */}
      {page === 'map' && (
        <div className="flex h-full flex-col overflow-hidden lg:pr-[80px]">
          {/* Desktop header -- hidden on mobile */}
          <div className="hidden sm:flex shrink-0 flex-col items-center gap-3 px-5 pb-2 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Nearby Pros</h1>
              <p className="mt-1 text-sm text-[#64748B]">Find professionals near your location.</p>
            </div>
          </div>
          {/* Mobile: full-bleed map, Desktop: padded */}
          <div className="flex-1 min-h-0 sm:px-5 sm:pb-28 sm:pt-0"><MapPage /></div>
        </div>
      )}

      {/* ══ SEARCH ══ */}
      {page === 'search' && (
        <div className="flex h-full flex-col overflow-y-auto lg:pr-[80px]">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#8FB34A]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Search</h1>
              <p className="mt-1 text-sm text-[#64748B]">Find any service or issue instantly.</p>
            </div>
          </div>
          <div className="flex-1 px-5 pb-28 sm:px-8"><SearchPage /></div>
        </div>
      )}
    </div>
  )
}
