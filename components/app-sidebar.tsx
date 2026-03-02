'use client'

import { cn } from '@/lib/utils'
import type { AppPage } from '@/lib/store'

interface Props {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
  isHomePage?: boolean
}

/* Crisp inline SVG icons — no external dependency */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function RequestIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" />
    </svg>
  )
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

function SupportIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  )
}

const NAV: { page: AppPage; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { page: 'home',     label: 'Home',    Icon: HomeIcon },
  { page: 'tracking', label: 'Request', Icon: RequestIcon },
  { page: 'history',  label: 'History', Icon: HistoryIcon },
  { page: 'support',  label: 'Support', Icon: SupportIcon },
]

export function AppSidebar({ currentPage, onNavigate, isHomePage }: Props) {
  return (
    <>
      {/* ── Desktop right rail ── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col items-center justify-center gap-2 py-8 z-50',
          'fixed right-0 top-0 h-dvh w-[88px]',
          isHomePage
            ? 'bg-[#ddecc4]/80 border-l border-white/20'
            : 'bg-white/90 backdrop-blur-xl border-l border-black/[0.06] shadow-[-4px_0_24px_rgba(0,0,0,0.04)]'
        )}
        aria-label="Main navigation"
      >
        {NAV.map(({ page, label, Icon }) => {
          const active = currentPage === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                isHomePage
                  ? active
                    ? 'bg-[#7aaa2a] text-white shadow-[0_4px_16px_rgba(122,170,42,0.45)]'
                    : 'text-[#4a7a1a]/70 hover:bg-[#c8e0a0]/60 hover:text-[#3a6a10]'
                  : active
                    ? 'bg-[#8DB33F]/12 text-[#5d8a1a]'
                    : 'text-[#94a37a] hover:bg-[#8DB33F]/08 hover:text-[#5d8a1a]'
              )}
            >
              <Icon active={active} />
              <span className="sr-only">{label}</span>
            </button>
          )
        })}
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-50',
          'flex items-center justify-around px-2',
          'pt-2 pb-[max(env(safe-area-inset-bottom),10px)]',
          isHomePage
            ? 'bg-[#7aaa30]/70 border-t border-white/10'
            : 'bg-white/95 backdrop-blur-xl border-t border-black/[0.06] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]'
        )}
        aria-label="Main navigation"
      >
        {NAV.map(({ page, label, Icon }) => {
          const active = currentPage === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-[3px] px-4 py-1.5 rounded-xl transition-all duration-200',
                isHomePage
                  ? active ? 'text-white' : 'text-white/45 active:text-white'
                  : active ? 'text-[#5d8a1a]' : 'text-[#94a37a] active:text-[#5d8a1a]'
              )}
            >
              <div className="relative">
                {active && (
                  <span
                    className={cn(
                      'absolute -top-[9px] left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full',
                      isHomePage ? 'bg-white' : 'bg-[#8DB33F]'
                    )}
                    aria-hidden="true"
                  />
                )}
                <Icon active={active} />
              </div>
              <span className={cn('text-[10px] leading-none', active ? 'font-bold' : 'font-medium')}>{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
