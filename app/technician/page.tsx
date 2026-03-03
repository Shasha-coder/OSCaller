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

export default function TechnicianDashboard() {
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
        <div className="pb-8">
            {/* Master Switch */}
            <div className="px-4 pt-5 pb-4">
                <div className={`rounded-2xl p-5 transition-all duration-500 ${isOnline
                        ? 'bg-gradient-to-br from-[#8FB34A] to-[#6d9a2c] shadow-[0_12px_40px_rgba(143,179,74,0.25)]'
                        : 'bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className={`text-lg font-bold ${isOnline ? 'text-white' : 'text-[#0F172A]'}`}>
                                {isOnline ? '🟢 You\u2019re Online' : 'You\u2019re Offline'}
                            </h2>
                            <p className={`text-sm ${isOnline ? 'text-white/70' : 'text-[#64748B]'}`}>
                                {isOnline ? 'Receiving job requests' : 'Go online to start receiving jobs'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${isOnline
                                    ? 'bg-white/20 text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]'
                                    : 'bg-[#F1F5F9] text-[#94a3b8] hover:bg-[#E2E8F0]'
                                }`}
                        >
                            <Power className="h-6 w-6" strokeWidth={2.5} />
                        </button>
                    </div>

                    {isOnline && (
                        <div className="flex gap-2">
                            <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 text-center">
                                <p className="text-lg font-bold text-white">$340</p>
                                <p className="text-[10px] text-white/60 font-medium">Today</p>
                            </div>
                            <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 text-center">
                                <p className="text-lg font-bold text-white">3</p>
                                <p className="text-[10px] text-white/60 font-medium">Jobs</p>
                            </div>
                            <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 text-center">
                                <p className="text-lg font-bold text-white">4.8</p>
                                <p className="text-[10px] text-white/60 font-medium">Rating</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Job Card */}
            {hasJob && jobStatus && (
                <div className="px-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-[#FEF3C7] border-b border-amber-200">
                            <span className="text-sm font-bold text-amber-800">{jobStatusLabel[jobStatus]}</span>
                            <span className="text-xs font-semibold text-amber-600">{MOCK_JOB.id}</span>
                        </div>

                        {/* Mini map */}
                        <GoogleMap
                            center={{ lat: MOCK_JOB.lat, lng: MOCK_JOB.lng }}
                            zoom={14}
                            markers={mapMarkers}
                            route={coords && jobStatus !== 'arrived' && jobStatus !== 'working' ? { from: coords, to: { lat: MOCK_JOB.lat, lng: MOCK_JOB.lng } } : null}
                            style={{ height: 160 }}
                        />

                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF4D8] text-sm font-bold text-[#5a8a1a]">
                                    {MOCK_JOB.customer.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#0F172A]">{MOCK_JOB.customer}</p>
                                    <p className="text-xs text-[#64748B]">{MOCK_JOB.service} · <span className="text-red-500 font-semibold">{MOCK_JOB.priority.toUpperCase()}</span></p>
                                </div>
                                <div className="flex gap-1.5">
                                    <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] hover:bg-[#8FB34A]/10 hover:text-[#8FB34A] transition-colors">
                                        <Phone className="h-4 w-4" />
                                    </button>
                                    <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B] hover:bg-[#8FB34A]/10 hover:text-[#8FB34A] transition-colors">
                                        <MessageSquare className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 rounded-xl bg-[#F8FAFB] px-3 py-2.5">
                                <MapPin className="h-4 w-4 text-[#8FB34A] shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-[#0F172A]">{MOCK_JOB.address}</p>
                                    <p className="text-xs text-[#64748B] mt-0.5">{MOCK_JOB.description}</p>
                                </div>
                            </div>

                            <button
                                onClick={advanceJobStatus}
                                className={`h-12 w-full rounded-xl font-semibold text-white transition-all ${jobStatus === 'working'
                                        ? 'bg-[#8FB34A] shadow-[0_4px_16px_rgba(143,179,74,0.3)] hover:bg-[#7da33f]'
                                        : jobStatus === 'assigned'
                                            ? 'bg-[#0F172A] shadow-[0_4px_16px_rgba(15,23,42,0.2)] hover:bg-[#1e293b]'
                                            : 'bg-[#3B82F6] shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:bg-[#2563EB]'
                                    }`}
                            >
                                {jobButtonText[jobStatus]}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Service Toggles */}
            <div className="px-4 mb-4">
                <div className="rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Services</h3>
                        <span className="text-[10px] text-[#94a3b8] font-medium">{activeServices.size} active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {SERVICE_LIST.map(({ id, name, icon: Icon }) => {
                            const active = activeServices.has(id)
                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleService(id)}
                                    disabled={!isOnline}
                                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-200 ${active && isOnline
                                            ? 'border-[#8FB34A] bg-[#EAF4D8] text-[#3a5e10]'
                                            : 'border-[#E2E8F0] bg-[#F8FAFB] text-[#94a3b8]'
                                        } ${!isOnline ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                                >
                                    <Icon className={`h-4 w-4 ${active && isOnline ? 'text-[#8FB34A]' : ''}`} />
                                    <span className="text-xs font-semibold">{name}</span>
                                    <div className={`ml-auto h-3 w-6 rounded-full transition-colors ${active && isOnline ? 'bg-[#8FB34A]' : 'bg-[#E2E8F0]'
                                        }`}>
                                        <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${active && isOnline ? 'translate-x-3' : 'translate-x-0'
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
                <div className="rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Recent Jobs</h3>
                        <button className="text-xs font-medium text-[#8FB34A]">View all</button>
                    </div>
                    <div className="divide-y divide-[#F1F5F9]">
                        {MOCK_HISTORY.map(job => (
                            <div key={job.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF4D8]">
                                    <CheckCircle2 className="h-4 w-4 text-[#8FB34A]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-[#0F172A]">{job.customer}</span>
                                        <span className="text-xs text-[#94a3b8]">{job.date}</span>
                                    </div>
                                    <p className="text-xs text-[#64748B]">{job.service}</p>
                                </div>
                                <span className="text-sm font-bold text-[#8FB34A]">{job.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
