'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'

type Step = 'phone' | 'otp' | 'register'

export default function ProviderLoginPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('phone')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [trade, setTrade] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // ─── Uber UX: Resend timer ───
    const [resendTimer, setResendTimer] = useState(0)
    const [resendCount, setResendCount] = useState(0)

    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    // Auto-countdown for resend
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

    // Haptic feedback (mobile)
    const haptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40)
        }
    }, [])

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const digits = phone.replace(/\D/g, '')
        if (digits.length < 10) {
            setError('Please enter a valid 10-digit phone number.')
            haptic('medium')
            return
        }
        setLoading(true)
        haptic('light')

        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+1${digits}` }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to send code.')
                haptic('heavy')
                setLoading(false)
                return
            }

            setStep('otp')
            setResendTimer(30)
            setLoading(false)
            haptic('medium')
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } catch {
            setError('Failed to send verification code.')
            haptic('heavy')
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (resendTimer > 0 || resendCount >= 3) return
        setError('')
        setLoading(true)

        try {
            const digits = phone.replace(/\D/g, '')
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+1${digits}` }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to resend code.')
                haptic('heavy')
            } else {
                setResendCount(prev => prev + 1)
                setResendTimer(30 + resendCount * 15)
                setOtp(['', '', '', '', '', ''])
                otpRefs.current[0]?.focus()
                haptic('medium')
            }
            setLoading(false)
        } catch {
            setError('Failed to resend code.')
            setLoading(false)
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)
        haptic('light')

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }

        // ── Uber UX: Auto-submit when all digits entered ──
        if (value && index === 5) {
            const code = [...newOtp.slice(0, 5), value.slice(-1)].join('')
            if (code.length === 6) {
                setTimeout(() => submitOtp(code), 150) // Short delay for visual feedback
            }
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
            haptic('light')
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const newOtp = [...otp]
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i]
        }
        setOtp(newOtp)
        otpRefs.current[Math.min(pasted.length, 5)]?.focus()

        // Auto-submit if full code pasted
        if (pasted.length === 6) {
            setTimeout(() => submitOtp(pasted), 150)
        }
    }

    const submitOtp = async (code: string) => {
        setError('')
        setLoading(true)
        haptic('medium')

        try {
            const digits = phone.replace(/\D/g, '')
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+1${digits}`, code }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Invalid code.')
                haptic('heavy')
                setOtp(['', '', '', '', '', ''])
                setTimeout(() => otpRefs.current[0]?.focus(), 200)
                setLoading(false)
                return
            }

            // OTP verified — check if user has a profile
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .eq('phone', `+1${digits}`)
                .limit(1)

            const profile = profiles?.[0]

            if (!profile || !profile.name) {
                setStep('register')
                setLoading(false)
                haptic('medium')
            } else {
                // Existing user — sign in via Supabase email auth
                const fakeEmail = `tech_${digits}@oscaller.app`
                await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password: `otp_${digits}_verified`,
                })
                haptic('heavy')
                router.push('/provider')
            }
        } catch {
            setError('Verification failed. Please try again.')
            haptic('heavy')
            setLoading(false)
        }
    }

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const code = otp.join('')
        if (code.length < 6) {
            setError('Please enter the full 6-digit code.')
            haptic('medium')
            return
        }
        submitOtp(code)
    }

    const handleRegistration = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!name.trim() || !email.trim() || !trade) {
            setError('All fields are required.')
            haptic('medium')
            return
        }

        // Client-side email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.')
            haptic('medium')
            return
        }

        setLoading(true)
        haptic('light')

        try {
            const digits = phone.replace(/\D/g, '')
            const fakeEmail = `tech_${digits}@oscaller.app`
            const fakePassword = `otp_${digits}_verified`

            // Create Supabase user (or sign in if exists)
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: fakePassword,
            })

            if (signUpError && !signUpError.message.includes('already registered')) {
                // If already registered, sign in instead
                const { error: signInErr } = await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password: fakePassword,
                })
                if (signInErr) {
                    setError('Account setup failed. Please try again.')
                    haptic('heavy')
                    setLoading(false)
                    return
                }
            }

            const { data: { session } } = await supabase.auth.getSession()
            const userId = session?.user?.id || signUpData?.user?.id

            if (!userId) {
                setError('Session expired. Please start over.')
                setStep('phone')
                setLoading(false)
                return
            }

            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    phone: `+1${digits}`,
                    role: 'provider',
                    trade,
                    status: 'offline',
                    created_at: new Date().toISOString(),
                })

            if (upsertError) {
                setError(upsertError.message)
                haptic('heavy')
                setLoading(false)
                return
            }

            haptic('heavy')
            router.push('/provider')
        } catch {
            setError('Registration failed. Please try again.')
            haptic('heavy')
            setLoading(false)
        }
    }

    const trades = ['Plumbing', 'Electrical', 'HVAC', 'Locksmith', 'Appliance', 'Roofing', 'Glass', 'Pest Control']
    const phoneDigits = phone.replace(/\D/g, '')

    // ─── Step progress indicator ───
    const stepIdx = step === 'phone' ? 0 : step === 'otp' ? 1 : 2

    return (
        <div className="flex min-h-dvh flex-col bg-[#F6F8F4]">
            {/* Safe area top spacing for mobile notch */}
            <div className="h-[env(safe-area-inset-top)]" />

            <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
                <div className="w-full max-w-[400px]">
                    {/* Logo + Step indicator */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8FB34A] shadow-[0_8px_30px_rgba(143,179,74,0.3)]">
                            <OSSymbol className="h-8 w-8" color="#FFFFFF" />
                        </div>
                        <h1 className="mt-4 text-xl font-bold text-[#0F172A] tracking-tight">Provider Portal</h1>
                        <p className="mt-1 text-sm text-[#64748B]">
                            {step === 'phone' && 'Enter your phone number to get started'}
                            {step === 'otp' && 'Enter the verification code'}
                            {step === 'register' && 'Complete your profile'}
                        </p>

                        {/* Step dots */}
                        <div className="mt-4 flex items-center gap-2">
                            {[0, 1, 2].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === stepIdx ? 'w-6 bg-[#8FB34A]' : i < stepIdx ? 'w-1.5 bg-[#8FB34A]/40' : 'w-1.5 bg-[#E2E8F0]'
                                    }`} />
                            ))}
                        </div>
                    </div>

                    {/* ═══ Phone Step ═══ */}
                    {step === 'phone' && (
                        <form onSubmit={handlePhoneSubmit} className="rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in shake-x duration-300">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
                                Phone Number
                            </label>
                            <div className="relative mb-5">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0F172A]">+1</span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(formatPhone(e.target.value))}
                                    placeholder="(555) 123-4567"
                                    autoFocus
                                    autoComplete="tel"
                                    className="h-14 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] pl-11 pr-4 text-base font-medium text-[#0F172A] placeholder:text-[#CBD5E1] outline-none transition-colors focus:border-[#8FB34A] focus:bg-white"
                                />
                                {/* Checkmark when valid */}
                                {phoneDigits.length === 10 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#8FB34A] animate-in zoom-in duration-200">
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || phoneDigits.length < 10}
                                className="h-13 w-full rounded-xl bg-[#8FB34A] font-semibold text-white shadow-[0_4px_16px_rgba(143,179,74,0.3)] transition-all hover:bg-[#7da33f] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Sending…
                                    </span>
                                ) : 'Send verification code'}
                            </button>

                            <p className="mt-4 text-center text-xs text-[#94a3b8]">
                                We'll send a 6-digit code via SMS
                            </p>
                        </form>
                    )}

                    {/* ═══ OTP Step ═══ */}
                    {step === 'otp' && (
                        <form onSubmit={handleOtpSubmit} className="rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in duration-300">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                                    {error}
                                </div>
                            )}

                            <p className="mb-5 text-center text-sm text-[#64748B]">
                                Code sent to <span className="font-semibold text-[#0F172A]">+1 {phone}</span>
                            </p>

                            <div className="mb-5 flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => { otpRefs.current[i] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                        autoFocus={i === 0}
                                        className={`h-14 w-12 rounded-xl border text-center text-xl font-bold outline-none transition-all ${digit
                                            ? 'border-[#8FB34A] bg-[#EAF4D8] text-[#0F172A]'
                                            : 'border-[#E2E8F0] bg-[#F8FAFB] text-[#0F172A]'
                                            } focus:border-[#8FB34A] focus:bg-white focus:ring-2 focus:ring-[#8FB34A]/20`}
                                    />
                                ))}
                            </div>

                            {loading && (
                                <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[#8FB34A] font-medium animate-in fade-in">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#8FB34A]/30 border-t-[#8FB34A]" />
                                    Verifying…
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || otp.join('').length < 6}
                                className="h-13 w-full rounded-xl bg-[#8FB34A] font-semibold text-white shadow-[0_4px_16px_rgba(143,179,74,0.3)] transition-all hover:bg-[#7da33f] active:scale-[0.98] disabled:opacity-40"
                            >
                                Verify code
                            </button>

                            {/* Resend with timer */}
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); setResendTimer(0) }}
                                    className="text-sm text-[#64748B] font-medium hover:text-[#0F172A] transition-colors"
                                >
                                    Change number
                                </button>
                                <span className="text-[#E2E8F0]">|</span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || resendCount >= 3 || loading}
                                    className={`text-sm font-medium transition-colors ${resendTimer > 0 ? 'text-[#94a3b8] cursor-default' : 'text-[#8FB34A] hover:text-[#7da33f]'
                                        }`}
                                >
                                    {resendTimer > 0
                                        ? `Resend in ${resendTimer}s`
                                        : resendCount >= 3
                                            ? 'Max attempts'
                                            : 'Resend code'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══ Registration Step ═══ */}
                    {step === 'register' && (
                        <form onSubmit={handleRegistration} className="rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in duration-300">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                                    {error}
                                </div>
                            )}

                            <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#EAF4D8] px-4 py-2.5 text-sm font-semibold text-[#3a5e10]">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Phone verified ✓
                            </div>

                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Smith"
                                    autoFocus
                                    autoComplete="name"
                                    className="h-13 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] px-4 text-base font-medium text-[#0F172A] placeholder:text-[#CBD5E1] outline-none transition-colors focus:border-[#8FB34A] focus:bg-white"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Recovery Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    autoComplete="email"
                                    className="h-13 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFB] px-4 text-base font-medium text-[#0F172A] placeholder:text-[#CBD5E1] outline-none transition-colors focus:border-[#8FB34A] focus:bg-white"
                                />
                                <p className="mt-1 text-[11px] text-[#94a3b8]">Used for account recovery if you change your number</p>
                            </div>

                            <div className="mb-5">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Primary Trade</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {trades.map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => { setTrade(t); haptic('light') }}
                                            className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold transition-all active:scale-[0.97] ${trade === t
                                                ? 'border-[#8FB34A] bg-[#EAF4D8] text-[#3a5e10] shadow-[0_2px_8px_rgba(143,179,74,0.15)]'
                                                : 'border-[#E2E8F0] bg-[#F8FAFB] text-[#64748B] hover:border-[#94a3b8]'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !name.trim() || !email.trim() || !trade}
                                className="h-13 w-full rounded-xl bg-[#8FB34A] font-semibold text-white shadow-[0_4px_16px_rgba(143,179,74,0.3)] transition-all hover:bg-[#7da33f] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Creating account…
                                    </span>
                                ) : 'Complete registration'}
                            </button>
                        </form>
                    )}

                    {/* Trust badges */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-[#94a3b8]">
                        <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Encrypted
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Verified
                        </span>
                        <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                            HIPAA-ready
                        </span>
                    </div>
                </div>
            </div>

            {/* Safe area bottom */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
