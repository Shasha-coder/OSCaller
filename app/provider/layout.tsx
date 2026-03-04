'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'
import { ServicePageBackground } from '@/components/service-bg-art'
import {
    Power, Wrench, MapPin, Clock, DollarSign,
    Star, Phone, Bell, ChevronRight, CheckCircle2,
    AlertTriangle, Navigation, LogOut, Settings,
    Droplets, Zap, Thermometer, KeyRound, Bug, Home
} from 'lucide-react'

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [user, setUser] = useState<{ id: string; phone?: string } | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const pathname = usePathname()

    useEffect(() => {
        // Skip auth check if we are on the login page
        if (pathname === '/provider/login') {
            setLoading(false)
            return
        }

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/provider/login')
                setLoading(false)
                return
            }

            const { data: prof, error: profErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (profErr || !prof || !['technician', 'provider'].includes(prof.role)) {
                await supabase.auth.signOut()
                router.push('/provider/login')
                setLoading(false)
                return
            }

            setUser({ id: session.user.id, phone: session.user.phone ?? undefined })
            setProfile(prof)
            setLoading(false)
        }

        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') router.push('/provider/login')
        })

        return () => subscription.unsubscribe()
    }, [router])

    const handleSignOut = useCallback(async () => {
        await supabase.auth.signOut()
        router.push('/provider/login')
    }, [router])

    if (loading) {
        return (
            <div className="flex h-dvh items-center justify-center bg-[#F6F8F4]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8FB34A]/20 border-t-[#8FB34A]" />
                    <span className="text-sm text-[#64748B]">Loading…</span>
                </div>
            </div>
        )
    }

    // Hide the top bar and padding on the login page itself
    if (pathname === '/provider/login') {
        return (
            <div className="relative min-h-dvh">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <ServicePageBackground />
                </div>
                <div className="relative z-10">{children}</div>
            </div>
        )
    }

    return (
        <div className="relative min-h-dvh bg-[#F6F8F4]" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="absolute inset-0 z-0 pointer-events-none">
                <ServicePageBackground />
            </div>

            {/* Top bar - Minimalist Light Style */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF4D8] shadow-[0_0_15px_rgba(234,244,216,0.5)] border border-[#8FB34A]/20">
                        <OSSymbol className="h-5 w-5" color="#8FB34A" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#0F172A] tracking-wide">{profile?.name || 'Service Provider'}</p>
                        <p className="text-[10px] text-[#8FB34A] font-bold uppercase tracking-widest">{profile?.trade || 'Loading...'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] border border-slate-200 transition-all active:scale-95">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-[#8FB34A] ring-2 ring-white" />
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#64748B] hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-slate-200 transition-all active:scale-95"
                        title="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <main className="relative z-10 pt-4">
                {children}
            </main>
        </div>
    )
}
