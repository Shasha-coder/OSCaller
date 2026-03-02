'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { AppPage, RequestFormData, ServiceRequest } from '@/lib/store'
import { OSSymbol, OSCallerWordmark } from '@/components/os-logo'
import { AppSidebar } from '@/components/app-sidebar'
import { IntakeForm } from '@/components/intake-form'
import { ServicesTicker } from '@/components/services-ticker'
import { TrackingPage } from '@/components/tracking-page'
import { HistoryPage } from '@/components/history-page'
import { SupportPage } from '@/components/support-page'

type TransitionState = 'idle' | 'animating'

export default function Root() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home')
  const [nextPage, setNextPage]       = useState<AppPage | null>(null)
  const [transition, setTransition]   = useState<TransitionState>('idle')
  const [request, setRequest]         = useState<ServiceRequest | null>(null)
  const animating = useRef(false)

  const navigate = useCallback((target: AppPage) => {
    if (target === currentPage || animating.current) return
    animating.current = true
    setNextPage(target)
    setTransition('animating')

    // After animation completes, swap pages
    setTimeout(() => {
      setCurrentPage(target)
      setNextPage(null)
      setTransition('idle')
      animating.current = false
    }, 420)
  }, [currentPage])

  const handleSubmit = useCallback((form: RequestFormData) => {
    const req: ServiceRequest = {
      id: `req-${Date.now()}`,
      form,
      status: 'submitted',
      timeline: [],
      createdAt: new Date(),
      paymentStatus: 'none',
    }
    setRequest(req)
    navigate('tracking')
  }, [navigate])

  const handleCancel = useCallback(() => {
    setRequest(null)
    navigate('home')
  }, [navigate])

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">

      {/* ── Current page (slides up-out when transitioning) ── */}
      <div
        className={cn(
          'absolute inset-0 will-change-transform',
          transition === 'animating' ? 'anim-slide-out' : ''
        )}
      >
        <PageContent
          page={currentPage}
          request={request}
          navigate={navigate}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      {/* ── Next page (slides up-in when transitioning) ── */}
      {nextPage && (
        <div className="absolute inset-0 anim-slide-in will-change-transform">
          <PageContent
            page={nextPage}
            request={request}
            navigate={navigate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* ── Sidebar always on top ── */}
      <div className="pointer-events-none absolute inset-0 z-50">
        <div className="pointer-events-auto absolute right-0 top-0 h-full">
          <AppSidebar
            currentPage={currentPage}
            onNavigate={navigate}
            isHomePage={currentPage === 'home'}
          />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PageContent — renders the correct screen for a given page
// ─────────────────────────────────────────────────────────────
function PageContent({
  page,
  request,
  navigate,
  onSubmit,
  onCancel,
}: {
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
              <OSSymbol
                className="h-44 w-44 drop-shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:h-52 sm:w-52"
                color="#FFFFFF"
              />
              <div
                className="rounded-2xl px-10 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              >
                <OSCallerWordmark className="h-8 w-auto sm:h-10" color="#FFFFFF" />
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center gap-0.5 text-center">
              <p className="text-sm text-white/80 sm:text-[15px]">This is where help arrives fast, anytime</p>
              <p className="text-sm text-white/80 sm:text-[15px]">Pros get dispatched fast, anytime</p>
              <p className="text-sm text-white/60 sm:text-[15px]">Emergencies get handled fast</p>
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
          <header className="flex shrink-0 items-center border-b border-border/40 bg-[#F6F8F4] px-5 py-5 sm:px-8">
            <button onClick={() => navigate('home')} className="transition-opacity hover:opacity-70" aria-label="Go home">
              <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
            </button>
          </header>
          <section className="flex flex-1 flex-col items-center px-5 pb-28 pt-8 sm:px-8 sm:pt-12">
            <div className="mb-8 text-center">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-[#1a2e06] sm:text-3xl">Get help in minutes.</h1>
              <p className="mt-2 text-sm text-[#5a7040] sm:text-base">Select a service, describe the issue, and we handle the rest.</p>
            </div>
            <IntakeForm onSubmit={onSubmit} />
          </section>
        </div>
      )}

      {/* ══ TRACKING ══ */}
      {page === 'tracking' && request && (
        <div className="flex h-full flex-col overflow-y-auto px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
          <header className="mb-8 shrink-0">
            <button onClick={() => navigate('home')} className="transition-opacity hover:opacity-70" aria-label="Go home">
              <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
            </button>
          </header>
          <TrackingPage request={request} onCancel={onCancel} />
        </div>
      )}

      {/* ══ HISTORY ══ */}
      {page === 'history' && (
        <div className="flex h-full flex-col overflow-y-auto px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
          <header className="mb-8 shrink-0">
            <button onClick={() => navigate('home')} className="transition-opacity hover:opacity-70" aria-label="Go home">
              <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
            </button>
          </header>
          <HistoryPage />
        </div>
      )}

      {/* ══ SUPPORT ══ */}
      {page === 'support' && (
        <div className="flex h-full flex-col overflow-y-auto px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
          <header className="mb-8 shrink-0">
            <button onClick={() => navigate('home')} className="transition-opacity hover:opacity-70" aria-label="Go home">
              <OSCallerWordmark className="h-7 w-auto" color="#8DB33F" />
            </button>
          </header>
          <SupportPage />
        </div>
      )}
    </div>
  )
}
