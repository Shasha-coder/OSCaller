'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'

type Step = 'phone' | 'otp' | 'register' | 'email' | 'email_sent'

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
    const [lockoutTimer, setLockoutTimer] = useState(0)

    // Auto-countdown for lockout
    useEffect(() => {
        if (lockoutTimer <= 0) return
        const t = setInterval(() => setLockoutTimer(prev => prev - 1), 1000)
        return () => clearInterval(t)
    }, [lockoutTimer])

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
                if (res.status === 429 && data.retryAfter) {
                    setLockoutTimer(data.retryAfter)
                    setError(data.error || 'Too many attempts.')
                } else {
                    setError(data.error || 'Failed to send code.')
                }
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

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.')
            haptic('medium')
            return
        }
        setLoading(true)
        haptic('light')

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim().toLowerCase(),
                options: {
                    emailRedirectTo: `${window.location.origin}/provider`,
                },
            })

            if (error) {
                setError(error.message)
                haptic('heavy')
                setLoading(false)
                return
            }

            setStep('email_sent')
            setLoading(false)
            haptic('medium')
        } catch {
            setError('Failed to send magic link.')
            haptic('heavy')
            setLoading(false)
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

            // OTP verified — Try to authenticate FIRST (bypasses RLS block on profiles)
            const fakeEmail = `tech_${digits}@oscaller.app`
            const fakePassword = `otp_${digits}_verified`

            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password: fakePassword,
            })

            if (signInErr) {
                // New user - sign them up
                const { error: signUpError } = await supabase.auth.signUp({
                    email: fakeEmail,
                    password: fakePassword,
                    options: { data: { role: 'provider' } }
                })

                if (signUpError) {
                    setError('Authentication setup failed. Please try again.')
                    haptic('heavy')
                    setLoading(false)
                    return
                }

                // Force sign in after sign up
                await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password: fakePassword,
                })
            }

            // User is now safely authenticated, RLS will allow profile reads
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setError('Session initialization failed.')
                haptic('heavy')
                setLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (!profile || !profile.name) {
                // Incomplete profile, send to registration step
                setStep('register')
                setLoading(false)
                haptic('medium')
            } else {
                // Fully complete, take to dashboard
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

            // Since submitOtp authenticated the user, we just fetch their session
            const { data: { session } } = await supabase.auth.getSession()
            const userId = session?.user?.id

            if (!userId) {
                setError('Session expired. Please restart the login process.')
                setStep('phone')
                setLoading(false)
                return
            }

            // First check if the phone number already exists in profiles for *another* user
            const { data: existingProfiles, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone', `+1${digits}`)
                .neq('id', userId) // Exclude current user's profile
                .limit(1)

            if (checkError) {
                console.error("Profile check error:", checkError)
                // Continue with registration anyway, as upsert will handle unique constraints
            } else if (existingProfiles && existingProfiles.length > 0) {
                // Phone number is already tied to another account
                setError('This phone number is already registered to another account. Please use a different number or login to that account.')
                haptic('heavy')
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
        <div className="flex min-h-dvh flex-col bg-transparent text-white">
            {/* Safe area top spacing for mobile notch */}
            <div className="h-[env(safe-area-inset-top)]" />

            <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
                <div className="w-full max-w-[400px]">
                    {/* Logo + Step indicator */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#8FB34A] shadow-[0_8px_30px_rgba(143,179,74,0.4)] border border-[#8FB34A]/50">
                            <OSSymbol className="h-10 w-10" color="#FFFFFF" />
                        </div>
                        <h1 className="mt-6 text-2xl font-bold text-white tracking-tight drop-shadow-sm">Provider Portal</h1>
                        <p className="mt-1.5 text-sm text-white/60 font-medium text-center">
                            {step === 'phone' && 'Enter your phone number to get started'}
                            {step === 'otp' && 'Enter the verification code'}
                            {step === 'register' && 'Complete your profile'}
                            {step === 'email' && 'Enter your recovery email'}
                            {step === 'email_sent' && 'Check your inbox'}
                        </p>

                        {/* Step dots */}
                        {step !== 'email' && step !== 'email_sent' && (
                            <div className="mt-4 flex items-center gap-2">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === stepIdx ? 'w-6 bg-[#8FB34A]' : i < stepIdx ? 'w-1.5 bg-[#8FB34A]/40' : 'w-1.5 bg-[#E2E8F0]'
                                        }`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ═══ Phone Step ═══ */}
                    {step === 'phone' && (
                        <form onSubmit={handlePhoneSubmit} className="rounded-3xl bg-white/10 backdrop-blur-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/10">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in shake-x duration-300">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">
                                Phone Number
                            </label>
                            <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-white/90">+1</span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(formatPhone(e.target.value))}
                                    placeholder="(555) 123-4567"
                                    autoFocus
                                    autoComplete="tel"
                                    className="h-14 w-full rounded-2xl border border-white/20 bg-black/20 pl-12 pr-4 text-lg font-bold text-white placeholder:text-white/20 outline-none transition-all focus:border-[#8FB34A] focus:bg-black/40 focus:ring-2 focus:ring-[#8FB34A]/20"
                                />
                                {/* Checkmark when valid */}
                                {phoneDigits.length === 10 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#8FB34A] animate-in zoom-in duration-300 shadow-[0_0_15px_rgba(143,179,74,0.5)]">
                                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || phoneDigits.length < 10 || lockoutTimer > 0}
                                className="h-14 w-full rounded-2xl bg-[#8FB34A] font-bold text-white text-lg shadow-[0_8px_30px_rgba(143,179,74,0.4)] transition-all hover:bg-[#7da33f] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed border border-[#8FB34A]/50"
                            >
                                {lockoutTimer > 0 ? (
                                    `Try again in ${Math.floor(lockoutTimer / 60)}:${(lockoutTimer % 60).toString().padStart(2, '0')}`
                                ) : loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Sending…
                                    </span>
                                ) : 'Send verification code'}
                            </button>

                            <p className="mt-5 text-center text-xs font-bold uppercase tracking-widest text-white/40">
                                We'll send a 6-digit code via SMS
                            </p>

                            <div className="mt-6 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setError('') }}
                                    className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                                >
                                    Lost access to your phone?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══ OTP Step ═══ */}
                    {step === 'otp' && (
                        <form onSubmit={handleOtpSubmit} className="rounded-3xl bg-white/10 backdrop-blur-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/10">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in duration-300">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                                    {error}
                                </div>
                            )}

                            <p className="mb-6 text-center text-sm text-white/60 font-medium">
                                Code sent to <span className="font-bold text-white">+1 {phone}</span>
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
                                        className={`h-14 w-12 rounded-2xl border text-center text-xl font-bold outline-none transition-all ${digit
                                            ? 'border-[#8FB34A] bg-[#8FB34A]/20 text-white shadow-[0_4px_20px_rgba(143,179,74,0.2)]'
                                            : 'border-white/20 bg-black/20 text-white placeholder:text-white/20'
                                            } focus:border-[#8FB34A] focus:bg-black/40 focus:ring-2 focus:ring-[#8FB34A]/20`}
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
                                className="h-14 w-full mt-2 rounded-2xl bg-[#8FB34A] font-bold text-white text-lg shadow-[0_8px_30px_rgba(143,179,74,0.4)] transition-all hover:bg-[#7da33f] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed border border-[#8FB34A]/50"
                            >
                                Verify code
                            </button>

                            {/* Resend with timer */}
                            <div className="mt-6 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); setResendTimer(0) }}
                                    className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                                >
                                    Change number
                                </button>
                                <span className="text-white/20">|</span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || resendCount >= 3 || loading}
                                    className={`text-xs font-bold uppercase tracking-widest transition-colors ${resendTimer > 0 ? 'text-white/30 cursor-default' : 'text-[#8FB34A] hover:text-[#7da33f]'
                                        }`}
                                >
                                    {resendTimer > 0
                                        ? `Resend in ${resendTimer}s`
                                        : resendCount >= 3
                                            ? 'Max attempts'
                                            : 'Resend code'}
                                </button>
                            </div>

                            <div className="mt-4 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(''); setResendTimer(0) }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
                                >
                                    Login with email instead
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══ Registration Step ═══ */}
                    {step === 'register' && (
                        <form onSubmit={handleRegistration} className="rounded-3xl bg-white/10 backdrop-blur-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/10">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in duration-300">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                                    {error}
                                </div>
                            )}

                            <div className="mb-5 flex items-center gap-2 rounded-2xl bg-[#8FB34A]/20 border border-[#8FB34A]/30 px-4 py-3 text-sm font-bold text-white tracking-wide">
                                <svg className="h-4 w-4 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Phone verified ✓
                            </div>

                            <div className="mb-5">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Smith"
                                    autoFocus
                                    autoComplete="name"
                                    className="h-14 w-full rounded-2xl border border-white/20 bg-black/20 px-5 text-base font-bold text-white placeholder:text-white/20 outline-none transition-all focus:border-[#8FB34A] focus:bg-black/40 focus:ring-2 focus:ring-[#8FB34A]/20"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">Recovery Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    autoComplete="email"
                                    className="h-14 w-full rounded-2xl border border-white/20 bg-black/20 px-5 text-base font-bold text-white placeholder:text-white/20 outline-none transition-all focus:border-[#8FB34A] focus:bg-black/40 focus:ring-2 focus:ring-[#8FB34A]/20"
                                />
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">Used for account recovery</p>
                            </div>

                            <div className="mb-7">
                                <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-white/50 text-center">Primary Trade</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {trades.map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => { setTrade(t); haptic('light') }}
                                            className={`flex items-center justify-center rounded-2xl border px-3 py-3.5 text-sm font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] ${trade === t
                                                ? 'border-[#8FB34A]/50 bg-[#8FB34A]/20 text-white shadow-[0_4px_20px_rgba(143,179,74,0.3)]'
                                                : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:text-white/90'
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
                                className="h-14 mt-2 w-full rounded-2xl bg-[#8FB34A] font-bold text-white text-lg shadow-[0_8px_30px_rgba(143,179,74,0.4)] transition-all hover:bg-[#7da33f] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed border border-[#8FB34A]/50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Creating account…
                                    </span>
                                ) : 'Complete registration'}
                            </button>

                            <div className="mt-6 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => { setStep('phone'); setError('') }}
                                    className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                                >
                                    Already have an account? Login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══ Email Fallback Step ═══ */}
                    {step === 'email' && (
                        <form onSubmit={handleEmailSubmit} className="rounded-3xl bg-white/10 backdrop-blur-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/10">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in shake-x duration-300">
                                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">
                                Recovery Email
                            </label>
                            <div className="relative mb-6">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    autoFocus
                                    autoComplete="email"
                                    className="h-14 w-full rounded-2xl border border-white/20 bg-black/20 px-5 text-lg font-bold text-white placeholder:text-white/20 outline-none transition-all focus:border-[#8FB34A] focus:bg-black/40 focus:ring-2 focus:ring-[#8FB34A]/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="h-14 w-full rounded-2xl bg-[#8FB34A] font-bold text-white text-lg shadow-[0_8px_30px_rgba(143,179,74,0.4)] transition-all hover:bg-[#7da33f] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed border border-[#8FB34A]/50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Sending…
                                    </span>
                                ) : 'Send Magic Link'}
                            </button>

                            <div className="mt-6 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => { setStep('phone'); setError('') }}
                                    className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                                >
                                    Back to phone login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══ Email Sent Step ═══ */}
                    {step === 'email_sent' && (
                        <div className="rounded-3xl bg-white/10 backdrop-blur-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/10 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8FB34A]/20 border border-[#8FB34A]/30">
                                <svg className="h-8 w-8 text-[#8FB34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-white">Check your inbox</h2>
                            <p className="text-sm text-white/60 font-medium">
                                We sent a magic link to <br /><span className="font-bold text-white">{email.toLowerCase()}</span>
                            </p>

                            <div className="mt-8 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                                >
                                    Return to phone login
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Trust badges */}
                    <div className="mt-8 flex items-center justify-center gap-5 text-[10px] font-bold uppercase tracking-widest text-white/40">
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
