'use client'

import { useState } from 'react'
import { ChevronDown, Phone, MessageSquare, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const FAQ_ITEMS = [
  {
    q: 'How fast will a professional arrive?',
    a: 'For emergency requests, we typically dispatch a pro within 15-30 minutes. Urgent requests are same-day, and standard requests are scheduled within the week.',
  },
  {
    q: 'How does payment work?',
    a: 'We place a secure authorization hold via Apple Pay or Google Pay when a pro is dispatched. The actual charge is captured only when the pro arrives and you confirm.',
  },
  {
    q: 'What if I need to cancel?',
    a: 'Cancel before the pro starts traveling and the hold is released immediately. After travel begins, a small inconvenience fee may apply.',
  },
  {
    q: 'Are professionals verified?',
    a: 'All pros complete background checks and skill verification. Emergency-certified pros earn the Verified badge after completing 5+ clean jobs.',
  },
  {
    q: 'What is the Resolution Guarantee?',
    a: 'If your issue is not resolved, we dispatch a second professional at no additional call-out fee, or provide a full refund of the service charge.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full rounded-2xl bg-card p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </div>
      {open && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-200">
          {a}
        </p>
      )}
    </button>
  )
}

export function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6">

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4">
          <Phone className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Call us</span>
        </Button>
        <Button variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Live chat</span>
        </Button>
        <Button variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Report issue</span>
        </Button>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Frequently asked</h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  )
}
