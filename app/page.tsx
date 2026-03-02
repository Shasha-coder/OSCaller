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
          <div
            className="relative flex h-dvh w-full flex-col overflow-hidden"
            style={{
              backgroundImage: "url('/bg1.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Center content */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-12">

              {/* OS symbol */}
              <OSSymbol
                className="h-44 w-44 drop-shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:h-52 sm:w-52"
                color="#FFFFFF"
              />

              {/* OSCaller wordmark — tightly beneath OS symbol */}
              <div
                className="mt-1 rounded-2xl px-10 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              >
                <OSCallerWordmark className="h-8 w-auto sm:h-10" color="#FFFFFF" />
              </div>

              {/* Tagline */}
              <div className="mt-5 flex flex-col items-center gap-0.5 text-center">
                <p className="text-sm font-normal text-white/80 sm:text-[15px]">This is where help arrives fast, anytime</p>
                <p className="text-sm font-normal text-white/80 sm:text-[15px]">Pros get dispatched fast, anytime</p>
                <p className="text-sm font-normal text-white/60 sm:text-[15px]">Emergencies get handled fast</p>
              </div>
            </div>

            {/* Services ticker pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom)]">
              <ServicesTicker variant="dark" />
            </div>
          </div>
        )}

        {/* ══════════ REQUEST FORM ══════════ */}
        {displayPage === 'tracking' && !request && (
          <div className="flex min-h-dvh flex-col">
            <header className="flex items-center gap-3 border-b border-border/40 bg-[#F6F8F4] px-5 py-5 sm:px-8">
              <button
                onClick={() => navigate('home')}
                className="transition-opacity hover:opacity-70 active:opacity-50"
                aria-label="Go home"
              >
                <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
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
            <header className="mb-8 flex items-center">
              <button
                onClick={() => navigate('home')}
                className="transition-opacity hover:opacity-70"
                aria-label="Go home"
              >
                <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
              </button>
            </header>
            <TrackingPage request={request} onCancel={handleCancel} />
          </div>
        )}

        {/* ══════════ HISTORY ══════════ */}
        {displayPage === 'history' && (
          <div className="min-h-dvh px-5 py-6 pb-28 sm:px-8 sm:py-8">
            <header className="mb-8 flex items-center">
              <button
                onClick={() => navigate('home')}
                className="transition-opacity hover:opacity-70"
                aria-label="Go home"
              >
                <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
              </button>
            </header>
            <HistoryPage />
          </div>
        )}

        {/* ══════════ SUPPORT ══════════ */}
        {displayPage === 'support' && (
          <div className="min-h-dvh px-5 py-6 pb-28 sm:px-8 sm:py-8">
            <header className="mb-8 flex items-center">
              <button
                onClick={() => navigate('home')}
                className="transition-opacity hover:opacity-70"
                aria-label="Go home"
              >
                <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
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
