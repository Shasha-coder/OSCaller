'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const ALL_SERVICES = [
  { label: 'Plumbing', tags: ['pipe', 'leak', 'drain', 'toilet', 'water'], icon: 'M12 2C6 2 3 7 3 10c0 2 1 4 2 5h14c1-1 2-3 2-5 0-3-3-8-9-8Z M10 22h4 M9 17v2a3 3 0 0 0 6 0v-2' },
  { label: 'Electrical', tags: ['power', 'outlet', 'fuse', 'wiring', 'circuit'], icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z' },
  { label: 'HVAC', tags: ['ac', 'heating', 'cooling', 'air', 'vent'], icon: 'M9 6a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM17.196 9c.456.607.804 1.271 1 2M6.804 9A8.965 8.965 0 0 0 6 11c0 4.418 3.582 8 8 8s8-3.582 8-8' },
  { label: 'Locksmith', tags: ['lock', 'key', 'door', 'safe', 'entry'], icon: 'M15.75 5C15.75 3.343 14.407 2 12.75 2h-1.5C9.593 2 8.25 3.343 8.25 5v2.25H6a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 6 22.25h12a2.25 2.25 0 0 0 2.25-2.25V9.5A2.25 2.25 0 0 0 18 7.25h-2.25V5Z M12 13.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z' },
  { label: 'Appliance Repair', tags: ['fridge', 'washer', 'dryer', 'oven', 'appliance'], icon: 'M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Z M8 7h2 M8 12h8 M8 17h4' },
  { label: 'Roofing', tags: ['roof', 'shingle', 'gutter', 'leak', 'tile'], icon: 'M2.25 12 12 2.25l9.75 9.75M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75' },
  { label: 'Glass & Windows', tags: ['glass', 'window', 'broken', 'crack', 'pane'], icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
  { label: 'Pest Control', tags: ['pest', 'bug', 'rodent', 'ant', 'termite'], icon: 'M12 3C7.5 3 4 6 4 9.5c0 2 1 3.5 2 4.5 0 0-1 1.5-1 3h14c0-1.5-1-3-1-3 1-1 2-2.5 2-4.5C20 6 16.5 3 12 3Z M9 9h.01 M15 9h.01 M9.5 14s1 1 2.5 1 2.5-1 2.5-1' },
]

const RECENT = ['Leaking pipe', 'No hot water', 'Power outage', 'Lost keys']

export function SearchPage() {
  const [query, setQuery] = useState('')

  const results = query.trim().length > 0
    ? ALL_SERVICES.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some((t) => t.includes(query.toLowerCase()))
      )
    : []

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">

      {/* Search input */}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          type="search"
          autoFocus
          placeholder="Search for a service or issue…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground shadow-[0_2px_12px_rgba(0,0,0,0.05)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Recent searches */}
      {!query && (
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
          <div className="flex flex-wrap gap-2">
            {RECENT.map((r) => (
              <button
                key={r}
                onClick={() => setQuery(r)}
                className="flex items-center gap-2 rounded-xl bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition hover:shadow-[0_2px_12px_rgba(0,0,0,0.1)] active:scale-[0.97]"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
                </svg>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All services (when no query) */}
      {!query && (
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Services</p>
          <div className="space-y-2">
            {ALL_SERVICES.map((s) => (
              <ServiceRow key={s.label} label={s.label} icon={s.icon} />
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {query && results.length > 0 && (
        <div className="space-y-2">
          {results.map((s) => (
            <ServiceRow key={s.label} label={s.label} icon={s.icon} />
          ))}
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p className="text-base font-semibold text-foreground">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muted-foreground">Try a different keyword or browse all services.</p>
        </div>
      )}
    </div>
  )
}

function ServiceRow({ label, icon }: { label: string; icon: string }) {
  return (
    <button className="flex w-full items-center gap-4 rounded-2xl bg-card px-4 py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)] active:scale-[0.99]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <span className="flex-1 text-left text-sm font-semibold text-foreground">{label}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  )
}
