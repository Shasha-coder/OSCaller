'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'

type Step = 'phone' | 'otp' | 'business'

/* ElevenLabs supported languages */
const LANGUAGES = [
    'English', 'French', 'Spanish', 'Arabic', 'Portuguese', 'Hindi',
    'Mandarin', 'German', 'Japanese', 'Korean', 'Italian', 'Dutch',
    'Polish', 'Turkish', 'Swedish', 'Indonesian', 'Filipino', 'Romanian',
    'Ukrainian', 'Greek', 'Czech', 'Danish', 'Finnish', 'Bulgarian',
    'Croatian', 'Slovak', 'Tamil', 'Malay',
]

const TRADES = [
    'Plumbing', 'Electrical', 'HVAC', 'Locksmith', 'Appliance Repair',
    'Roofing', 'Glass & Windows', 'Pest Control', 'General Handyman',
    'Painting', 'Cleaning', 'Landscaping',
]

export default function JoinPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('phone')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [businessName, setBusinessName] = useState('')
    const [address, setAddress] = useState('')
    const [selectedTrades, setSelectedTrades] = useState<string[]>([])
    const [language, setLanguage] = useState('English')
    const [contactEmail, setContactEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)
    const [agreed, setAgreed] = useState(false)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (resendTimer <= 0) return
        const t = setInterval(() => setResendTimer(prev => prev - 1), 1000)
        return () => clearInterval(t)
    }, [resendTimer])

    const formatPhone = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 10)
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    const haptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40)
        }
    }, [])

    const phoneDigits = phone.replace(/\D/g, '')
    const stepIdx = step === 'phone' ? 0 : step === 'otp' ? 1 : 2

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (phoneDigits.length < 10) { setError('Enter a valid 10-digit number.'); return }
        setLoading(true)
        try {
            const { error: err } = await supabase.auth.signInWithOtp({ phone: `+1${phoneDigits}` })
            if (err) { setError(err.message); setLoading(false); return }
            setStep('otp')
            setResendTimer(30)
            setLoading(false)
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } catch {
            setError('Failed to send code.')
            setLoading(false)
        }
    }

    const handleOtpChange = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return
        const next = [...otp]
        next[i] = val.slice(-1)
        setOtp(next)
        if (val && i < 5) otpRefs.current[i + 1]?.focus()
        if (val && i === 5) {
            const code = [...next.slice(0, 5), val.slice(-1)].join('')
            if (code.length === 6) setTimeout(() => verifyOtp(code), 150)
        }
    }

    const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    }

    const verifyOtp = async (code: string) => {
        setLoading(true)
        try {
            const { error: err } = await supabase.auth.verifyOtp({
                phone: `+1${phoneDigits}`, token: code, type: 'sms',
            })
            if (err) { setError(err.message); setOtp(['', '', '', '', '', '']); setLoading(false); return }
            setStep('business')
            setLoading(false)
            haptic('medium')
        } catch { setError('Verification failed.'); setLoading(false) }
    }

    const toggleTrade = (t: string) => {
        setSelectedTrades(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
        haptic('light')
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!businessName.trim()) { setError('Business name is required.'); return }
        if (!address.trim()) { setError('Business address is required.'); return }
        if (selectedTrades.length === 0) { setError('Select at least one service.'); return }
        if (!agreed) { setError('You must agree to the terms.'); return }
        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { setError('Session expired.'); setStep('phone'); setLoading(false); return }

            const { error: err } = await supabase.from('profiles').upsert({
                id: session.user.id,
                name: businessName.trim(),
                phone: session.user.phone,
                email: contactEmail.trim().toLowerCase() || null,
                role: 'provider',
                trade: selectedTrades[0],
                trades: selectedTrades,
                address: address.trim(),
                language,
                status: 'offline',
                created_at: new Date().toISOString(),
            })

            if (err) { setError(err.message); setLoading(false); return }
            haptic('heavy')
            router.push('/technician')
        } catch { setError('Registration failed.'); setLoading(false) }
    }

    return (
        <div className="flex min-h-dvh flex-col bg-gradient-to-b from-[#F6F8F4] to-[#E8F0E0]">
            <div className="h-[env(safe-area-inset-top)]" />

            <div className="flex flex-1 flex-col items-center justify-start px-5 py-8">
                <div className="w-full max-w-[440px]">

                    {/* Header */}
                    <div className="mb-6 flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8FB34A] shadow-[0_8px_30px_rgba(143,179,74,0.3)]">
                            <OSSymbol className="h-8 w-8" color="#FFFFFF" />
                        </div>
                        <h1 className="mt-4 text-xl font-bold text-[#0F172A] tracking-tight">Join OSCaller</h1>
                        <p className="mt-1 text-center text-sm text-[#64748B]">
                            {step === 'phone' && 'Get matched with clients in your area'}
                            {step === 'otp' && 'Enter verification code'}
                            {step === 'business' && 'Set up your business profile'}
                        </p>

                        {/* Social proof */}
                        <div className="mt-3 flex items-center gap-2 rounded-full bg-[#EAF4D8] px-4 py-1.5 text-xs font-semibold text-[#3a5e10]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            500+ service providers already earning
                        </div>

                        {/* Step dots */}
                        <div className="mt-4 flex items-center gap-2">
                            {[0, 1, 2].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === stepIdx ? 'w-6 bg-[#8FB34A]' : i < stepIdx ? 'w-1.5 bg-[#8FB34A]/40' : 'w-1.5 bg-[#CBD5E1]'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                            {error}
                        </div>
                    )}

                    {/* ═══ PHONE STEP ═══ */}
                    {step === 'phone' && (
                        <form onSubmit={handlePhoneSubmit} className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Business Phone</label>
                            <div className="relative mb-5">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0F172A]">+1</span>
                                <input type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                                    placeholder="(555) 123-4567" autoFocus autoComplete="tel"
                                    className="h-14 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] pl-11 pr-4 text-base font-medium text-[#0F172A] placeholder:text-[#CBD5E1] outline-none transition-colors focus:border-[#8FB34A] focus:bg-white"
                                />
                                {phoneDigits.length === 10 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#8FB34A]">
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={loading || phoneDigits.length < 10}
                                className="h-13 w-full rounded-xl bg-[#8FB34A] font-semibold text-white shadow-[0_4px_16px_rgba(143,179,74,0.3)] transition-all hover:bg-[#7da33f] active:scale-[0.98] disabled:opacity-40">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Sending…</span> : 'Send verification code'}
                            </button>
                        </form>
                    )}

                    {/* ═══ OTP STEP ═══ */}
                    {step === 'otp' && (
                        <form onSubmit={e => { e.preventDefault(); if (otp.join('').length === 6) verifyOtp(otp.join('')) }} className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                            <p className="mb-5 text-center text-sm text-[#64748B]">Code sent to <span className="font-semibold text-[#0F172A]">+1 {phone}</span></p>
                            <div className="mb-5 flex justify-center gap-2.5">
                                {otp.map((d, i) => (
                                    <input key={i} ref={el => { otpRefs.current[i] = el }} type="text" inputMode="numeric" maxLength={1} value={d}
                                        onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} autoFocus={i === 0}
                                        className={`h-14 w-12 rounded-xl border text-center text-xl font-bold outline-none transition-all ${d ? 'border-[#8FB34A] bg-[#EAF4D8] text-[#0F172A]' : 'border-[#E2E8F0] bg-[#F8FAFB] text-[#0F172A]'} focus:border-[#8FB34A] focus:ring-2 focus:ring-[#8FB34A]/20`}
                                    />
                                ))}
                            </div>
                            <button type="submit" disabled={loading || otp.join('').length < 6}
                                className="h-13 w-full rounded-xl bg-[#8FB34A] font-semibold text-white shadow-[0_4px_16px_rgba(143,179,74,0.3)] transition-all hover:bg-[#7da33f] active:scale-[0.98] disabled:opacity-40">
                                {loading ? 'Verifying…' : 'Verify'}
                            </button>
                            <div className="mt-4 flex justify-center gap-3 text-sm">
                                <button type="button" onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']) }} className="text-[#64748B] hover:text-[#0F172A]">Change number</button>
                                <span className="text-[#E2E8F0]">|</span>
                                <button type="button" disabled={resendTimer > 0} className={resendTimer > 0 ? 'text-[#94a3b8]' : 'text-[#8FB34A] hover:text-[#7da33f]'}>
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══ BUSINESS STEP ═══ */}
                    {step === 'business' && (
                        <form onSubmit={handleRegister} className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                            <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#EAF4D8] px-4 py-2.5 text-sm font-semibold text-[#3a5e10]">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Phone verified ✓
                            </div>

                            {/* Business Name */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Business Name *</label>
                                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                                    placeholder="Smith Plumbing LLC" autoFocus autoComplete="organization"
                                    className="h-13 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] px-4 text-base font-medium text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#8FB34A] focus:bg-white"
                                />
                            </div>

                            {/* Address */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Business Address *</label>
                                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                                    placeholder="123 Main St, Toronto, ON" autoComplete="street-address"
                                    className="h-13 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] px-4 text-base font-medium text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#8FB34A] focus:bg-white"
                                />
                            </div>

                            {/* Contact Email (optional) */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Contact Email <span className="normal-case font-normal">(for receipts)</span></label>
                                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                                    placeholder="info@smithplumbing.com" autoComplete="email"
                                    className="h-13 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] px-4 text-base font-medium text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#8FB34A] focus:bg-white"
                                />
                            </div>

                            {/* Language */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Preferred Language</label>
                                <select value={language} onChange={e => setLanguage(e.target.value)}
                                    className="h-13 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] px-4 text-base font-medium text-[#0F172A] outline-none focus:border-[#8FB34A] focus:bg-white appearance-none"
                                >
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>

                            {/* Services */}
                            <div className="mb-4">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Services Offered *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TRADES.map(t => (
                                        <button key={t} type="button" onClick={() => toggleTrade(t)}
                                            className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${selectedTrades.includes(t)
                                                    ? 'border-[#8FB34A] bg-[#EAF4D8] text-[#3a5e10] shadow-[0_2px_8px_rgba(143,179,74,0.15)]'
                                                    : 'border-[#E2E8F0] bg-[#F8FAFB] text-[#64748B] hover:border-[#94a3b8]'
                                                }`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Terms */}
                            <label className="mb-5 flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                                    className="mt-0.5 h-5 w-5 rounded border-[#E2E8F0] text-[#8FB34A] focus:ring-[#8FB34A]/20"
                                />
                                <span className="text-xs text-[#64748B] leading-relaxed">
                                    I agree to the <a href="/terms" className="text-[#8FB34A] underline">Terms of Service</a> and <a href="/privacy" className="text-[#8FB34A] underline">Privacy Policy</a>. I confirm this is a legitimate business.
                                </span>
                            </label>

                            <button type="submit" disabled={loading || !businessName.trim() || !address.trim() || selectedTrades.length === 0 || !agreed}
                                className="h-13 w-full rounded-xl bg-[#8FB34A] font-semibold text-white shadow-[0_4px_16px_rgba(143,179,74,0.3)] transition-all hover:bg-[#7da33f] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating…</span> : 'Start Receiving Leads'}
                            </button>
                        </form>
                    )}

                    {/* Trust badges */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-[#94a3b8]">
                        <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Encrypted
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            PIPEDA Compliant
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 3h18v18H3V3z" /><path d="M12 8v8m-4-4h8" /></svg>
                            Free to Join
                        </span>
                    </div>
                </div>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
