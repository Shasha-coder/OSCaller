'use client'

import { Home, MapPin, Clock, Headphones } from 'lucide-react'
import Image from 'next/image'
import type { AppPage } from '@/lib/store'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
}

const NAV_ITEMS: { page: AppPage; icon: typeof Home; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'tracking', icon: MapPin, label: 'Tracking' },
  { page: 'history', icon: Clock, label: 'History' },
  { page: 'support', icon: Headphones, label: 'Support' },
]

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-24 flex-col items-center gap-2 border-l border-border bg-card py-6 z-50">
        <button
          onClick={() => onNavigate('home')}
          className="mb-6 flex items-center justify-center rounded-2xl p-2 transition-transform hover:scale-105"
          aria-label="OSCaller home"
        >
          <Image src="/symbol-green.svg" alt="OSCaller" width={44} height={44} />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-3" aria-label="Main navigation">
          {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={cn(
                'group flex flex-col items-center gap-1 rounded-2xl p-3 transition-all duration-200',
                currentPage === page
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground'
              )}
              aria-current={currentPage === page ? 'page' : undefined}
              aria-label={label}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-200 group-hover:scale-105',
                  currentPage === page && 'text-primary'
                )}
              />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)] pt-2" aria-label="Main navigation">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-200',
              currentPage === page
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
            aria-current={currentPage === page ? 'page' : undefined}
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
