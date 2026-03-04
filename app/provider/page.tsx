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
        <div className="pb-8 text-[#0F172A] relative z-10 w-full max-w-2xl mx-auto font-sans">
            {/* Master Switch - Minimalist Light Style */}
            <div className="px-4 pt-5 pb-6">
                <div className={`rounded-3xl p-6 transition-all duration-500 overflow-hidden relative ${isOnline
                    ? 'bg-white border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
                    : 'bg-white/80 backdrop-blur-sm border border-slate-200/50 opacity-90'
                    }`}>

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h2 className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${isOnline ? 'text-[#0F172A]' : 'text-slate-500'}`}>
                                {isOnline ? 'You\u2019re Online' : 'You\u2019re Offline'}
                            </h2>
                            <p className={`text-sm mt-1 transition-colors duration-500 font-medium ${isOnline ? 'text-slate-500' : 'text-slate-400'}`}>
                                {isOnline ? 'Receiving job requests' : 'Go online to start receiving jobs'}
                            </p>
                        </div>
                        {/* Brand Green Toggle Button */}
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 shadow-sm ${isOnline
                                ? 'bg-[#8FB34A] text-white hover:bg-[#7da33f] shadow-[0_4px_15px_rgba(143,179,74,0.4)] hover:scale-105 active:scale-95'
                                : 'bg-[#F8FAFC] text-slate-400 border border-slate-200 hover:bg-slate-50 hover:text-slate-600 active:scale-95'
                                }`}
                        >
                            <Power className="h-6 w-6" strokeWidth={isOnline ? 3 : 2.5} />
                        </button>
                    </div>

                    {isOnline && (
                        <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex-1 text-center">
                                <p className="text-2xl font-bold text-[#0F172A] tracking-tight">$340</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Today</p>
                            </div>
                            <div className="w-px bg-slate-100"></div>
                            <div className="flex-1 text-center">
                                <p className="text-2xl font-bold text-[#0F172A] tracking-tight">3</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Jobs</p>
                            </div>
                            <div className="w-px bg-slate-100"></div>
                            <div className="flex-1 text-center">
                                <p className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center justify-center gap-1">
                                    4.8 <Star className="h-4 w-4 fill-amber-400 text-amber-400 mb-0.5" />
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Rating</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Job Card - Minimalist Light */}
            {hasJob && jobStatus && (
                <div className="px-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="rounded-3xl bg-white border border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80 bg-slate-50/50">
                            <span className="text-xs font-bold text-[#8FB34A] tracking-wider uppercase">{jobStatusLabel[jobStatus]}</span>
                            <span className="text-xs font-bold text-slate-400 tracking-widest">{MOCK_JOB.id}</span>
                        </div>

                        {/* Mini map */}
                        <div className="relative border-b border-slate-100/80">
                            <GoogleMap
                                center={{ lat: MOCK_JOB.lat, lng: MOCK_JOB.lng }}
                                zoom={14}
                                markers={mapMarkers}
                                route={coords && jobStatus !== 'arrived' && jobStatus !== 'working' ? { from: coords, to: { lat: MOCK_JOB.lat, lng: MOCK_JOB.lng } } : null}
                                style={{ height: 160 }}
                            />
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Profile */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAFC] text-lg font-bold text-[#0F172A] border border-slate-200">
                                    {MOCK_JOB.customer.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-bold text-[#0F172A] tracking-wide truncate">{MOCK_JOB.customer}</p>
                                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                                        {MOCK_JOB.service}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] border border-slate-200 transition-colors active:scale-95">
                                        <Phone className="h-5 w-5" />
                                    </button>
                                    <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] border border-slate-200 transition-colors active:scale-95">
                                        <MessageSquare className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Job Details */}
                            <div className="flex items-start gap-4">
                                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#8FB34A] shadow-[0_0_10px_rgba(143,179,74,0.3)]" />
                                <div>
                                    <p className="text-base font-bold text-[#0F172A] leading-snug">{MOCK_JOB.address}</p>
                                    <p className="text-sm text-slate-500 mt-1 leading-snug">{MOCK_JOB.description}</p>
                                    {MOCK_JOB.priority === 'emergency' && (
                                        <p className="text-xs text-red-600 font-bold uppercase tracking-wider mt-2.5 flex items-center gap-1.5 bg-red-50 w-max px-2.5 py-1 rounded-md">
                                            <AlertTriangle className="h-3.5 w-3.5" /> Emergency
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={advanceJobStatus}
                                className={`h-14 mt-2 w-full rounded-2xl font-bold text-base transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border ${jobStatus === 'working'
                                    ? 'bg-[#8FB34A] text-white border-transparent hover:bg-[#7da33f] shadow-[0_4px_20px_rgba(143,179,74,0.3)]'
                                    : 'bg-white text-[#0F172A] border-slate-200 hover:bg-slate-50 shadow-sm'
                                    }`}
                            >
                                {jobButtonText[jobStatus]}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Service Toggles - Minimalist Light */}
            <div className="px-4 mb-6">
                <div className="rounded-3xl bg-white border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold tracking-wide text-[#0F172A]">Services</h3>
                        <span className="text-[10px] text-[#8FB34A] font-bold uppercase tracking-widest bg-[#EAF4D8] px-2.5 py-1 rounded-full">{activeServices.size} Active</span>
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
                                        ? 'border-[#8FB34A]/30 bg-[#EAF4D8]/50 text-[#0F172A]'
                                        : 'border-slate-100 bg-slate-50 text-slate-500'
                                        } ${!isOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300 hover:bg-slate-100'}`}
                                >
                                    <div className={`p-1.5 rounded-full ${active && isOnline ? 'bg-white text-[#8FB34A] shadow-sm' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold tracking-wide truncate pr-1">{name}</span>

                                    {/* Minimalist Switch */}
                                    <div className={`ml-auto shrink-0 h-3 w-6 rounded-full transition-colors duration-300 ${active && isOnline ? 'bg-[#8FB34A]' : 'bg-slate-200'
                                        }`}>
                                        <div className={`h-3 w-3 rounded-full bg-white transition-transform duration-300 ${active && isOnline ? 'translate-x-3' : 'translate-x-0'
                                            } shadow-sm`} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Jobs - Minimalist Light */}
            <div className="px-4">
                <div className="rounded-3xl bg-white border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <h3 className="text-sm font-bold tracking-wide text-[#0F172A]">Recent Earnings</h3>
                        <button className="text-xs font-bold text-[#8FB34A] hover:text-[#7da33f] transition-colors tracking-wide">VIEW ALL</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {MOCK_HISTORY.map(job => (
                            <div key={job.id} className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF4D8]/50 text-[#8FB34A] group-hover:bg-[#EAF4D8] transition-colors border border-[#8FB34A]/10">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-[#0F172A] tracking-wide truncate">{job.customer}</span>
                                        <span className="text-base font-bold text-[#0F172A]">{job.amount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-slate-500">{job.service}</p>
                                        <span className="text-xs font-medium text-slate-400">{job.date}</span>
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
