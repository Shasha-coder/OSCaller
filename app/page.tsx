'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { AppPage, RequestFormData, ServiceRequest, RequestStatus } from '@/lib/store'
import { createEmptyForm } from '@/lib/store'
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
      // Scroll to top on page change
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
    <div className="flex min-h-screen bg-background">
      {/* Main content area */}
      <main
        ref={contentRef}
        className="flex-1 overflow-y-auto lg:mr-24"
        style={{ minHeight: '100dvh' }}
      >
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            transitioning ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
          )}
        >
          {displayPage === 'home' && (
            <div className="flex min-h-screen flex-col">
              {/* Header */}
              <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo-green.svg"
                    alt="OSCaller"
                    width={140}
                    height={36}
                    priority
                    className="h-8 w-auto sm:h-9"
                  />
                </div>
              </header>

              {/* Hero section */}
              <section className="flex flex-1 flex-col items-center px-5 pt-4 pb-4 sm:px-8 sm:pt-8">
                <div className="mb-8 text-center sm:mb-10">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[32px] sm:leading-tight">
                    Get emergency help in minutes.
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    AI-powered dispatch. Pre-authorized. Real-time tracked.
                  </p>
                </div>

                <IntakeForm onSubmit={handleSubmit} />
              </section>

              {/* Services ticker */}
              <div className="mt-auto border-t border-border/50">
                <ServicesTicker />
              </div>

              {/* Bottom spacer for mobile nav */}
              <div className="h-20 lg:h-0" />
            </div>
          )}

          {displayPage === 'tracking' && (
            <div className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center">
                <Image src="/logo-green.svg" alt="OSCaller" width={120} height={32} className="h-7 w-auto" />
              </header>
              <TrackingPage request={request} onCancel={handleCancel} />
              <div className="h-20 lg:h-0" />
            </div>
          )}

          {displayPage === 'history' && (
            <div className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center">
                <Image src="/logo-green.svg" alt="OSCaller" width={120} height={32} className="h-7 w-auto" />
              </header>
              <HistoryPage />
              <div className="h-20 lg:h-0" />
            </div>
          )}

          {displayPage === 'support' && (
            <div className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
              <header className="mb-6 flex items-center justify-center">
                <Image src="/logo-green.svg" alt="OSCaller" width={120} height={32} className="h-7 w-auto" />
              </header>
              <SupportPage />
              <div className="h-20 lg:h-0" />
            </div>
          )}
        </div>
      </main>

      {/* Sidebar / Bottom nav */}
      <AppSidebar currentPage={page} onNavigate={navigate} />
    </div>
  )
}
