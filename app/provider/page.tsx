'use client'

import { useState, useEffect } from 'react'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import {
    Power, Clock, DollarSign, Star,
    AlertTriangle,
    Phone, MapPin, Droplets, Zap, Thermometer,
    KeyRound, Bug, Home, MessageSquare, Briefcase,
    ChevronRight, Sparkles
} from 'lucide-react'

const SERVICE_LIST = [
    { id: 'plumbing', name: 'Plumbing', icon: Droplets },
    { id: 'electrical', name: 'Electrical', icon: Zap },
    { id: 'hvac', name: 'HVAC', icon: Thermometer },
    { id: 'locksmith', name: 'Locksmith', icon: KeyRound },
    { id: 'appliance', name: 'Appliance', icon: Briefcase },
    { id: 'roofing', name: 'Roofing', icon: Home },
    { id: 'pest', name: 'Pest Control', icon: Bug },
]

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
    const [pulseAnimation, setPulseAnimation] = useState(false)

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setCoords({ lat: 40.7200, lng: -73.998 })
            )
        }
    }, [])

    useEffect(() => {
        if (!isOnline) {
            setHasJob(false)
            setJobStatus(null)
            return
        }
        const t = setTimeout(() => {
            setHasJob(true)
            setJobStatus('assigned')
            setPulseAnimation(true)
            setTimeout(() => setPulseAnimation(false), 2000)
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
            setHasJob(false)
            setJobStatus(null)
        }
    }

    const jobButtonText: Record<string, string> = {
        'assigned': 'Accept & Navigate',
        'en-route': 'I\'ve Arrived',
        'arrived': 'Start Work',
        'working': 'Complete Job',
    }

    const jobStatusLabel: Record<string, { text: string; color: string }> = {
        'assigned': { text: 'New Request', color: 'text-amber-500' },
        'en-route': { text: 'En Route', color: 'text-blue-500' },
        'arrived': { text: 'On Site', color: 'text-violet-500' },
        'working': { text: 'In Progress', color: 'text-emerald-500' },
    }

    const mapMarkers: MapMarker[] = []
    if (coords) mapMarkers.push({ id: 'me', lat: coords.lat, lng: coords.lng, type: 'pro', label: 'You', pulse: true })
    if (hasJob) mapMarkers.push({ id: 'job', lat: MOCK_JOB.lat, lng: MOCK_JOB.lng, type: 'user', pulse: true })

    return (
        <div className="pb-8 relative z-10 w-full max-w-2xl mx-auto font-sans">
            {/* Power Card */}
            <div className="px-4 pt-2 pb-6">
                <div className={`relative rounded-[28px] overflow-hidden transition-all duration-700 ${
                    isOnline 
                        ? 'bg-gradient-to-br from-white via-white to-emerald-50/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.02)]' 
                        : 'bg-white/90 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]'
                }`}>
                    {/* Animated background gradient */}
                    {isOnline && (
                        <div className="absolute inset-0 opacity-40">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/50 to-transparent rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-100/30 to-transparent rounded-full blur-2xl" />
                        </div>
                    )}
                    
                    <div className="relative p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className={`text-[26px] font-bold tracking-tight transition-all duration-500 ${
                                    isOnline ? 'text-slate-900' : 'text-slate-400'
                                }`}>
                                    {isOnline ? 'You\'re Live' : 'Go Online'}
                                </h2>
                                <p className={`text-sm font-medium transition-all duration-500 ${
                                    isOnline ? 'text-emerald-600/80' : 'text-slate-400'
                                }`}>
                                    {isOnline ? 'Receiving job requests' : 'Tap to start earning'}
                                </p>
                            </div>
                            
                            {/* Premium Power Button */}
                            <button
                                onClick={() => setIsOnline(!isOnline)}
                                className={`relative group transition-all duration-500 ${
                                    isOnline ? 'scale-100' : 'scale-95 hover:scale-100'
                                }`}
                            >
                                <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                                    isOnline 
                                        ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' 
                                        : 'bg-slate-100'
                                }`} />
                                <div className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
                                    isOnline 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                                }`}>
                                    <Power className={`h-7 w-7 transition-all duration-300 ${
                                        isOnline ? 'stroke-[2.5px]' : 'stroke-[2px]'
                                    }`} />
                                </div>
                                {isOnline && (
                                    <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />
                                )}
                            </button>
                        </div>

                        {/* Stats Row */}
                        <div className={`grid grid-cols-3 gap-4 mt-8 pt-6 border-t transition-all duration-700 ${
                            isOnline ? 'border-slate-100 opacity-100 translate-y-0' : 'border-transparent opacity-0 -translate-y-2 pointer-events-none h-0 mt-0 pt-0 overflow-hidden'
                        }`}>
                            {[
                                { value: '$340', label: 'Today', icon: DollarSign },
                                { value: '3', label: 'Jobs', icon: Briefcase },
                                { value: '4.8', label: 'Rating', icon: Star, star: true },
                            ].map((stat, i) => (
                                <div key={i} className="text-center group">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
                                        {stat.star && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Job Card */}
            {hasJob && jobStatus && (
                <div className={`px-4 mb-6 ${pulseAnimation ? 'animate-in zoom-in-95 duration-500' : 'animate-in fade-in slide-in-from-top-2 duration-500'}`}>
                    <div className="rounded-[28px] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden">
                        {/* Status Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className={`relative flex h-2.5 w-2.5`}>
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                                        jobStatus === 'assigned' ? 'bg-amber-400' :
                                        jobStatus === 'en-route' ? 'bg-blue-400' :
                                        jobStatus === 'arrived' ? 'bg-violet-400' : 'bg-emerald-400'
                                    }`} />
                                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                                        jobStatus === 'assigned' ? 'bg-amber-500' :
                                        jobStatus === 'en-route' ? 'bg-blue-500' :
                                        jobStatus === 'arrived' ? 'bg-violet-500' : 'bg-emerald-500'
                                    }`} />
                                </span>
                                <span className={`text-sm font-semibold ${jobStatusLabel[jobStatus].color}`}>
                                    {jobStatusLabel[jobStatus].text}
                                </span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{MOCK_JOB.id}</span>
                        </div>

                        {/* Mini Map */}
                        <div className="relative h-40 border-b border-slate-100">
                            <GoogleMap
                                center={{ lat: MOCK_JOB.lat, lng: MOCK_JOB.lng }}
                                zoom={14}
                                markers={mapMarkers}
                                route={coords && jobStatus !== 'arrived' && jobStatus !== 'working' ? { from: coords, to: { lat: MOCK_JOB.lat, lng: MOCK_JOB.lng } } : null}
                                style={{ height: 160 }}
                            />
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Customer Row */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-lg font-bold text-slate-700 shadow-inner">
                                    {MOCK_JOB.customer.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-bold text-slate-900">{MOCK_JOB.customer}</p>
                                    <p className="text-sm text-slate-500 font-medium">{MOCK_JOB.service}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95 border border-slate-100">
                                        <Phone className="h-5 w-5" />
                                    </button>
                                    <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95 border border-slate-100">
                                        <MessageSquare className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Address & Issue */}
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50/80">
                                <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold text-slate-900">{MOCK_JOB.address}</p>
                                    <p className="text-sm text-slate-500 mt-1">{MOCK_JOB.description}</p>
                                    {MOCK_JOB.priority === 'emergency' && (
                                        <div className="flex items-center gap-1.5 mt-3 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-fit">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase tracking-wide">Emergency</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={advanceJobStatus}
                                className={`relative w-full h-14 rounded-2xl font-semibold text-base transition-all duration-300 overflow-hidden group ${
                                    jobStatus === 'working'
                                        ? 'bg-emerald-500 text-white shadow-[0_8px_30px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_40px_-5px_rgba(16,185,129,0.6)]'
                                        : 'bg-slate-900 text-white shadow-[0_8px_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_-5px_rgba(0,0,0,0.4)]'
                                }`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {jobButtonText[jobStatus]}
                                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Services Grid */}
            <div className="px-4 mb-6">
                <div className="rounded-[28px] bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-bold text-slate-900">Your Services</h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                            {activeServices.size} Active
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {SERVICE_LIST.map(({ id, name, icon: Icon }) => {
                            const active = activeServices.has(id)
                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleService(id)}
                                    disabled={!isOnline}
                                    className={`relative flex items-center gap-3 rounded-2xl p-4 transition-all duration-300 ${
                                        active && isOnline
                                            ? 'bg-emerald-50 border-2 border-emerald-200'
                                            : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                                    } ${!isOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                        active && isOnline 
                                            ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]' 
                                            : 'bg-white text-slate-400 shadow-sm'
                                    }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-sm font-semibold ${active && isOnline ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        {name}
                                    </span>
                                    
                                    {/* Toggle Indicator */}
                                    <div className={`absolute right-4 w-8 h-5 rounded-full transition-all duration-300 ${
                                        active && isOnline ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}>
                                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                                            active && isOnline ? 'left-3.5' : 'left-0.5'
                                        }`} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Earnings */}
            <div className="px-4">
                <div className="rounded-[28px] bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <h3 className="text-base font-bold text-slate-900">Recent Earnings</h3>
                        </div>
                        <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                            View All
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {MOCK_HISTORY.map((job, i) => (
                            <div key={job.id} className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 group-hover:from-emerald-100 group-hover:to-emerald-50 transition-all">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-base font-semibold text-slate-900">{job.customer}</span>
                                        <span className="text-lg font-bold text-slate-900">{job.amount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">{job.service}</span>
                                        <span className="text-sm text-slate-400">{job.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-8" />
        </div>
    )
}
