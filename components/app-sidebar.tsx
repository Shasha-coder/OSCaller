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
    page: 'tracking',
    label: 'Request',
    path: 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75',
  },
  {
    page: 'map',
    label: 'Nearby',
    path: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    extraPath: 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  },
  {
    page: 'search',
    label: 'Search',
    path: 'M21 21l-4.35-4.35',
    extraPath: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
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
          'hidden lg:flex flex-col items-center justify-center gap-1.5 py-6 z-50 w-20 pointer-events-auto',
          'fixed right-0 top-0 h-dvh',
          'transition-colors duration-300',
          'bg-white/80 backdrop-blur-2xl border-l border-black/[0.03]'
        )}
        style={{ width: 80 }}
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
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                active
                  ? 'bg-[#EAF4D8] text-[#5a8a1a] shadow-[0_2px_12px_rgba(143,179,74,0.15)]'
                  : 'text-[#94a3b8] hover:bg-[#f1f5f0] hover:text-[#64748b]'
              )}
            >
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute -left-[1px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#8FB34A] transition-all duration-300"
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
          'lg:hidden fixed bottom-0 left-0 right-0 z-50',
          'flex items-end justify-around px-1',
          'pt-2 pb-[max(env(safe-area-inset-bottom),10px)]',
          isHomePage
            ? 'bg-[#5a8a1a]/60 backdrop-blur-xl border-t border-white/10'
            : 'bg-white/90 backdrop-blur-2xl border-t border-black/[0.05] shadow-[0_-2px_24px_rgba(0,0,0,0.06)]'
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
                'flex flex-col items-center gap-[3px] px-3 py-1.5 rounded-xl transition-all duration-200',
                isHomePage
                  ? active ? 'text-white' : 'text-white/40 active:text-white/80'
                  : active ? 'text-[#8FB34A]' : 'text-[#94a3b8] active:text-[#64748b]'
              )}
            >
              <div className="relative">
                {active && (
                  <span
                    className={cn(
                      'absolute -top-[7px] left-1/2 -translate-x-1/2 h-[2.5px] w-5 rounded-full transition-all duration-300',
                      isHomePage ? 'bg-white/80' : 'bg-[#8FB34A]'
                    )}
                    aria-hidden="true"
                  />
                )}
                <NavIcon path={path} extraPath={extraPath} active={active} />
              </div>
              <span className={cn('text-[10px] leading-none', active ? 'font-bold' : 'font-medium')}>{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
