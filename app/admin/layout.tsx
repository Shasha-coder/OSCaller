'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'
import {
    LayoutDashboard, Users, Wrench, Settings, LogOut,
    Bell, ChevronDown, MessageSquare
} from 'lucide-react'

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'support', label: 'Support Chats', icon: MessageSquare, badge: 3 },
    { id: 'technicians', label: 'Technicians', icon: Users },
    { id: 'requests', label: 'Requests', icon: Wrench },
    { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [user, setUser] = useState<{ email?: string; id?: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/admin/login')
                return
            }

            // Verify admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (profile?.role !== 'admin') {
                await supabase.auth.signOut()
                router.push('/admin/login')
                return
            }

            setUser({ email: session.user.email, id: session.user.id })
            setLoading(false)
        }

        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') router.push('/admin/login')
        })

        return () => subscription.unsubscribe()
    }, [router])

    const handleSignOut = useCallback(async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }, [router])

    if (loading) {
        return (
            <div className="flex h-dvh items-center justify-center bg-[#0B0F1A]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C8E64C]/20 border-t-[#C8E64C]" />
                    <span className="text-sm text-white/40">Loading…</span>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-dvh bg-[#0B0F1A] text-white overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-[260px] border-r border-white/[0.06] bg-[#0D1220]">
                <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8E64C]/10">
                        <OSSymbol className="h-5 w-5" color="#C8E64C" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">OSCaller</h2>
                        <p className="text-[10px] text-white/30 font-medium">Admin Console</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => (
                        <button
                            key={id}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-all hover:bg-white/[0.04] hover:text-white/80 data-[active=true]:bg-[#C8E64C]/10 data-[active=true]:text-[#C8E64C]"
                            data-active={id === 'dashboard'}
                        >
                            <Icon className="h-[18px] w-[18px]" />
                            <span className="flex-1 text-left">{label}</span>
                            {badge && badge > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C8E64C] px-1.5 text-[10px] font-bold text-white">
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-white/[0.06] p-3">
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8E64C]/15 text-xs font-bold text-[#C8E64C]">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white/70 truncate">{user?.email}</p>
                            <p className="text-[10px] text-white/30">Administrator</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="text-white/30 hover:text-red-400 transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0D1220]/90 backdrop-blur-xl border-b border-white/[0.06]">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/60">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    <OSSymbol className="h-5 w-5" color="#C8E64C" />
                    <span className="text-sm font-bold">Admin</span>
                </div>
                <button className="relative text-white/60">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#C8E64C]" />
                </button>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 h-full w-[280px] bg-[#0D1220] border-r border-white/[0.06] p-4">
                        <nav className="mt-14 space-y-1">
                            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setSidebarOpen(false)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                    {label}
                                </button>
                            ))}
                        </nav>
                        <div className="absolute bottom-4 left-4 right-4">
                            <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-400/70 hover:bg-red-500/10">
                                <LogOut className="h-4 w-4" /> Sign out
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
                {children}
            </main>
        </div>
    )
}
