'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import {
    Power, Wrench, Clock, DollarSign, Star,
    CheckCircle2, AlertTriangle, Navigation, ChevronRight,
    Phone, MapPin, Shield, Droplets, Zap, Thermometer,
    KeyRound, Bug, Home, MessageSquare, RefreshCw
} from 'lucide-react'

const SERVICE_LIST = [
    { id: 'plumbing', name: 'Plumbing', icon: Droplets },
    { id: 'electrical', name: 'Electrical', icon: Zap },
    { id: 'hvac', name: 'HVAC', icon: Thermometer },
    { id: 'locksmith', name: 'Locksmith', icon: KeyRound },
    { id: 'appliance', name: 'Appliance', icon: Wrench },
    { id: 'roofing', name: 'Roofing', icon: Home },
    { id: 'pest', name: 'Pest Control', icon: Bug },
]

/* Mock data — will be replaced with Supabase real-time subscriptions */
const MOCK_JOB = {
    id: 'REQ-001',
    customer: 'Maria S.',
    address: '123 Main St, Apt 4B',
    service: 'Plumbing',
    priority: 'emergency',
    description: 'Burst pipe in kitchen, water flooding',
    eta: '8 min',
    lat: 40.7128,
    lng: -74.006,
}

const MOCK_HISTORY = [
    { id: 'REQ-098', customer: 'John D.', service: 'Plumbing', date: '3h ago', amount: '$185', status: 'completed' },
    { id: 'REQ-095', customer: 'Sarah L.', service: 'Plumbing', date: 'Yesterday', amount: '$120', status: 'completed' },
    { id: 'REQ-091', customer: 'Mike R.', service: 'Plumbing', date: '2 days ago', amount: '$200', status: 'completed' },
]

export default function ProviderDashboard() {
    const [isOnline, setIsOnline] = useState(false)
    const [activeServices, setActiveServices] = useState<Set<string>>(new Set(['plumbing']))
    const [hasJob, setHasJob] = useState(false)
    const [jobStatus, setJobStatus] = useState<'assigned' | 'en-route' | 'arrived' | 'working' | null>(null)
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setCoords({ lat: 40.7200, lng: -73.998 })
            )
        }
    }, [])

    // Simulate incoming job 5s after going online
    useEffect(() => {
        if (!isOnline) {
            setHasJob(false)
            setJobStatus(null)
            return
        }
        const t = setTimeout(() => {
            setHasJob(true)
            setJobStatus('assigned')
        }, 5000)
        return () => clearTimeout(t)
    }, [isOnline])

    const toggleService = (id: string) => {
        setActiveServices(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const advanceJobStatus = () => {
        const flow: ('assigned' | 'en-route' | 'arrived' | 'working')[] = ['assigned', 'en-route', 'arrived', 'working']
        if (!jobStatus) return
        const idx = flow.indexOf(jobStatus)
        if (idx < flow.length - 1) {
            setJobStatus(flow[idx + 1])
        } else {
            // Complete
            setHasJob(false)
            setJobStatus(null)
        }
    }

    const jobButtonText: Record<string, string> = {
        'assigned': 'Accept & Start Navigation',
        'en-route': 'Mark as Arrived',
        'arrived': 'Start Working',
        'working': 'Complete Job',
    }

    const jobStatusLabel: Record<string, string> = {
        'assigned': '🔔 New Job Assigned',
        'en-route': '🚗 En Route',
        'arrived': '📍 On Site',
        'working': '🔧 In Progress',
    }

    const mapMarkers: MapMarker[] = []
    if (coords) mapMarkers.push({ id: 'me', lat: coords.lat, lng: coords.lng, type: 'pro', label: 'You', pulse: true })
    if (hasJob) mapMarkers.push({ id: 'job', lat: MOCK_JOB.lat, lng: MOCK_JOB.lng, type: 'user', pulse: true })

    return (
        <div className="pb-8 text-white relative z-10 w-full max-w-2xl mx-auto">
            {/* Master Switch */}
            <div className="px-4 pt-5 pb-6">
                <div className={`rounded-[32px] p-6 transition-all duration-700 overflow-hidden relative ${isOnline
                    ? 'bg-[#8FB34A]/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(143,179,74,0.3)] border border-white/20'
                    : 'bg-white/5 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/5'
                    }`}>
                    {!isOnline && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    )}
                    {isOnline && (
                        <div className="absolute -inset-10 bg-[#8FB34A]/30 blur-3xl pointer-events-none rounded-full" />
                    )}

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div>
                            <h2 className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${isOnline ? 'text-white' : 'text-white/90'}`}>
                                {isOnline ? '🟢 You\u2019re Online' : 'You\u2019re Offline'}
                            </h2>
                            <p className={`text-sm mt-1.5 transition-colors duration-500 font-medium ${isOnline ? 'text-white/90' : 'text-white/50'}`}>
                                {isOnline ? 'Receiving job requests' : 'Go online to start receiving jobs'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500 ${isOnline
                                ? 'bg-white text-[#5a8a1a] shadow-[0_8px_30px_rgba(255,255,255,0.4)] scale-105'
                                : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]'
                                }`}
                        >
                            <Power className="h-7 w-7" strokeWidth={2.5} />
                        </button>
                    </div>

                    {isOnline && (
                        <div className="mt-6 flex gap-3 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex-1 rounded-2xl bg-black/10 px-3 py-3.5 text-center border border-white/10 shadow-inner">
                                <p className="text-xl font-bold text-white tracking-tight">$340</p>
                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Today</p>
                            </div>
                            <div className="flex-1 rounded-2xl bg-black/10 px-3 py-3.5 text-center border border-white/10 shadow-inner">
                                <p className="text-xl font-bold text-white tracking-tight">3</p>
                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Jobs</p>
                            </div>
                            <div className="flex-1 rounded-2xl bg-black/10 px-3 py-3.5 text-center border border-white/10 shadow-inner">
                                <p className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
                                    4.8 <Star className="h-4 w-4 fill-[#facc15] text-[#facc15]" />
                                </p>
                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Rating</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Job Card */}
            {hasJob && jobStatus && (
                <div className="px-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="rounded-[32px] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30">
                            <span className="text-sm font-bold text-amber-400 tracking-wide">{jobStatusLabel[jobStatus]}</span>
                            <span className="text-xs font-bold text-amber-500/80 tracking-widest">{MOCK_JOB.id}</span>
                        </div>

                        {/* Mini map */}
                        <div className="relative border-b border-white/5">
                            <GoogleMap
                                center={{ lat: MOCK_JOB.lat, lng: MOCK_JOB.lng }}
                                zoom={14}
                                markers={mapMarkers}
                                route={coords && jobStatus !== 'arrived' && jobStatus !== 'working' ? { from: coords, to: { lat: MOCK_JOB.lat, lng: MOCK_JOB.lng } } : null}
                                style={{ height: 180 }}
                            />
                            {/* Inner gradient shadow for map */}
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_4px_24px_rgba(0,0,0,0.2)]" />
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8FB34A] text-lg font-bold text-white shadow-[0_8px_20px_rgba(143,179,74,0.4)]">
                                    {MOCK_JOB.customer.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-bold text-white tracking-wide truncate">{MOCK_JOB.customer}</p>
                                    <p className="text-sm text-white/60 mt-0.5">
                                        {MOCK_JOB.service} <span className="mx-1.5 opacity-40">•</span> <span className="text-amber-400 font-bold tracking-widest text-[10px] uppercase">{MOCK_JOB.priority}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/5 hover:scale-105 active:scale-95">
                                        <Phone className="h-4 w-4" />
                                    </button>
                                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/5 hover:scale-105 active:scale-95">
                                        <MessageSquare className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 rounded-2xl bg-black/30 p-5 border border-white/5 shadow-inner">
                                <MapPin className="h-5 w-5 text-[#8FB34A] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-white/90 leading-relaxed">{MOCK_JOB.address}</p>
                                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{MOCK_JOB.description}</p>
                                </div>
                            </div>

                            <button
                                onClick={advanceJobStatus}
                                className={`h-14 mt-2 w-full rounded-2xl font-bold text-base transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] ${jobStatus === 'working'
                                    ? 'bg-[#8FB34A] text-white hover:bg-[#7da33f] shadow-[0_8px_30px_rgba(143,179,74,0.3)]'
                                    : jobStatus === 'assigned'
                                        ? 'bg-white text-black hover:bg-gray-100 shadow-[0_8px_30px_rgba(255,255,255,0.2)]'
                                        : 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-[0_8px_30px_rgba(59,130,246,0.3)]'
                                    }`}
                            >
                                {jobButtonText[jobStatus]}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Service Toggles */}
            <div className="px-4 mb-6">
                <div className="rounded-[32px] bg-white/5 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Services Authored</h3>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">{activeServices.size} Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {SERVICE_LIST.map(({ id, name, icon: Icon }) => {
                            const active = activeServices.has(id)
                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleService(id)}
                                    disabled={!isOnline}
                                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3.5 transition-all duration-300 ${active && isOnline
                                        ? 'border-[#8FB34A]/40 bg-[#8FB34A]/20 text-white shadow-[0_4px_20px_rgba(143,179,74,0.1)]'
                                        : 'border-white/5 bg-white/5 text-white/50'
                                        } ${!isOnline ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer hover:bg-white/10 hover:border-white/10'}`}
                                >
                                    <div className={`p-1.5 rounded-xl ${active && isOnline ? 'bg-[#8FB34A] text-white shadow-[0_4px_12px_rgba(143,179,74,0.4)]' : 'bg-white/10 text-white/70'}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold tracking-wide truncate pr-1">{name}</span>
                                    <div className={`ml-auto shrink-0 h-4 w-8 rounded-full transition-colors duration-300 ${active && isOnline ? 'bg-[#8FB34A]' : 'bg-white/10'
                                        }`}>
                                        <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${active && isOnline ? 'translate-x-4' : 'translate-x-0'
                                            }`} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Jobs */}
            <div className="px-4">
                <div className="rounded-[32px] bg-white/5 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Recent History</h3>
                        <button className="text-xs font-bold text-[#8FB34A] hover:text-[#7da33f] transition-colors tracking-wide">VIEW ALL</button>
                    </div>
                    <div className="divide-y divide-white/5">
                        {MOCK_HISTORY.map(job => (
                            <div key={job.id} className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-white/[0.04]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8FB34A]/20 border border-[#8FB34A]/30">
                                    <CheckCircle2 className="h-5 w-5 text-[#8FB34A]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-sm font-bold text-white tracking-wide truncate">{job.customer}</span>
                                        <span className="text-base font-bold text-white">{job.amount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-white/50 font-medium">{job.service}</p>
                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{job.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-8"></div>
        </div>
    )
}
