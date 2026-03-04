'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'
import { HeroBackground } from '@/components/hero-background'
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
                <HeroBackground />
                <div className="relative z-10">{children}</div>
            </div>
        )
    }

    return (
        <div className="relative min-h-dvh" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <HeroBackground />

            {/* Top bar - Frosted Glass Dark */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-2xl border-b border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8FB34A] shadow-[0_0_15px_rgba(143,179,74,0.4)]">
                        <OSSymbol className="h-5 w-5" color="#FFFFFF" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{profile?.name || 'Service Provider'}</p>
                        <p className="text-[10px] text-white/60 font-medium">{profile?.trade || 'Loading...'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all">
                        <Bell className="h-4 w-4" />
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#8FB34A] ring-2 ring-white" />
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all"
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
