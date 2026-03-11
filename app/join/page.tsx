'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'

type Step = 'phone' | 'otp' | 'business'

/* ─── Countries (all world, 3 supported) ─── */
const COUNTRIES = [
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', supported: true },
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', supported: true },
    { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', supported: true },
    { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫', supported: false },
    { code: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱', supported: false },
    { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿', supported: false },
    { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', supported: false },
    { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', supported: false },
    { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹', supported: false },
    { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩', supported: false },
    { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪', supported: false },
    { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', supported: false },
    { code: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬', supported: false },
    { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲', supported: false },
    { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', supported: false },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', supported: false },
    { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', supported: false },
    { code: 'CD', name: 'Congo (DRC)', dial: '+243', flag: '🇨🇩', supported: false },
    { code: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷', supported: false },
    { code: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿', supported: false },
    { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰', supported: false },
    { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬', supported: false },
    { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹', supported: false },
    { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮', supported: false },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', supported: false },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', supported: false },
    { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭', supported: false },
    { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷', supported: false },
    { code: 'HT', name: 'Haiti', dial: '+509', flag: '🇭🇹', supported: false },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', supported: false },
    { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩', supported: false },
    { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷', supported: false },
    { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶', supported: false },
    { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪', supported: false },
    { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱', supported: false },
    { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹', supported: false },
    { code: 'CI', name: 'Ivory Coast', dial: '+225', flag: '🇨🇮', supported: false },
    { code: 'JM', name: 'Jamaica', dial: '+1876', flag: '🇯🇲', supported: false },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', supported: false },
    { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴', supported: false },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪', supported: false },
    { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷', supported: false },
    { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼', supported: false },
    { code: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧', supported: false },
    { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾', supported: false },
    { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦', supported: false },
    { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', supported: false },
    { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴', supported: false },
    { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰', supported: false },
    { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪', supported: false },
    { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭', supported: false },
    { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱', supported: false },
    { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', supported: false },
    { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦', supported: false },
    { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴', supported: false },
    { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺', supported: false },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', supported: false },
    { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳', supported: false },
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', supported: false },
    { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', supported: false },
    { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪', supported: false },
    { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭', supported: false },
    { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼', supported: false },
    { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭', supported: false },
    { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷', supported: false },
    { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦', supported: false },
    { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪', supported: false },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', supported: false },
    { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳', supported: false },
]

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

/* ─── Country Dropdown (styled like language dropdown) ─── */
function CountryDropdown({ value, onChange }: { value: string; onChange: (code: string) => void }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0]

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen(!open)}
                className={`flex h-14 w-full items-center justify-between rounded-xl border px-3.5 text-sm font-medium transition-all cursor-pointer ${open ? 'border-[#C8E64C] bg-white/[0.04] ring-2 ring-[#C8E64C]/20' : 'border-white/[0.08] bg-white/[0.04] hover:border-white/20'}`}>
                <span className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">{selected.flag}</span>
                    <span className="text-white font-semibold">{selected.name}</span>
                    <span className="text-white/35">{selected.dial}</span>
                </span>
                <svg className={`h-4 w-4 text-white/35 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-white/[0.12] bg-[#0F172A] shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {/* Supported header */}
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#C8E64C] bg-[#C8E64C]/10">Available</div>
                    <div className="max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        {COUNTRIES.filter(c => c.supported).map(c => (
                            <button key={c.code} type="button"
                                onClick={() => { onChange(c.code); setOpen(false) }}
                                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${c.code === value ? 'bg-[#C8E64C]/15 font-semibold text-[#C8E64C]' : 'text-white hover:bg-white/[0.06]'}`}>
                                <span className="text-lg">{c.flag}</span>
                                <span className="flex-1 text-left">{c.name}</span>
                                <span className="text-xs text-white/50">{c.dial}</span>
                                {c.code === value && <svg className="h-4 w-4 text-[#C8E64C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>}
                            </button>
                        ))}
                    </div>
                    {/* Coming soon header */}
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/[0.05] border-t border-white/[0.1]">Coming Soon</div>
                    <div className="max-h-36 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        {COUNTRIES.filter(c => !c.supported).map(c => (
                            <div key={c.code}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-white/40 opacity-70 cursor-not-allowed">
                                <span className="text-lg grayscale">{c.flag}</span>
                                <span className="flex-1 text-left">{c.name}</span>
                                <span className="text-xs">{c.dial}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── Language Dropdown ─── */
function LanguageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen(!open)}
                className={`flex h-13 w-full items-center justify-between rounded-xl border px-3.5 text-sm font-medium transition-all cursor-pointer ${open ? 'border-[#C8E64C] bg-white/[0.04] ring-2 ring-[#C8E64C]/20' : 'border-white/[0.08] bg-white/[0.04] hover:border-white/20'}`}>
                <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#C8E64C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    {value}
                </span>
                <svg className={`h-4 w-4 text-white/35 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-48 overflow-y-auto rounded-xl border border-white/[0.12] bg-[#0F172A] shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ scrollbarWidth: 'thin' }}>
                    {LANGUAGES.map(lang => (
                        <button key={lang} type="button"
                            onClick={() => { onChange(lang); setOpen(false) }}
                            className={`flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${lang === value ? 'bg-[#C8E64C]/15 font-semibold text-[#C8E64C]' : 'text-white hover:bg-white/[0.06]'}`}>
                            {lang}
                            {lang === value && <svg className="h-4 w-4 text-[#C8E64C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function JoinPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('phone')
    const [country, setCountry] = useState('CA')
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

    const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0]

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
    const fullPhone = `${selectedCountry.dial}${phoneDigits}`
    const stepIdx = step === 'phone' ? 0 : step === 'otp' ? 1 : 2

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!selectedCountry.supported) { setError('This country is not yet supported.'); return }
        if (phoneDigits.length < 10) { setError('Enter a valid phone number.'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to send code.')
                setLoading(false)
                return
            }

            setStep('otp')
            setResendTimer(60)
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
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: fullPhone, code }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Invalid code.')
                setOtp(['', '', '', '', '', ''])
                setTimeout(() => otpRefs.current[0]?.focus(), 100)
                setLoading(false)
                return
            }

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
            const fakeEmail = `tech_${phoneDigits}@oscaller.app`
            const fakePassword = `otp_${phoneDigits}_verified`

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: fakePassword,
            })

            if (signUpError && !signUpError.message.includes('already registered')) {
                const { error: signInErr } = await supabase.auth.signInWithPassword({
                    email: fakeEmail, password: fakePassword,
                })
                if (signInErr) {
                    setError('Account setup failed.')
                    setLoading(false)
                    return
                }
            }

            const { data: { session } } = await supabase.auth.getSession()
            const userId = session?.user?.id || signUpData?.user?.id

            if (!userId) { setError('Session error.'); setStep('phone'); setLoading(false); return }

            const { error: err } = await supabase.from('profiles').upsert({
                id: userId,
                name: businessName.trim(),
                phone: fullPhone,
                email: contactEmail.trim().toLowerCase() || null,
                role: 'provider',
                trade: selectedTrades[0],
                trades: selectedTrades,
                address: address.trim(),
                country: selectedCountry.code,
                country_dial: selectedCountry.dial,
                language,
                status: 'offline',
                created_at: new Date().toISOString(),
            })

            if (err) { setError(err.message); setLoading(false); return }
            haptic('heavy')
            router.push('/admin') // Redirect to admin for now, or provider portal
        } catch { setError('Registration failed.'); setLoading(false) }
    }

    return (
        <div className="flex min-h-dvh flex-col bg-gradient-to-b from-[#0A0A0A] to-[#0D1208]">
            <div className="h-[env(safe-area-inset-top)]" />

            <div className="flex flex-1 flex-col items-center justify-start px-5 py-8">
                <div className="w-full max-w-[440px]">

                    {/* Header */}
                    <div className="mb-6 flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C8E64C] shadow-[0_8px_30px_rgba(200,230,76,0.3)]">
                            <OSSymbol className="h-8 w-8" color="#0F172A" />
                        </div>
                        <h1 className="mt-4 text-xl font-bold text-white tracking-tight">Join OSCaller</h1>
                        <p className="mt-1 text-center text-sm text-white/50">
                            {step === 'phone' && 'Get matched with clients in your area'}
                            {step === 'otp' && 'Enter verification code'}
                            {step === 'business' && 'Set up your business profile'}
                        </p>

                        {/* Social proof */}
                        <div className="mt-3 flex items-center gap-2 rounded-full bg-[rgba(200,230,76,0.1)] px-4 py-1.5 text-xs font-semibold text-[#C8E64C]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            500+ service providers already earning
                        </div>

                        {/* Step dots */}
                        <div className="mt-4 flex items-center gap-2">
                            {[0, 1, 2].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === stepIdx ? 'w-6 bg-[#C8E64C]' : i < stepIdx ? 'w-1.5 bg-[#C8E64C]/40' : 'w-1.5 bg-[#CBD5E1]'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                            {error}
                        </div>
                    )}

                    {/* ═══ PHONE STEP ═══ */}
                    {step === 'phone' && (
                        <form onSubmit={handlePhoneSubmit} className="rounded-2xl bg-white/[0.04] backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.06]">
                            {/* Country selector */}
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">Country</label>
                            <div className="mb-4">
                                <CountryDropdown value={country} onChange={setCountry} />
                            </div>

                            {/* Phone input */}
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">Business Phone</label>
                            <div className="relative mb-3">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white">{selectedCountry.flag} {selectedCountry.dial}</span>
                                <input type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                                    placeholder="(555) 123-4567" autoFocus autoComplete="tel"
                                    className="h-14 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-[88px] pr-4 text-base font-medium text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#C8E64C] focus:bg-white/[0.06]/[0.04]"
                                />
                                {phoneDigits.length === 10 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C8E64C]">
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>

                            {/* Supported message */}
                            <p className="mb-5 text-xs text-white/35 flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
                                Currently available in 🇨🇦 Canada, 🇺🇸 USA, and 🇲🇽 Mexico. More countries coming very soon!
                            </p>

                            <button type="submit" disabled={loading || phoneDigits.length < 10 || !selectedCountry.supported}
                                className="h-13 w-full rounded-xl bg-[#C8E64C] font-semibold text-white shadow-[0_4px_16px_rgba(200,230,76,0.3)] transition-all hover:bg-[#b5d440] active:scale-[0.98] disabled:opacity-40">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Sending…</span> : 'Send verification code'}
                            </button>
                        </form>
                    )}

                    {/* ═══ OTP STEP ═══ */}
                    {step === 'otp' && (
                        <form onSubmit={e => { e.preventDefault(); if (otp.join('').length === 6) verifyOtp(otp.join('')) }} className="rounded-2xl bg-white/[0.04] backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.06]">
                            <p className="mb-5 text-center text-sm text-white/50">Code sent to <span className="font-semibold text-white">{selectedCountry.flag} {selectedCountry.dial} {phone}</span></p>
                            <div className="mb-5 flex justify-center gap-2.5">
                                {otp.map((d, i) => (
                                    <input key={i} ref={el => { otpRefs.current[i] = el }} type="text" inputMode="numeric" maxLength={1} value={d}
                                        onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} autoFocus={i === 0}
                                        className={`h-14 w-12 rounded-xl border text-center text-xl font-bold outline-none transition-all ${d ? 'border-[#C8E64C] bg-[rgba(200,230,76,0.1)] text-white' : 'border-white/[0.08] bg-white/[0.04] text-white'} focus:border-[#C8E64C] focus:ring-2 focus:ring-[#C8E64C]/20`}
                                    />
                                ))}
                            </div>
                            <button type="submit" disabled={loading || otp.join('').length < 6}
                                className="h-13 w-full rounded-xl bg-[#C8E64C] font-semibold text-white shadow-[0_4px_16px_rgba(200,230,76,0.3)] transition-all hover:bg-[#b5d440] active:scale-[0.98] disabled:opacity-40">
                                {loading ? 'Verifying…' : 'Verify'}
                            </button>
                            <div className="mt-4 flex justify-center gap-3 text-sm">
                                <button type="button" onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']) }} className="text-white/50 hover:text-white">Change number</button>
                                <span className="text-[#E2E8F0]">|</span>
                                <button type="button" disabled={resendTimer > 0} className={resendTimer > 0 ? 'text-white/35' : 'text-[#C8E64C] hover:text-[#b5d440]'}>
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ═══ BUSINESS STEP ═══ */}
                    {step === 'business' && (
                        <form onSubmit={handleRegister} className="rounded-2xl bg-white/[0.04] backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.06]">
                            <div className="mb-3 flex items-center gap-2 rounded-xl bg-[rgba(200,230,76,0.1)] px-4 py-2.5 text-sm font-semibold text-[#C8E64C]">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Phone verified ✓
                            </div>

                            {/* Business Name */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">Business Name *</label>
                                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                                    placeholder="Smith Plumbing LLC" autoFocus autoComplete="organization"
                                    className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-base font-medium text-white placeholder:text-white/25 outline-none focus:border-[#C8E64C] focus:bg-white/[0.06]/[0.04]"
                                />
                            </div>

                            {/* Address */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">Business Address *</label>
                                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                                    placeholder="123 Main St, Toronto, ON" autoComplete="street-address"
                                    className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-base font-medium text-white placeholder:text-white/25 outline-none focus:border-[#C8E64C] focus:bg-white/[0.06]/[0.04]"
                                />
                            </div>

                            {/* Contact Email */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">Contact Email <span className="normal-case font-normal">(for receipts)</span></label>
                                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                                    placeholder="info@smithplumbing.com" autoComplete="email"
                                    className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-base font-medium text-white placeholder:text-white/25 outline-none focus:border-[#C8E64C] focus:bg-white/[0.06]/[0.04]"
                                />
                            </div>

                            {/* Language */}
                            <div className="mb-4">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/35">Preferred Language</label>
                                <LanguageDropdown value={language} onChange={setLanguage} />
                            </div>

                            {/* Services */}
                            <div className="mb-4">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/35">Services Offered *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TRADES.map(t => (
                                        <button key={t} type="button" onClick={() => toggleTrade(t)}
                                            className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${selectedTrades.includes(t)
                                                ? 'border-[#C8E64C] bg-[rgba(200,230,76,0.1)] text-[#C8E64C] shadow-[0_2px_8px_rgba(200,230,76,0.15)]'
                                                : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:border-white/20'
                                                }`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Terms */}
                            <label className="mb-5 flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                                    className="mt-0.5 h-5 w-5 rounded border-white/[0.08] text-[#C8E64C] focus:ring-[#C8E64C]/20"
                                />
                                <span className="text-xs text-white/50 leading-relaxed">
                                    I agree to the <a href="/terms" className="text-[#C8E64C] underline">Terms of Service</a> and <a href="/privacy" className="text-[#C8E64C] underline">Privacy Policy</a>. I confirm this is a legitimate business.
                                </span>
                            </label>

                            <button type="submit" disabled={loading || !businessName.trim() || !address.trim() || selectedTrades.length === 0 || !agreed}
                                className="h-13 w-full rounded-xl bg-[#C8E64C] font-semibold text-white shadow-[0_4px_16px_rgba(200,230,76,0.3)] transition-all hover:bg-[#b5d440] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating…</span> : 'Start Receiving Leads'}
                            </button>
                        </form>
                    )}

                    {/* Trust badges */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-white/35">
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
