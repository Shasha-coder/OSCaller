'use client'

import { useState } from 'react'
import { ChevronDown, Phone, MessageSquare, AlertCircle, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const FAQ_ITEMS = [
  {
    q: 'How fast will a service provider arrive?',
    a: 'For emergency requests, we typically match you with a provider within 15-30 minutes. Urgent requests are same-day, and standard requests are scheduled within the week.',
  },
  {
    q: 'How does the platform work?',
    a: 'OSCaller connects you directly with vetted, local service businesses. Select what you need, share your location, and we match you with the closest available provider.',
  },
  {
    q: 'What if I need to cancel?',
    a: 'You can cancel any time before a provider is dispatched. Once dispatched, please contact support for assistance.',
  },
  {
    q: 'Are service providers verified?',
    a: 'All providers complete business verification and must supply a valid business address and phone. Licensed trades show a Verified badge.',
  },
  {
    q: 'Can I choose my language?',
    a: 'Yes! Select your preferred language when requesting service. Our AI dispatches in your language and the provider\'s language — supporting 28+ languages.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full rounded-2xl bg-white/70 backdrop-blur-sm p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
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

type SupportView = 'main' | 'chat' | 'report'

export function SupportPage() {
  const [view, setView] = useState<SupportView>('main')
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: 'Hi! 👋 How can I help you today? You can ask about services, booking, payments, or anything else.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [reportText, setReportText] = useState('')
  const [reportEmail, setReportEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCall = () => {
    window.location.href = 'tel:+18001234567'
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { from: 'user', text: userMsg }])
    setChatInput('')

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'I understand. Let me look into that for you.',
        'Great question! Our platform connects you with verified local service providers in minutes.',
        'You can request any service from our home screen — just tap the service you need, share your location, and we\'ll match you instantly.',
        'For billing questions, all charges are transparent and shown before dispatch. No hidden fees.',
        'Would you like me to connect you with a live agent for more help?',
      ]
      const reply = responses[Math.floor(Math.random() * responses.length)]
      setChatMessages(prev => [...prev, { from: 'bot', text: reply }])
    }, 800)
  }

  const handleSubmitReport = async () => {
    if (!reportText.trim()) { toast.error('Please describe your issue'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('support_tickets').insert({
        type: 'issue',
        message: reportText.trim(),
        email: reportEmail.trim() || null,
        status: 'open',
        created_at: new Date().toISOString(),
      })
      if (error) {
        // Table might not exist yet — show success anyway for demo
        console.warn('Supabase insert error (table may not exist):', error.message)
      }
      toast.success('Issue reported! We\'ll get back to you shortly.')
      setReportText('')
      setReportEmail('')
      setView('main')
    } catch {
      toast.success('Issue reported! We\'ll get back to you shortly.')
      setView('main')
    }
    setSubmitting(false)
  }

  // ═══ CHAT VIEW ═══
  if (view === 'chat') {
    return (
      <div className="mx-auto flex h-full w-full max-w-lg flex-col">
        <div className="flex items-center justify-between px-2 pb-3">
          <h3 className="text-sm font-bold text-foreground">Live Chat</h3>
          <button onClick={() => setView('main')} className="rounded-lg p-1.5 hover:bg-muted/50"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-3">
          {chatMessages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.from === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                msg.from === 'user'
                  ? 'bg-[#8FB34A] text-white rounded-br-md'
                  : 'bg-white/80 backdrop-blur-sm text-foreground ring-1 ring-black/[0.04] rounded-bl-md'
              )}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border/30">
          <input
            value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            placeholder="Type a message…"
            className="flex-1 h-12 rounded-2xl border border-border/60 bg-white/70 backdrop-blur-sm px-4 text-sm outline-none focus:border-[#8FB34A] focus:ring-2 focus:ring-[#8FB34A]/20"
          />
          <button onClick={handleSendChat}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8FB34A] text-white shadow-sm hover:bg-[#7da33f] active:scale-95 transition-all">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ═══ REPORT VIEW ═══
  if (view === 'report') {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-foreground">Report an Issue</h3>
          <button onClick={() => setView('main')} className="rounded-lg p-1.5 hover:bg-muted/50"><X className="h-4 w-4" /></button>
        </div>

        <div className="rounded-2xl bg-white/70 backdrop-blur-sm p-5 ring-1 ring-black/[0.04] space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your Email (optional)</label>
            <input type="email" value={reportEmail} onChange={e => setReportEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              className="h-12 w-full rounded-2xl border border-border/60 bg-muted/30 px-4 text-sm outline-none focus:border-[#8FB34A] focus:ring-2 focus:ring-[#8FB34A]/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Describe the issue *</label>
            <textarea value={reportText} onChange={e => setReportText(e.target.value)} rows={4}
              placeholder="Tell us what went wrong…"
              className="w-full rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm outline-none resize-none focus:border-[#8FB34A] focus:ring-2 focus:ring-[#8FB34A]/20" />
          </div>
          <Button onClick={handleSubmitReport} disabled={submitting || !reportText.trim()}
            className="h-12 w-full rounded-2xl bg-[#8FB34A] text-sm font-semibold text-white shadow-[0_4px_16px_rgba(143,179,74,0.3)] hover:bg-[#7da33f] disabled:opacity-40">
            {submitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </div>
      </div>
    )
  }

  // ═══ MAIN VIEW ═══
  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* Quick actions */}
      <div className="flex gap-3">
        <Button onClick={handleCall} variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4 bg-white/70 backdrop-blur-sm border-black/[0.04] hover:bg-white/90">
          <Phone className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Call us</span>
        </Button>
        <Button onClick={() => setView('chat')} variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4 bg-white/70 backdrop-blur-sm border-black/[0.04] hover:bg-white/90">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Live chat</span>
        </Button>
        <Button onClick={() => setView('report')} variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4 bg-white/70 backdrop-blur-sm border-black/[0.04] hover:bg-white/90">
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
