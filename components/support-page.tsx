'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Phone, MessageSquare, AlertCircle, Send, X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
      className="w-full rounded-2xl bg-white/[0.04] backdrop-blur-sm p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.04)] ring-1 ring-white/[0.06] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
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

interface ChatMessage {
  id: string
  from: 'user' | 'bot'
  text: string
  time: string
}

export function SupportPage() {
  const [view, setView] = useState<SupportView>('main')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', from: 'bot', text: 'Hi! 👋 How can I help you today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { id: '2', from: 'bot', text: 'You can ask about services, booking, payments, or anything else.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [reportText, setReportText] = useState('')
  const [reportEmail, setReportEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isTyping, scrollToBottom])

  // Focus input when chat opens
  useEffect(() => {
    if (view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [view])

  const handleCall = () => {
    window.location.href = 'tel:+18001234567'
  }

  const handleSendChat = () => {
    const text = chatInput.trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      from: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsTyping(true)

    // Simulate AI response with typing indicator
    const delay = 600 + Math.random() * 1200
    setTimeout(() => {
      const responses = [
        'I understand. Let me look into that for you.',
        'Great question! Our platform connects you with verified local service providers in minutes.',
        'You can request any service from our home screen — just tap the service you need, share your location, and we\'ll match you instantly.',
        'For billing questions, all charges are transparent and shown before dispatch. No hidden fees.',
        'Would you like me to connect you with a live agent for more help?',
        'Our average response time is under 15 minutes for emergency requests.',
        'Yes, all service providers on our platform go through a verification process.',
      ]
      const reply: ChatMessage = {
        id: `msg-${Date.now()}`,
        from: 'bot',
        text: responses[Math.floor(Math.random() * responses.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setIsTyping(false)
      setChatMessages(prev => [...prev, reply])
    }, delay)
  }

  const handleSubmitReport = async () => {
    if (!reportText.trim()) { toast.error('Please describe your issue'); return }
    setSubmitting(true)
    try {
      // In production, this would go to Supabase
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
  // This uses a full-height flex layout: header (fixed) + messages (scrollable) + input (fixed)
  if (view === 'chat') {
    return (
      <div className="mx-auto flex h-full w-full max-w-lg flex-col pb-[76px] lg:pb-0">
        {/* ── Chat Header ── */}
        <div className="flex shrink-0 items-center justify-between px-1 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('main')}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground">Live Chat</h3>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C8E64C] animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Online · Typically replies instantly</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setView('main')}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Messages Area (scrollable) ── */}
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 overflow-y-auto overscroll-contain rounded-2xl bg-white/40 backdrop-blur-sm ring-1 ring-black/[0.03] px-4 py-4 space-y-3"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(200,230,76,0.2) transparent',
            }}
          >
            {/* Date separator */}
            <div className="flex items-center justify-center">
              <span className="rounded-full bg-muted/60 px-3 py-1 text-[10px] font-medium text-muted-foreground">
                Today
              </span>
            </div>

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex animate-in fade-in slide-in-from-bottom-2 duration-300',
                  msg.from === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className="flex flex-col gap-0.5 max-w-[80%]">
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      msg.from === 'user'
                        ? 'bg-[#C8E64C] text-white rounded-br-md shadow-[0_2px_8px_rgba(200,230,76,0.25)]'
                        : 'bg-white/[0.04] text-foreground ring-1 ring-black/[0.06] rounded-bl-md shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className={cn(
                    'text-[10px] px-1',
                    msg.from === 'user' ? 'text-right text-muted-foreground/60' : 'text-muted-foreground/60'
                  )}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-black/[0.06] rounded-bl-md shadow-none">
                  <span className="h-2 w-2 rounded-full bg-[#94a3b8] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#94a3b8] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-[#94a3b8] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Invisible scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── FAQ Quick Chips (show when conversation is short) ── */}
        {chatMessages.filter(m => m.from === 'user').length < 2 && !isTyping && (
          <div className="shrink-0 pt-2.5 pb-1">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { emoji: '⚡', text: 'How fast do pros arrive?' },
                { emoji: '💰', text: 'How much does it cost?' },
                { emoji: '🔒', text: 'Are providers verified?' },
                { emoji: '❌', text: 'How to cancel?' },
                { emoji: '🌍', text: 'What languages?' },
              ].map(chip => (
                <button
                  key={chip.text}
                  onClick={() => {
                    setChatInput('')
                    const userMsg: ChatMessage = {
                      id: `msg-${Date.now()}`,
                      from: 'user',
                      text: chip.text,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }
                    setChatMessages(prev => [...prev, userMsg])
                    setIsTyping(true)

                    const answers: Record<string, string> = {
                      'How fast do pros arrive?': 'Emergency requests get matched within 15-30 minutes. Urgent is same-day, standard within the week. Our fastest dispatch was 8 minutes! 🚀',
                      'How much does it cost?': 'Pricing depends on the service. You\'ll see a transparent estimate before confirming — no hidden fees, ever. A standard call-out starts around $75.',
                      'Are providers verified?': 'Yes! Every provider passes business verification, license checks, and maintains a valid business address. Licensed trades get a Verified badge ✅',
                      'How to cancel?': 'Cancel anytime before a provider is dispatched — completely free. Once dispatched, contact us and we\'ll assist immediately.',
                      'What languages?': 'We support 28+ languages! Select your preferred language when booking, and our AI handles both sides of communication seamlessly 🌏',
                    }

                    setTimeout(() => {
                      setIsTyping(false)
                      setChatMessages(prev => [...prev, {
                        id: `msg-${Date.now()}`,
                        from: 'bot',
                        text: answers[chip.text] || 'I\'d be happy to help with that!',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      }])
                    }, 600 + Math.random() * 800)
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.04] backdrop-blur-sm px-3 py-2 text-[12px] font-medium text-foreground/80 ring-1 ring-black/[0.06] shadow-none transition-all hover:bg-white/[0.04] hover:shadow-md hover:ring-[#C8E64C]/30 active:scale-[0.96]"
                >
                  <span>{chip.emoji}</span>
                  <span className="whitespace-nowrap">{chip.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar (fixed at bottom, above mobile nav) ── */}
        <div className="shrink-0 pt-2 pb-1">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendChat()
                }
              }}
              placeholder="Type a message…"
              className="flex-1 h-12 rounded-2xl border border-black/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 text-sm outline-none transition-all focus:border-[#C8E64C] focus:ring-2 focus:ring-[#C8E64C]/20 focus:bg-white/[0.06]/[0.04] placeholder:text-muted-foreground/50"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-none transition-all active:scale-95',
                chatInput.trim()
                  ? 'bg-[#C8E64C] text-white shadow-[0_4px_12px_rgba(200,230,76,0.3)] hover:bg-[#b5d440]'
                  : 'bg-muted/60 text-muted-foreground cursor-not-allowed'
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-center text-[10px] text-muted-foreground/40">
            Powered by OSCaller AI
          </p>
        </div>
      </div>
    )
  }

  // ═══ REPORT VIEW ═══
  if (view === 'report') {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('main')} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <h3 className="text-sm font-bold text-foreground">Report an Issue</h3>
          </div>
          <button onClick={() => setView('main')} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted/50 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm p-5 ring-1 ring-white/[0.06] space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your Email (optional)</label>
            <input type="email" value={reportEmail} onChange={e => setReportEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              className="h-12 w-full rounded-2xl border border-black/[0.08] bg-muted/30 px-4 text-sm outline-none focus:border-[#C8E64C] focus:ring-2 focus:ring-[#C8E64C]/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Describe the issue *</label>
            <textarea value={reportText} onChange={e => setReportText(e.target.value)} rows={4}
              placeholder="Tell us what went wrong…"
              className="w-full rounded-2xl border border-black/[0.08] bg-muted/30 px-4 py-3 text-sm outline-none resize-none focus:border-[#C8E64C] focus:ring-2 focus:ring-[#C8E64C]/20" />
          </div>
          <Button onClick={handleSubmitReport} disabled={submitting || !reportText.trim()}
            className="h-12 w-full rounded-2xl bg-[#C8E64C] text-sm font-semibold text-white shadow-[0_4px_16px_rgba(200,230,76,0.3)] hover:bg-[#b5d440] disabled:opacity-40">
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
        <Button onClick={handleCall} variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4 bg-white/[0.04] backdrop-blur-sm border-black/[0.04] hover:bg-white/[0.04]">
          <Phone className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Call us</span>
        </Button>
        <Button onClick={() => setView('chat')} variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4 bg-white/[0.04] backdrop-blur-sm border-black/[0.04] hover:bg-white/[0.04] relative">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Live chat</span>
          {/* Online indicator */}
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#C8E64C]">
            <span className="absolute inset-0 rounded-full bg-[#C8E64C] animate-ping opacity-75" />
          </span>
        </Button>
        <Button onClick={() => setView('report')} variant="outline" className="flex-1 h-auto flex-col gap-1.5 rounded-2xl py-4 bg-white/[0.04] backdrop-blur-sm border-black/[0.04] hover:bg-white/[0.04]">
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
