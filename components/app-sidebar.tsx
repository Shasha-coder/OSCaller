'use client'

import { Home, MapPin, Clock, Headphones } from 'lucide-react'
import type { AppPage } from '@/lib/store'
import { cn } from '@/lib/utils'
import { OSSymbol } from '@/components/os-logo'

interface AppSidebarProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
}

const NAV_ITEMS: { page: AppPage; icon: typeof Home; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'tracking', icon: MapPin, label: 'Request' },
  { page: 'history', icon: Clock, label: 'History' },
  { page: 'support', icon: Headphones, label: 'Support' },
]

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <>
      {/* Desktop right sidebar */}
      <aside className="hidden lg:flex fixed right-0 top-0 h-dvh w-20 flex-col items-center gap-1.5 bg-card/95 backdrop-blur-md border-l border-border/50 py-5 z-50 shadow-[-4px_0_24px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => onNavigate('home')}
          className="mb-5 flex items-center justify-center rounded-2xl p-2 transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="OSCaller home"
        >
          <OSSymbol className="h-9 w-9" color="#8FB34A" />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={cn(
                'group relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2.5 transition-all duration-200',
                currentPage === page
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={currentPage === page ? 'page' : undefined}
              aria-label={label}
            >
              {currentPage === page && (
                <span className="absolute -left-[1px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110',
                  currentPage === page && 'text-primary'
                )}
                strokeWidth={currentPage === page ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] font-medium',
                currentPage === page && 'font-semibold'
              )}>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/50 bg-card/95 backdrop-blur-md px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]" aria-label="Main navigation">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn(
              'relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-200',
              currentPage === page
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
            aria-current={currentPage === page ? 'page' : undefined}
            aria-label={label}
          >
            {currentPage === page && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-b-full bg-primary" />
            )}
            <Icon className="h-5 w-5" strokeWidth={currentPage === page ? 2.5 : 1.8} />
            <span className={cn(
              'text-[10px]',
              currentPage === page ? 'font-semibold' : 'font-medium'
            )}>{label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
