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

const PAGE_ORDER: AppPage[] = ['home', 'tracking', 'history', 'support']

export default function Root() {
  const [active, setActive]   = useState<AppPage>('home')
  const [exiting, setExiting] = useState<AppPage | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1) // 1 = forward (up), -1 = backward (down)
  const [request, setRequest] = useState<ServiceRequest | null>(null)

  const navigate = useCallback((target: AppPage) => {
    if (target === active || exiting) return
    const fromIdx = PAGE_ORDER.indexOf(active)
    const toIdx   = PAGE_ORDER.indexOf(target)
    setDirection(toIdx > fromIdx ? 1 : -1)
    setExiting(active)
    setActive(target)
    setTimeout(() => setExiting(null), 450)
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

  const dir = direction === 1 ? 'Up' : 'Down'

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">

      {/* OLD page — exits */}
      {exiting && (
        <div
          key={`exit-${exiting}`}
          className="absolute inset-0"
          style={{ zIndex: 1, animation: `slideOut${dir} 0.42s cubic-bezier(0.4,0,0.2,1) forwards` }}
        >
          <PageContent
            page={exiting}
            request={request}
            navigate={navigate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* NEW page — enters */}
      <div
        key={`enter-${active}`}
        className="absolute inset-0"
        style={{
          zIndex: 2,
          animation: exiting ? `slideIn${dir} 0.42s cubic-bezier(0.4,0,0.2,1) forwards` : 'none',
        }}
      >
        <PageContent
          page={active}
          request={request}
          navigate={navigate}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      {/* Sidebar — always above everything */}
      <div className="pointer-events-none absolute inset-0 z-50">
        <div className="pointer-events-auto absolute right-0 top-0 h-full">
          <AppSidebar
            currentPage={active}
            onNavigate={navigate}
            isHomePage={active === 'home'}
          />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
function PageContent({
  page, request, navigate, onSubmit, onCancel,
}: {
  page: AppPage
  request: ServiceRequest | null
  navigate: (p: AppPage) => void
  onSubmit: (f: RequestFormData) => void
  onCancel: () => void
}) {
  return (
    <div className={cn('flex h-dvh w-full flex-col overflow-hidden', page !== 'home' && 'bg-[#F6F8F4]')}>

      {/* ══ HOME ══ */}
      {page === 'home' && (
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{ backgroundImage: "url('/bg1.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-12">
            <div className="flex flex-col items-center gap-0">

              {/* OS symbol in frosted glass card */}
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

              {/* OSCaller wordmark — flush below card */}
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
