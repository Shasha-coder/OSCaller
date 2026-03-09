'use client'

import { useState, useEffect } from 'react'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import {
    Activity, Users, DollarSign, Clock,
    TrendingUp, MapPin, Wrench,
    RefreshCw, Eye, Zap, Droplets, Thermometer, KeyRound,
    ArrowUpRight, Sparkles
} from 'lucide-react'

const STATS = [
    { label: 'Active Requests', value: '12', change: '+3', trend: 'up', icon: Activity, color: 'emerald' },
    { label: 'Online Techs', value: '8', change: '+2', trend: 'up', icon: Users, color: 'blue' },
    { label: 'Revenue Today', value: '$2,840', change: '+18%', trend: 'up', icon: DollarSign, color: 'amber' },
    { label: 'Avg Response', value: '4.2m', change: '-12%', trend: 'down', icon: Clock, color: 'violet' },
]

const LIVE_REQUESTS = [
    { id: 'REQ-001', customer: 'Maria S.', service: 'plumbing', address: '123 Main St', status: 'en-route', tech: 'Peter M.', eta: '8 min', priority: 'emergency' },
    { id: 'REQ-002', customer: 'John D.', service: 'electrical', address: '456 Oak Ave', status: 'searching', tech: null, eta: null, priority: 'urgent' },
    { id: 'REQ-003', customer: 'Sarah L.', service: 'hvac', address: '789 Pine Rd', status: 'arrived', tech: 'James K.', eta: 'On site', priority: 'standard' },
    { id: 'REQ-004', customer: 'Alex W.', service: 'locksmith', address: '321 Elm St', status: 'submitted', tech: null, eta: null, priority: 'emergency' },
    { id: 'REQ-005', customer: 'Chris B.', service: 'plumbing', address: '654 Cedar Ln', status: 'completed', tech: 'Peter M.', eta: 'Done', priority: 'standard' },
]

const TECHNICIANS = [
    { name: 'Peter M.', trade: 'Plumbing', status: 'busy', jobs: 3, rating: 4.8, lat: 40.7150, lng: -74.003 },
    { name: 'James K.', trade: 'HVAC', status: 'online', jobs: 0, rating: 4.9, lat: 40.7200, lng: -73.998 },
    { name: 'Sarah W.', trade: 'Electrical', status: 'online', jobs: 1, rating: 4.7, lat: 40.7080, lng: -74.010 },
    { name: 'Mike R.', trade: 'Locksmith', status: 'offline', jobs: 0, rating: 4.6, lat: 40.7180, lng: -74.005 },
    { name: 'Lisa T.', trade: 'Plumbing', status: 'busy', jobs: 2, rating: 4.9, lat: 40.7120, lng: -73.995 },
    { name: 'Tom H.', trade: 'HVAC', status: 'online', jobs: 0, rating: 4.5, lat: 40.7250, lng: -74.000 },
]

const SERVICE_ICONS: Record<string, typeof Wrench> = {
    plumbing: Droplets, electrical: Zap, hvac: Thermometer, locksmith: KeyRound,
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    'submitted': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
    'searching': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
    'en-route': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    'arrived': { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-400' },
    'completed': { bg: 'bg-white/5', text: 'text-white/40', dot: 'bg-white/30' },
}

const TECH_STATUS: Record<string, { bg: string; text: string }> = {
    online: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    busy: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    offline: { bg: 'bg-white/5', text: 'text-white/30' },
}

export default function AdminDashboard() {
    const [time, setTime] = useState(new Date())
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        setTimeout(() => setRefreshing(false), 1500)
    }

    const mapMarkers: MapMarker[] = TECHNICIANS
        .filter(t => t.status !== 'offline')
        .map((t, i) => ({
            id: `tech-${i}`,
            lat: t.lat,
            lng: t.lng,
            type: 'pro' as const,
            label: t.name,
            pulse: t.status === 'busy',
        }))

    const colorMap: Record<string, { icon: string; iconBg: string }> = {
        emerald: { icon: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
        blue: { icon: 'text-blue-400', iconBg: 'bg-blue-500/10' },
        amber: { icon: 'text-amber-400', iconBg: 'bg-amber-500/10' },
        violet: { icon: 'text-violet-400', iconBg: 'bg-violet-500/10' },
    }

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            </span>
                            <span className="text-xs font-semibold text-emerald-400">Live</span>
                        </div>
                    </div>
                    <p className="text-sm text-white/40 mt-1">
                        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {' at '}
                        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.12] active:scale-[0.98]"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(({ label, value, change, trend, icon: Icon, color }) => {
                    const colors = colorMap[color]
                    return (
                        <div
                            key={label}
                            className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] overflow-hidden"
                        >
                            {/* Subtle gradient background */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.iconBg} blur-3xl`} />
                            
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.iconBg} transition-transform group-hover:scale-110`}>
                                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                                    </div>
                                    <span className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-emerald-400'}`}>
                                        <TrendingUp className={`h-3.5 w-3.5 ${trend === 'down' ? 'rotate-180' : ''}`} />
                                        {change}
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                                <p className="mt-1 text-sm text-white/40">{label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Live Requests */}
                <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Activity className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Live Requests</h3>
                                <p className="text-xs text-white/30">{LIVE_REQUESTS.filter(r => r.status !== 'completed').length} active</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/60 transition-colors">
                            <Eye className="h-4 w-4" />
                            View All
                        </button>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                        {LIVE_REQUESTS.map((req) => {
                            const Icon = SERVICE_ICONS[req.service] || Wrench
                            const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted
                            return (
                                <div key={req.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] cursor-pointer group">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-white/[0.06] transition-colors">
                                        <Icon className="h-5 w-5 text-white/50" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-semibold text-white">{req.customer}</span>
                                            {req.priority === 'emergency' && (
                                                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">URGENT</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/40 truncate">{req.address}</p>
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xs font-medium text-white/60">{req.tech || 'Searching...'}</p>
                                        <p className="text-xs text-white/30">{req.eta || '--'}</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.bg} ${status.text}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${req.status === 'searching' || req.status === 'en-route' ? 'animate-pulse' : ''}`} />
                                        {req.status}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Technicians */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <Users className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Technicians</h3>
                                <p className="text-xs text-white/30">{TECHNICIANS.filter(t => t.status !== 'offline').length} online</p>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                        {TECHNICIANS.map((tech, i) => {
                            const statusStyle = TECH_STATUS[tech.status]
                            return (
                                <div key={i} className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-white/[0.02] cursor-pointer">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.04] text-sm font-bold text-white/70">
                                        {tech.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white">{tech.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-white/40">
                                            <span>{tech.trade}</span>
                                            <span className="text-amber-400">{'*'.repeat(Math.floor(tech.rating))} {tech.rating}</span>
                                        </div>
                                    </div>
                                    <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                        {tech.status}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                            <MapPin className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Live Map</h3>
                            <p className="text-xs text-white/30">{mapMarkers.length} technicians active</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                        <ArrowUpRight className="h-4 w-4" />
                        Expand
                    </button>
                </div>
                <GoogleMap
                    center={{ lat: 40.7128, lng: -74.006 }}
                    zoom={13}
                    markers={mapMarkers}
                    style={{ height: 380 }}
                />
            </div>

            {/* Service Availability */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Service Availability</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { name: 'Plumbing', techs: 3, active: 2, icon: Droplets, color: 'blue' },
                        { name: 'Electrical', techs: 2, active: 1, icon: Zap, color: 'amber' },
                        { name: 'HVAC', techs: 2, active: 1, icon: Thermometer, color: 'violet' },
                        { name: 'Locksmith', techs: 1, active: 0, icon: KeyRound, color: 'emerald' },
                    ].map(svc => (
                        <div key={svc.name} className="group rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer">
                            <div className="flex items-center gap-2 mb-3">
                                <svc.icon className="h-4 w-4 text-white/50" />
                                <span className="text-sm font-medium text-white/70">{svc.name}</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <p className="text-2xl font-bold text-white">
                                    {svc.active}
                                    <span className="text-white/30 text-base font-normal">/{svc.techs}</span>
                                </p>
                                <span className={`text-xs font-medium ${svc.active > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                                    {svc.active > 0 ? 'Available' : 'None'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
