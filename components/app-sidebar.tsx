'use client'

import { Home, MapPin, Clock, Headphones } from 'lucide-react'
import type { AppPage } from '@/lib/store'
import { cn } from '@/lib/utils'
import { OSSymbol } from '@/components/os-logo'

interface AppSidebarProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
  isHomePage?: boolean
}

const NAV_ITEMS: { page: AppPage; icon: typeof Home; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'tracking', icon: MapPin, label: 'Request' },
  { page: 'history', icon: Clock, label: 'History' },
  { page: 'support', icon: Headphones, label: 'Support' },
]

export function AppSidebar({ currentPage, onNavigate, isHomePage }: AppSidebarProps) {
  return (
    <>
      {/* Desktop: fixed right rail */}
      <aside className={cn(
        'hidden lg:flex fixed right-0 top-0 h-dvh w-[72px] flex-col items-center py-6 z-50',
        isHomePage
          ? 'bg-transparent'
          : 'bg-card/80 backdrop-blur-xl border-l border-border/40 shadow-[-2px_0_20px_rgba(0,0,0,0.03)]'
      )}>
        {/* Logo at top */}
        <button
          onClick={() => onNavigate('home')}
          className="mb-8 flex items-center justify-center rounded-2xl p-2 transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Home"
        >
          <OSSymbol className="h-8 w-8" color={isHomePage ? '#FFFFFF' : '#8FB34A'} />
        </button>

        {/* Nav icons centered vertically */}
        <nav className="flex flex-1 flex-col items-center justify-center gap-2" aria-label="Main navigation">
          {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
            const isActive = currentPage === page
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={cn(
                  'group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200',
                  isHomePage
                    ? isActive
                      ? 'bg-white/25 backdrop-blur-sm'
                      : 'hover:bg-white/15'
                    : isActive
                      ? 'bg-secondary'
                      : 'hover:bg-muted'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className={cn(
                    'absolute -left-0.5 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full',
                    isHomePage ? 'bg-white' : 'bg-primary'
                  )} />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isHomePage
                      ? isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'
                      : isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile: bottom tab bar */}
      <nav className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]',
        isHomePage
          ? 'bg-[#7DA33E]/60 backdrop-blur-xl border-t border-white/10'
          : 'bg-card/90 backdrop-blur-xl border-t border-border/40 shadow-[0_-2px_20px_rgba(0,0,0,0.03)]'
      )} aria-label="Main navigation">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
          const isActive = currentPage === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition-all duration-200',
                isHomePage
                  ? isActive ? 'text-white' : 'text-white/50'
                  : isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              {/* Active dot */}
              {isActive && (
                <span className={cn(
                  'absolute -top-2 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full',
                  isHomePage ? 'bg-white' : 'bg-primary'
                )} />
              )}
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.6} />
              <span className={cn(
                'text-[10px]',
                isActive ? 'font-bold' : 'font-medium'
              )}>{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
