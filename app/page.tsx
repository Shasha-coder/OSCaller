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
    }, 280)
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
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Main content */}
      <div
        ref={contentRef}
        className={cn(
          'relative flex-1 overflow-y-auto overflow-x-hidden',
          !isHome && 'bg-background'
        )}
      >
        <div className={cn(
          'min-h-dvh transition-all duration-300 ease-out',
          transitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
        )}>

          {/* ========== HOME ========== */}
          {isHome && (
            <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#8FB34A]">

              {/* Large organic circles -- matching reference exactly */}
              <div className="pointer-events-none absolute inset-0">
                {/* Top-left: the biggest circle, partially offscreen */}
                <div className="absolute -left-[20vw] -top-[15vh] h-[80vh] w-[80vh] rounded-full bg-[#7DA33E]/60" />
                {/* Bottom-left */}
                <div className="absolute -bottom-[20vh] -left-[10vw] h-[60vh] w-[60vh] rounded-full bg-[#7DA33E]/35" />
                {/* Right side large circle */}
                <div className="absolute -right-[15vw] top-[5vh] h-[75vh] w-[75vh] rounded-full bg-[#7DA33E]/30" />
                {/* Small highlight circle near center-top */}
                <div className="absolute left-[42%] top-[18%] h-[18vh] w-[18vh] rounded-full bg-[#C8DC8C]/20" />
              </div>

              {/* Right cream strip -- exactly like the reference */}
              <div className="pointer-events-none absolute right-0 top-0 hidden h-full lg:block" style={{ width: '72px' }}>
                <div className="h-full w-full" style={{ background: 'linear-gradient(90deg, rgba(216,228,184,0.15) 0%, rgba(216,228,184,0.5) 60%, rgba(234,244,216,0.65) 100%)' }} />
              </div>

              {/* Centered content */}
              <div className="relative z-10 flex flex-col items-center px-6">
                {/* OS mark -- large and bold */}
                <OSSymbol className="h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 drop-shadow-[0_4px_20px_rgba(0,0,0,0.08)]" color="#FFFFFF" />

                {/* Frosted "OSCaller" badge */}
                <div className="mt-5 rounded-lg bg-[#C8D8A0]/30 px-8 py-3 backdrop-blur-sm">
                  <OSCallerWordmark className="h-8 w-auto sm:h-10" color="#FFFFFF" />
                </div>

                {/* Taglines -- matching the 3-line reference */}
                <div className="mt-8 flex flex-col items-center gap-1.5">
                  <p className="text-sm font-medium text-white/85 sm:text-base">This is where you get served faster anytime</p>
                  <p className="text-sm font-medium text-white/85 sm:text-base">This is where you get served faster anytime</p>
                  <p className="text-sm font-medium text-white/65 sm:text-base">This is where you get served faster</p>
                </div>
              </div>

              {/* Bottom: ticker */}
              <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10">
                <ServicesTicker variant="dark" />
              </div>

              {/* Safe area for mobile nav */}
              <div className="h-20 lg:h-0" />
            </div>
          )}

          {/* ========== REQUEST ========== */}
          {displayPage === 'tracking' && !request && (
            <div className="flex min-h-dvh flex-col">
              <header className="flex items-center gap-3 bg-[#8FB34A] px-5 py-4 sm:px-8">
                <button onClick={() => navigate('home')} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <OSSymbol className="h-8 w-8" color="#FFFFFF" />
                  <OSCallerWordmark className="h-5 w-auto" color="#FFFFFF" />
                </button>
              </header>
              <section className="flex flex-1 flex-col items-center px-5 pt-8 pb-24 sm:px-8 sm:pt-12">
                <div className="mb-8 text-center">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Get help in minutes.</h1>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">Select a service, describe the issue, and we handle the rest.</p>
                </div>
                <IntakeForm onSubmit={handleSubmit} />
              </section>
            </div>
          )}

          {/* ========== TRACKING ========== */}
          {displayPage === 'tracking' && request && (
            <div className="min-h-dvh px-5 py-6 pb-24 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center gap-3">
                <button onClick={() => navigate('home')} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <OSSymbol className="h-8 w-8" color="#8FB34A" />
                  <OSCallerWordmark className="h-5 w-auto" color="#8FB34A" />
                </button>
              </header>
              <TrackingPage request={request} onCancel={handleCancel} />
            </div>
          )}

          {/* ========== HISTORY ========== */}
          {displayPage === 'history' && (
            <div className="min-h-dvh px-5 py-6 pb-24 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center gap-3">
                <button onClick={() => navigate('home')} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <OSSymbol className="h-8 w-8" color="#8FB34A" />
                  <OSCallerWordmark className="h-5 w-auto" color="#8FB34A" />
                </button>
              </header>
              <HistoryPage />
            </div>
          )}

          {/* ========== SUPPORT ========== */}
          {displayPage === 'support' && (
            <div className="min-h-dvh px-5 py-6 pb-24 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center gap-3">
                <button onClick={() => navigate('home')} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <OSSymbol className="h-8 w-8" color="#8FB34A" />
                  <OSCallerWordmark className="h-5 w-auto" color="#8FB34A" />
                </button>
              </header>
              <SupportPage />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar -- always on top */}
      <AppSidebar currentPage={page} onNavigate={navigate} isHomePage={isHome} />
    </div>
  )
}
