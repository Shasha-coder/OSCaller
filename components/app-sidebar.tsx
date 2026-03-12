'use client'

import { cn } from '@/lib/utils'
import type { AppPage } from '@/lib/store'

interface Props {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
  isHomePage?: boolean
}

const NAV: { page: AppPage; label: string; path: string; extraPath?: string }[] = [
  {
    page: 'home',
    label: 'Home',
    path: 'M2.25 12l8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
  },
  {
    page: 'map',
    label: 'Request',
    path: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    extraPath: 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  },
  {
    page: 'history',
    label: 'History',
    path: 'M12 6v6h4.5M3.75 12a8.25 8.25 0 1 1 16.5 0 8.25 8.25 0 0 1-16.5 0Z',
    extraPath: 'M3 3.75V7.5h3.75M3.75 12A8.25 8.25 0 0 1 7.39 5.16',
  },
  {
    page: 'support',
    label: 'Support',
    path: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
]

function NavIcon({ path, extraPath, active }: { path: string; extraPath?: string; active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.1 : 1.6}>
      <path d={path} />
      {extraPath && <path d={extraPath} />}
    </svg>
  )
}

export function AppSidebar({ currentPage, onNavigate, isHomePage }: Props) {
  return (
    <>
      {/* ─── Desktop right rail ─── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col items-center justify-center gap-1.5 py-6 z-50 pointer-events-auto',
          'fixed right-0 top-0 h-dvh',
          'backdrop-blur-2xl transition-colors duration-300',
          'bg-white/[0.03]'
        )}
        style={{ width: 80, borderLeft: '1px solid transparent', borderImage: 'linear-gradient(to bottom, rgba(200,230,76,0.15), rgba(255,255,255,0.06), rgba(200,230,76,0.1)) 1' }}
        aria-label="Main navigation"
      >
        {NAV.map(({ page, label, path, extraPath }) => {
          const active = currentPage === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              title={label}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-250 w-[60px] h-[60px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E64C]/40',
                active
                  ? 'bg-[#C8E64C]/10 text-[#C8E64C] shadow-[0_2px_16px_rgba(200,230,76,0.15)]'
                  : 'text-white/35 hover:bg-white/[0.05] hover:text-white/60'
              )}
            >
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute -left-[1px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#C8E64C] transition-all duration-300"
                  aria-hidden="true"
                />
              )}
              <NavIcon path={path} extraPath={extraPath} active={active} />
              <span className={cn(
                'text-[9px] tracking-wide transition-colors duration-200',
                active ? 'font-bold' : 'font-medium'
              )}>{label}</span>
            </button>
          )
        })}
      </aside>

      {/* ─── Mobile bottom bar ─── */}
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-auto',
          'flex items-center justify-around',
          'pt-2 pb-[max(env(safe-area-inset-bottom),8px)]',
          'bg-[#141414] border-t border-white/[0.06]'
        )}
        aria-label="Main navigation"
      >
        {NAV.map(({ page, label, path, extraPath }) => {
          const active = currentPage === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center gap-1.5 px-5 py-2 transition-all duration-200',
                active ? 'text-[#C8E64C]' : 'text-white/40 active:text-white/55'
              )}
            >
              {/* Active indicator line ABOVE icon */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-8 rounded-b-full bg-[#C8E64C]"
                  aria-hidden="true"
                />
              )}
              <NavIcon path={path} extraPath={extraPath} active={active} />
              <span className={cn('text-[11px] leading-none tracking-wide', active ? 'font-semibold' : 'font-medium')}>{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
