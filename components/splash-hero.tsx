'use client'

import Image from 'next/image'

interface SplashHeroProps {
  onGetStarted: () => void
}

export function SplashHero({ onGetStarted }: SplashHeroProps) {
  return (
    <section
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#8FB34A' }}
    >
      {/* Decorative organic circles -- matching the branding image */}
      {/* Large circle top-left */}
      <div
        className="pointer-events-none absolute -top-[20%] -left-[15%] h-[80vh] w-[80vh] rounded-full"
        style={{ backgroundColor: 'rgba(125,165,55,0.45)' }}
      />
      {/* Medium circle right */}
      <div
        className="pointer-events-none absolute -right-[10%] top-[15%] h-[60vh] w-[60vh] rounded-full"
        style={{ backgroundColor: 'rgba(125,165,55,0.3)' }}
      />
      {/* Small accent circle center-top */}
      <div
        className="pointer-events-none absolute left-[40%] top-[18%] h-[22vh] w-[22vh] rounded-full"
        style={{ backgroundColor: 'rgba(200,220,140,0.25)' }}
      />
      {/* Bottom-left circle */}
      <div
        className="pointer-events-none absolute -bottom-[12%] -left-[5%] h-[50vh] w-[50vh] rounded-full"
        style={{ backgroundColor: 'rgba(125,165,55,0.25)' }}
      />

      {/* Right cream strip */}
      <div
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-16 lg:block"
        style={{ background: 'linear-gradient(to right, rgba(234,244,216,0.3), rgba(234,244,216,0.6))' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* White OS logo */}
        <div className="mb-4">
          <Image
            src="/symbol-white.svg"
            alt="OS"
            width={200}
            height={120}
            priority
            className="h-28 w-auto sm:h-36 md:h-44"
          />
        </div>

        {/* OSCaller text badge */}
        <div className="mb-8 rounded-lg px-6 py-2" style={{ backgroundColor: 'rgba(234,244,216,0.35)' }}>
          <Image
            src="/logo-white.svg"
            alt="OSCaller"
            width={220}
            height={40}
            priority
            className="h-8 w-auto sm:h-10"
          />
        </div>

        {/* Tagline */}
        <p className="mb-2 text-sm font-medium sm:text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>
          This is where you get served faster anytime
        </p>
        <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          AI-powered dispatch. Pre-authorized. Real-time tracked.
        </p>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          className="group flex items-center gap-2 rounded-full bg-white/95 px-10 py-4 text-base font-bold shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur transition-all duration-300 hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          style={{ color: '#5A7A2A' }}
        >
          Get Started
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Bottom fade for transition */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, rgba(247,248,250,0.1), transparent)' }} />
    </section>
  )
}
