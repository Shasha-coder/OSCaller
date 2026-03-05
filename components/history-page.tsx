'use client'

import { useEffect, useState } from 'react'
import { Clock, ChevronRight, Droplets, Zap, Thermometer, KeyRound, Home, Bug, Wrench, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const SERVICE_ICON_MAP: Record<string, typeof Droplets> = {
  plumbing: Droplets,
  electrical: Zap,
  hvac: Thermometer,
  locksmith: KeyRound,
  roofing: Home,
  pest: Bug,
  appliance: Wrench,
  glass: ShieldCheck,
}

interface HistoryItem {
  id: string
  service: string
  address: string
  date: string
  status: 'completed' | 'cancelled' | 'disputed'
  amount: string
  provider: string
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-primary/10 text-primary',
  cancelled: 'bg-muted text-muted-foreground',
  disputed: 'bg-destructive/10 text-destructive',
}

function HistorySkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-3">
      <div className="h-3 w-24 rounded bg-muted animate-pulse mb-4" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
          <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
            <div className="h-3 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const Icon = SERVICE_ICON_MAP[item.service] || Droplets

  return (
    <button className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] active:scale-[0.99]">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground capitalize">{item.service}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', STATUS_STYLES[item.status])}>
            {item.status}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.address}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{item.date}</span>
          <span className="text-border">|</span>
          <span>{item.provider}</span>
          <span className="text-border">|</span>
          <span className="font-semibold text-foreground">{item.amount}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
    </button>
  )
}

export function HistoryPage({ onDataLoaded }: { onDataLoaded?: (hasData: boolean) => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Fetch completed/cancelled service requests for this user
        const { data, error } = await supabase
          .from('service_requests')
          .select('*')
          .eq('customer_id', user.id)
          .in('status', ['completed', 'cancelled', 'disputed'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) {
          console.error('[v0] History fetch error:', error)
          setLoading(false)
          return
        }

        const items: HistoryItem[] = (data || []).map((r: any) => ({
          id: r.id,
          service: r.service,
          address: r.address,
          date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: r.status as 'completed' | 'cancelled' | 'disputed',
          amount: r.amount ? `$${Number(r.amount).toFixed(0)}` : '$0',
          provider: r.technician_name || '-',
        }))

        setHistory(items)
        onDataLoaded?.(items.length > 0)
      } catch (err) {
        console.error('[v0] History fetch exception:', err)
        onDataLoaded?.(false)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  if (loading) return <HistorySkeleton />

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Clock className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">No requests yet</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your completed and past requests will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-3">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Past requests</h2>
      {history.map(item => (
        <HistoryCard key={item.id} item={item} />
      ))}
    </div>
  )
}
