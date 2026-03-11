'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'
import type { AppPage, RequestFormData, ServiceRequest } from '@/lib/store'
import { OSSymbol, OSCallerWordmark } from '@/components/os-logo'
import { AppSidebar } from '@/components/app-sidebar'
import { ServicesTicker } from '@/components/services-ticker'
import { HeroBackground } from '@/components/hero-background'
import { TrackingPage } from '@/components/tracking-page'
import { HistoryPage } from '@/components/history-page'
import { SupportPage } from '@/components/support-page'
import { MapPage } from '@/components/map-page'
import { ServicePageBackground } from '@/components/service-bg-art'

const PAGE_ORDER: AppPage[] = ['home', 'map', 'tracking', 'history', 'support']

/** GSAP stagger animation for home section elements */
function useHomeReveal(isHome: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isHome || !containerRef.current) return
    const els = containerRef.current.querySelectorAll('.gsap-reveal')
    if (!els.length) return
    gsap.fromTo(els,
      { opacity: 0, y: 28, scale: 0.97, filter: 'blur(4px)' },
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.15 }
    )
    return () => { gsap.killTweensOf(els) }
  }, [isHome])
  return containerRef
}

export default function Root() {
  const [active, setActive] = useState<AppPage>('home')
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [historyHasData, setHistoryHasData] = useState<boolean | null>(null)

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

  const handleSubmit = useCallback(async (form: RequestFormData) => {
    // Optimistically navigate to tracking
    const tempId = `req-${Date.now()}`
    setRequest({
      id: tempId,
      form,
      status: 'submitted',
      timeline: [],
      createdAt: new Date(),
      paymentStatus: 'none',
    })
    navigate('tracking')

    try {
      // 1. Persist to Supabase
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: form.address,
          lat: form.lat || null,
          lng: form.lng || null,
          is_apartment: form.isApartment || false,
          building_name: form.buildingName || null,
          unit_number: form.unitNumber || null,
          entry_instructions: form.entryInstructions || null,
          service: form.service,
          emergency_level: form.emergencyLevel,
          description: form.description || '',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const realId = data.request?.id || tempId
        setRequest(prev => prev ? { ...prev, id: realId } : prev)

        // 2. Trigger dispatch to find a provider
        fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: realId }),
        }).catch(() => { })
      }
    } catch {
      // Request is already saved optimistically -- tracking page will poll for updates
    }
  }, [navigate])

  const handleCancel = useCallback(() => {
    setRequest(null)
    navigate('home')
  }, [navigate])

  // Handle request created from MapPage (new flow via callAria)
  const handleMapRequestCreated = useCallback((requestId: string) => {
    setRequest({
      id: requestId,
      form: {} as RequestFormData, // Form data is already in DB
      status: 'searching',
      timeline: [],
      createdAt: new Date(),
      paymentStatus: 'none',
    })
    navigate('tracking')
  }, [navigate])

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#0A0A0A]">

      {/* EXITING page (behind) */}
      {exitPage && (
        <div
          ref={exitRef}
          key={`exit-${exitPage}`}
          className="absolute inset-0"
          style={{ zIndex: 1, willChange: 'transform, opacity' }}
        >
          <PageContent page={exitPage} request={request} navigate={navigate} onSubmit={handleSubmit} onCancel={handleCancel} historyHasData={historyHasData} onHistoryDataLoaded={setHistoryHasData} onMapRequestCreated={handleMapRequestCreated} />
        </div>
      )}

      {/* ENTERING / ACTIVE page (front) */}
      <div
        ref={enterRef}
        key={`enter-${active}`}
        className="absolute inset-0"
        style={{ zIndex: 2, willChange: 'transform, opacity' }}
      >
        <PageContent page={active} request={request} navigate={navigate} onSubmit={handleSubmit} onCancel={handleCancel} historyHasData={historyHasData} onHistoryDataLoaded={setHistoryHasData} onMapRequestCreated={handleMapRequestCreated} />
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
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl glass-gradient-border">
      {children}
    </div>
  )
}

// ─── Page content renderer ───────────────────────────────────
function PageContent({ page, request, navigate, onSubmit, onCancel, historyHasData, onHistoryDataLoaded, onMapRequestCreated }: {
  page: AppPage
  request: ServiceRequest | null
  navigate: (p: AppPage) => void
  onSubmit: (f: RequestFormData) => void
  onCancel: () => void
  historyHasData: boolean | null
  onHistoryDataLoaded: (v: boolean) => void
  onMapRequestCreated: (requestId: string) => void
}) {
  const isHome = page === 'home'
  const homeRevealRef = useHomeReveal(isHome)

  return (
    <div className={cn(
      'flex h-dvh w-full flex-col overflow-hidden relative z-10',
      !isHome && 'bg-[#0A0A0A]/90'
    )}>

      {/* SVG art background for service pages — renders at z-0, behind content */}
      {!isHome && <ServicePageBackground />}

      {/* ══ HOME ══ */}
      {isHome && (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          {/* Animated background — replaces static bg1.webp */}
          <HeroBackground />

          <div ref={homeRevealRef} className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 -mt-8">
            <div className="flex flex-col items-center">
              {/* Logo with glass reflection animation */}
              <div
                className="gsap-reveal relative overflow-hidden"
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
                {/* Inner glass shimmer ring */}
                <div
                  className="absolute inset-0 rounded-[36px] animate-glass-shimmer pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.08) 100%)',
                  }}
                />

                <OSSymbol className="h-24 w-24 relative z-10" color="#FFFFFF" />

                {/* Sweeping light beam */}
                <div
                  className="absolute inset-0 pointer-events-none animate-glass-sweep"
                  style={{
                    width: '50%',
                    height: '200%',
                    top: '-50%',
                    left: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)',
                  }}
                />

                {/* Top edge highlight */}
                <div
                  className="absolute top-0 left-[10%] right-[10%] h-[1px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  }}
                />
              </div>

              {/* Wordmark */}
              <div
                className="gsap-reveal mt-5 rounded-2xl px-8 py-2.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <OSCallerWordmark className="h-7 w-auto sm:h-9" color="#C8E64C" />
              </div>
            </div>

            {/* Tagline */}
            <div className="gsap-reveal mt-8 flex flex-col items-center gap-2.5 text-center">
              <p className="text-lg font-bold text-white sm:text-xl tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                Get emergency help in minutes.
              </p>
              <p className="max-w-[300px] text-sm text-white/65 sm:text-[15px] leading-relaxed">
                Pros dispatched fast. Pre-authorized. Tracked live.
              </p>
            </div>

            {/* CTA button */}
            <button
              onClick={() => navigate('map')}
              className="gsap-reveal premium-btn mt-8 flex items-center gap-2.5 rounded-2xl bg-[#C8E64C] px-8 py-3.5 font-bold text-[#0A0A0A] shadow-[0_12px_40px_rgba(200,230,76,0.25)] transition-all hover:bg-[#D4EE65] hover:shadow-[0_16px_50px_rgba(200,230,76,0.35)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Request a Pro Now
            </button>

            {/* Trust indicators — glass pill style */}
            <div className="gsap-reveal mt-5 flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] backdrop-blur-sm border border-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/55">
                <svg className="h-3.5 w-3.5 text-[#C8E64C]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                24/7
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] backdrop-blur-sm border border-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/55">
                <svg className="h-3.5 w-3.5 text-[#C8E64C]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                GPS
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] backdrop-blur-sm border border-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/55">
                <svg className="h-3.5 w-3.5 text-[#C8E64C]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Licensed
              </span>
            </div>

            {/* Join link */}
            <div className="gsap-reveal mt-4 flex items-center justify-center">
              <a href="/join" className="flex items-center justify-center gap-1.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.06] px-5 py-1.5 text-[11px] font-medium text-white/50 transition-all hover:bg-white/[0.1] hover:text-white/70 hover:border-white/[0.12]">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Are you a service provider? Join our network
              </a>
            </div>

          </div>

          {/* Services ticker — above mobile nav bar */}
          <div className="gsap-reveal relative z-10 flex flex-col items-center pb-[90px] lg:pb-0">
            <div className="w-full">
              <ServicesTicker variant="dark" />
            </div>
          </div>
        </div>
      )}

      {/* ══ TRACKING (only when active request) ══ */}
      {page === 'tracking' && !request && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-white/40">No active request.</p>
            <button onClick={() => navigate('map')} className="mt-3 text-sm font-semibold text-[#C8E64C] hover:underline">Request a Pro</button>
          </div>
        </div>
      )}
      {page === 'tracking' && request && (
        <div className="flex h-full flex-col overflow-y-auto lg:pr-[80px]">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#C8E64C]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-white">Live tracking</h1>
              <p className="mt-1 text-sm text-white/45">Your pro is being dispatched.</p>
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
          {historyHasData && (
            <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-6 pt-10 sm:px-8">
              <HeroIcon>
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#C8E64C]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
                </svg>
              </HeroIcon>
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight text-white">History</h1>
                <p className="mt-1 text-sm text-white/45">Your past requests and receipts.</p>
              </div>
            </div>
          )}
          <div className={cn('flex-1 px-5 pb-28 sm:px-8', !historyHasData && 'flex items-center justify-center')}><HistoryPage onDataLoaded={onHistoryDataLoaded} /></div>
        </div>
      )}

      {/* ══ SUPPORT ══ */}
      {page === 'support' && (
        <div className="flex h-full flex-col overflow-hidden lg:pr-[80px]">
          <div className="flex shrink-0 flex-col items-center gap-3 px-5 pb-4 pt-10 sm:px-8">
            <HeroIcon>
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#C8E64C]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18.75h.008v.008H12v-.008Z" strokeWidth="2" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </HeroIcon>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-white">Support</h1>
              <p className="mt-1 text-sm text-white/45">We typically respond within minutes.</p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden px-5 pb-2 sm:px-8"><SupportPage /></div>
        </div>
      )}

      {/* ══ MAP ══ */}
      {page === 'map' && (
        <div className="flex h-full flex-col overflow-hidden lg:pr-[80px]">
          {/* Desktop header -- minimal inline version */}
          <div className="hidden sm:flex shrink-0 items-center justify-between px-5 py-3 sm:px-8">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#C8E64C]/10">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#C8E64C]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <h1 className="text-[15px] font-bold text-white">Request a Pro</h1>
            </div>
            <p className="text-[12px] text-white/40">Fill the form and call Aria</p>
          </div>
          {/* Mobile: full-bleed map, Desktop: padded */}
          <div className="flex-1 min-h-0 sm:px-5 sm:pb-6 sm:pt-0"><MapPage onRequestCreated={onMapRequestCreated} /></div>
        </div>
      )}


    </div>
  )
}
