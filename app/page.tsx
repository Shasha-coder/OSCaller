'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
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
    }, 250)
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

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Main content area */}
      <main
        ref={contentRef}
        className="flex-1 overflow-y-auto lg:mr-20"
      >
        <div
          className={cn(
            'transition-all duration-300 ease-out min-h-dvh',
            transitioning ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
          )}
        >
          {/* ===== HOME: The branded green splash ===== */}
          {displayPage === 'home' && (
            <div className="relative flex min-h-dvh flex-col overflow-hidden" style={{ backgroundColor: '#8FB34A' }}>
              {/* Organic circles */}
              <div className="pointer-events-none absolute -top-[25%] -left-[18%] h-[85vh] w-[85vh] rounded-full" style={{ backgroundColor: 'rgba(120,160,50,0.4)' }} />
              <div className="pointer-events-none absolute -right-[12%] top-[10%] h-[65vh] w-[65vh] rounded-full" style={{ backgroundColor: 'rgba(120,160,50,0.28)' }} />
              <div className="pointer-events-none absolute left-[38%] top-[16%] h-[24vh] w-[24vh] rounded-full" style={{ backgroundColor: 'rgba(200,220,140,0.22)' }} />
              <div className="pointer-events-none absolute -bottom-[15%] -left-[8%] h-[55vh] w-[55vh] rounded-full" style={{ backgroundColor: 'rgba(120,160,50,0.22)' }} />

              {/* Right cream strip (desktop only, before sidebar) */}
              <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-14 lg:block" style={{ background: 'linear-gradient(to right, rgba(234,244,216,0.25), rgba(234,244,216,0.55))' }} />

              {/* Centered branding */}
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
                {/* OS Symbol */}
                <OSSymbol className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48" color="#FFFFFF" />

                {/* OSCaller wordmark badge */}
                <div className="mt-4 rounded-lg px-6 py-2.5" style={{ backgroundColor: 'rgba(210,225,175,0.3)' }}>
                  <OSCallerWordmark className="h-7 w-auto sm:h-9" color="#FFFFFF" />
                </div>

                {/* Tagline */}
                <p className="mt-6 text-center text-sm font-medium leading-relaxed sm:text-base" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  This is where you get served faster anytime
                </p>
                <p className="mt-1 text-center text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  AI-powered dispatch. Pre-authorized. Real-time tracked.
                </p>

                {/* CTA */}
                <button
                  onClick={() => navigate('tracking')}
                  className="group mt-10 flex items-center gap-2.5 rounded-full bg-white/95 px-10 py-4 text-sm font-bold tracking-wide shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur transition-all duration-300 hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:translate-y-0 sm:text-base"
                  style={{ color: '#5A7A2A' }}
                >
                  Get Started
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Bottom ticker */}
              <div className="relative z-10 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <ServicesTicker variant="dark" />
              </div>

              <div className="h-16 lg:h-0" />
            </div>
          )}

          {/* ===== REQUEST FORM ===== */}
          {displayPage === 'tracking' && !request && (
            <div className="flex min-h-dvh flex-col">
              <header className="flex items-center px-5 py-4 sm:px-8 sm:py-5" style={{ backgroundColor: '#8FB34A' }}>
                <button onClick={() => navigate('home')} className="flex items-center gap-3">
                  <OSSymbol className="h-8 w-8" color="#FFFFFF" />
                  <OSCallerWordmark className="h-5 w-auto" color="#FFFFFF" />
                </button>
              </header>

              <section className="flex flex-1 flex-col items-center px-5 pt-8 pb-4 sm:px-8 sm:pt-10">
                <div className="mb-8 text-center">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Get emergency help in minutes.
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    Select a service, describe the issue, and we handle the rest.
                  </p>
                </div>
                <IntakeForm onSubmit={handleSubmit} />
              </section>
              <div className="h-20 lg:h-0" />
            </div>
          )}

          {/* ===== TRACKING LIVE ===== */}
          {displayPage === 'tracking' && request && (
            <div className="min-h-dvh px-5 py-6 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center gap-3">
                <OSSymbol className="h-8 w-8" color="#8FB34A" />
                <OSCallerWordmark className="h-5 w-auto" color="#8FB34A" />
              </header>
              <TrackingPage request={request} onCancel={handleCancel} />
              <div className="h-20 lg:h-0" />
            </div>
          )}

          {/* ===== HISTORY ===== */}
          {displayPage === 'history' && (
            <div className="min-h-dvh px-5 py-6 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center gap-3">
                <OSSymbol className="h-8 w-8" color="#8FB34A" />
                <OSCallerWordmark className="h-5 w-auto" color="#8FB34A" />
              </header>
              <HistoryPage />
              <div className="h-20 lg:h-0" />
            </div>
          )}

          {/* ===== SUPPORT ===== */}
          {displayPage === 'support' && (
            <div className="min-h-dvh px-5 py-6 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center gap-3">
                <OSSymbol className="h-8 w-8" color="#8FB34A" />
                <OSCallerWordmark className="h-5 w-auto" color="#8FB34A" />
              </header>
              <SupportPage />
              <div className="h-20 lg:h-0" />
            </div>
          )}
        </div>
      </main>

      {/* Right sidebar - always visible */}
      <AppSidebar currentPage={page} onNavigate={navigate} />
    </div>
  )
}
