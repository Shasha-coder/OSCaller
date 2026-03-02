'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { AppPage, RequestFormData, ServiceRequest } from '@/lib/store'
import { SplashHero } from '@/components/splash-hero'
import { AppSidebar } from '@/components/app-sidebar'
import { IntakeForm } from '@/components/intake-form'
import { ServicesTicker } from '@/components/services-ticker'
import { TrackingPage } from '@/components/tracking-page'
import { HistoryPage } from '@/components/history-page'
import { SupportPage } from '@/components/support-page'

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [splashExiting, setSplashExiting] = useState(false)
  const [page, setPage] = useState<AppPage>('home')
  const [transitioning, setTransitioning] = useState(false)
  const [displayPage, setDisplayPage] = useState<AppPage>('home')
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleGetStarted = useCallback(() => {
    setSplashExiting(true)
    setTimeout(() => {
      setShowSplash(false)
    }, 600)
  }, [])

  const navigate = useCallback((target: AppPage) => {
    if (target === page) return
    if (showSplash) {
      setSplashExiting(true)
      setTimeout(() => {
        setShowSplash(false)
        setPage(target)
        setDisplayPage(target)
      }, 600)
      return
    }
    setTransitioning(true)
    setTimeout(() => {
      setPage(target)
      setDisplayPage(target)
      setTransitioning(false)
      contentRef.current?.scrollTo({ top: 0 })
    }, 250)
  }, [page, showSplash])

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

  /* ---- Splash screen ---- */
  if (showSplash) {
    return (
      <div className={cn(
        'transition-all duration-600 ease-out',
        splashExiting ? 'scale-[1.02] opacity-0' : 'scale-100 opacity-100'
      )}>
        <SplashHero onGetStarted={handleGetStarted} />
      </div>
    )
  }

  /* ---- App shell ---- */
  return (
    <div className="flex min-h-screen bg-background animate-in fade-in duration-500">
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
              {/* Green header bar */}
              <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5" style={{ backgroundColor: '#8FB34A' }}>
                <button onClick={() => { setShowSplash(true); setSplashExiting(false) }}>
                  <Image
                    src="/logo-white.svg"
                    alt="OSCaller"
                    width={140}
                    height={36}
                    priority
                    className="h-7 w-auto sm:h-8"
                  />
                </button>
              </header>

              {/* Hero section */}
              <section className="flex flex-1 flex-col items-center px-5 pt-8 pb-4 sm:px-8 sm:pt-12">
                <div className="mb-8 text-center sm:mb-10">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[32px] sm:leading-tight">
                    Get emergency help in minutes.
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    Select a service, describe the issue, and we handle the rest.
                  </p>
                </div>

                <IntakeForm onSubmit={handleSubmit} />
              </section>

              {/* Services ticker */}
              <div className="mt-auto border-t border-border/50">
                <ServicesTicker />
              </div>

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

      <AppSidebar currentPage={page} onNavigate={navigate} />
    </div>
  )
}
