'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OSSymbol } from '@/components/os-logo'

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message)
                setLoading(false)
                return
            }

            // Verify admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user?.id)
                .single()

            if (profile?.role !== 'admin') {
                setError('Access denied. Admin privileges required.')
                await supabase.auth.signOut()
                setLoading(false)
                return
            }

            router.push('/admin')
        } catch {
            setError('An unexpected error occurred.')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-[#0B0F1A] px-4">
            {/* Background gradient */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-[#C8E64C]/8 blur-[120px]" />
                <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-[#C8E64C]/5 blur-[100px]" />
            </div>

            <div className="relative w-full max-w-[420px]">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C8E64C]/10 backdrop-blur-sm border border-[#C8E64C]/20">
                        <OSSymbol className="h-9 w-9" color="#C8E64C" />
                    </div>
                    <h1 className="mt-4 text-xl font-bold text-white tracking-tight">Admin Console</h1>
                    <p className="mt-1 text-sm text-white/40">Sign in to manage OSCaller</p>
                </div>

                {/* Login card */}
                <form onSubmit={handleLogin} className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] p-6 shadow-2xl">
                    {error && (
                        <div className="mb-4 rounded-xl bg-red-500/100/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@oscaller.com"
                            required
                            className="h-12 w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 outline-none transition-colors focus:border-[#C8E64C]/50 focus:bg-white/[0.06]/[0.08]"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="h-12 w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 outline-none transition-colors focus:border-[#C8E64C]/50 focus:bg-white/[0.06]/[0.08]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 w-full rounded-xl bg-[#C8E64C] font-semibold text-white shadow-[0_4px_20px_rgba(200,230,76,0.3)] transition-all duration-200 hover:bg-[#b5d440] hover:shadow-[0_6px_28px_rgba(200,230,76,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Signing in…
                            </span>
                        ) : (
                            'Sign in'
                        )}
                    </button>

                    <p className="mt-4 text-center text-xs text-white/25">
                        Secured access • OSCaller v1.0
                    </p>
                </form>
            </div>
        </div>
    )
}
