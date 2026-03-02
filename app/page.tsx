'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { AppPage, RequestFormData, ServiceRequest } from '@/lib/store'
import { OSSymbol, OSCallerWordmark } from '@/components/os-logo'
import { AppSidebar } from '@/components/app-sidebar'
import { IntakeForm } from '@/components/intake-form'
import { ServicesTicker } from '@/components/services-ticker'
import { TrackingPage } from '@/components/tracking-page'
import { HistoryPage } from '@/components/history-page'
import { SupportPage } from '@/components/support-page'

export default function HomePage() {
  const [page, setPage] = useState<AppPage>('home')
  const [transitioning, setTransitioning] = useState(false)
  const [displayPage, setDisplayPage] = useState<AppPage>('home')
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const navigate = useCallback((target: AppPage) => {
    if (target === page) return
    setTransitioning(true)
    setTimeout(() => {
      setPage(target)
      setDisplayPage(target)
      setTransitioning(false)
      contentRef.current?.scrollTo({ top: 0 })
    }, 240)
  }, [page])

  const handleSubmit = useCallback((form: RequestFormData) => {
    const newRequest: ServiceRequest = {
      id: `req-${Date.now()}`,
      form,
      status: 'submitted',
      timeline: [],
      createdAt: new Date(),
      paymentStatus: 'none',
    }
    setRequest(newRequest)
    navigate('tracking')
  }, [navigate])

  const handleCancel = useCallback(() => {
    setRequest(null)
    navigate('home')
  }, [navigate])

  const isHome = displayPage === 'home'

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#8DB33F]">

      {/* ── Main scroll area ── */}
      <div
        ref={contentRef}
        className={cn(
          'relative flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-240',
          transitioning ? 'opacity-0' : 'opacity-100',
          !isHome && 'bg-[#F6F8F4]'
        )}
      >

        {/* ══════════ HOME ══════════ */}
        {isHome && (
          <div className="home-shell relative flex h-dvh w-full flex-col overflow-hidden">

            {/* SVG organic background — precise, scalable, clean */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Large top-left circle */}
              <circle cx="-60" cy="-40" r="460" fill="#7FAC36" fillOpacity="0.55" />
              {/* Medium bottom-left circle */}
              <circle cx="80" cy="900" r="340" fill="#7FAC36" fillOpacity="0.38" />
              {/* Large right-side circle */}
              <circle cx="1160" cy="180" r="440" fill="#7FAC36" fillOpacity="0.32" />
              {/* Small highlight near center top */}
              <circle cx="480" cy="160" r="130" fill="#B5CF72" fillOpacity="0.18" />
            </svg>

            {/* Cream right strip — matches reference exactly */}
            <div
              className="pointer-events-none absolute right-0 top-0 hidden h-full w-20 lg:block"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #dce9c4 45%, #eaf4d6 100%)' }}
              aria-hidden="true"
            />

            {/* Center content */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-16">

              {/* OS mark */}
              <div className="drop-shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <OSSymbol className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56" color="#FFFFFF" />
              </div>

              {/* Frosted "OSCaller" pill — exactly like reference */}
              <div className="mt-6 rounded-xl bg-white/15 px-10 py-3.5 backdrop-blur-md">
                <OSCallerWordmark className="h-9 w-auto sm:h-11" color="#FFFFFF" />
              </div>

              {/* Tagline */}
              <div className="mt-7 flex flex-col items-center gap-1 text-center">
                <p className="text-[15px] font-medium leading-relaxed text-white/80 sm:text-base">
                  This is where you get served faster anytime
                </p>
                <p className="text-[15px] font-medium leading-relaxed text-white/80 sm:text-base">
                  This is where you get served faster anytime
                </p>
                <p className="text-[15px] font-medium leading-relaxed text-white/60 sm:text-base">
                  This is where you get served faster
                </p>
              </div>
            </div>

            {/* Services ticker pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
              <ServicesTicker variant="dark" />
            </div>
          </div>
        )}

        {/* ══════════ REQUEST FORM ══════════ */}
        {displayPage === 'tracking' && !request && (
          <div className="flex min-h-dvh flex-col">
            <header className="flex items-center gap-3 bg-[#8DB33F] px-5 py-4 sm:px-8">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-3 transition-opacity hover:opacity-80 active:opacity-60"
                aria-label="Go home"
              >
                <OSSymbol className="h-8 w-8" color="#FFFFFF" />
                <OSCallerWordmark className="h-5 w-auto" color="#FFFFFF" />
              </button>
            </header>
            <section className="flex flex-1 flex-col items-center px-5 pt-8 pb-28 sm:px-8 sm:pt-12">
              <div className="mb-8 text-center">
                <h1 className="text-balance text-2xl font-bold tracking-tight text-[#1a2e06] sm:text-3xl">
                  Get help in minutes.
                </h1>
                <p className="mt-2 text-sm text-[#5a7040] sm:text-base">
                  Select a service, describe the issue, and we handle the rest.
                </p>
              </div>
              <IntakeForm onSubmit={handleSubmit} />
            </section>
          </div>
        )}

        {/* ══════════ TRACKING ══════════ */}
        {displayPage === 'tracking' && request && (
          <div className="min-h-dvh px-5 py-6 pb-28 sm:px-8 sm:py-8">
            <header className="mb-6 flex items-center gap-3">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
                aria-label="Go home"
              >
                <OSSymbol className="h-8 w-8" color="#8DB33F" />
                <OSCallerWordmark className="h-5 w-auto" color="#8DB33F" />
              </button>
            </header>
            <TrackingPage request={request} onCancel={handleCancel} />
          </div>
        )}

        {/* ══════════ HISTORY ══════════ */}
        {displayPage === 'history' && (
          <div className="min-h-dvh px-5 py-6 pb-28 sm:px-8 sm:py-8">
            <header className="mb-6 flex items-center gap-3">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
                aria-label="Go home"
              >
                <OSSymbol className="h-8 w-8" color="#8DB33F" />
                <OSCallerWordmark className="h-5 w-auto" color="#8DB33F" />
              </button>
            </header>
            <HistoryPage />
          </div>
        )}

        {/* ══════════ SUPPORT ══════════ */}
        {displayPage === 'support' && (
          <div className="min-h-dvh px-5 py-6 pb-28 sm:px-8 sm:py-8">
            <header className="mb-6 flex items-center gap-3">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
                aria-label="Go home"
              >
                <OSSymbol className="h-8 w-8" color="#8DB33F" />
                <OSCallerWordmark className="h-5 w-auto" color="#8DB33F" />
              </button>
            </header>
            <SupportPage />
          </div>
        )}
      </div>

      {/* ── Right sidebar — always rendered on top ── */}
      <AppSidebar currentPage={page} onNavigate={navigate} isHomePage={isHome} />
    </div>
  )
}
