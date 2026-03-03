'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GoogleMap } from '@/components/google-map'
import type { MapMarker } from '@/components/google-map'
import {
    Activity, Users, Wrench, DollarSign, Clock,
    TrendingUp, MapPin, Phone, CheckCircle2, AlertTriangle,
    Zap, Droplets, Thermometer, KeyRound, Bug, Home,
    RefreshCw, Eye, MoreHorizontal
} from 'lucide-react'

/* ─── Mock real-time data (replace with Supabase subscriptions) ─── */
const STATS = [
    { label: 'Active Requests', value: '12', change: '+3', icon: Activity, color: '#8FB34A', bgColor: 'rgba(143,179,74,0.1)' },
    { label: 'Online Technicians', value: '8', change: '+2', icon: Users, color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)' },
    { label: 'Revenue Today', value: '$2,840', change: '+18%', icon: DollarSign, color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)' },
    { label: 'Avg Response', value: '4.2m', change: '-12%', icon: Clock, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.1)' },
]

const LIVE_REQUESTS = [
    { id: 'REQ-001', customer: 'Maria S.', service: 'plumbing', address: '123 Main St', status: 'en-route', tech: 'Peter M.', eta: '8 min', priority: 'emergency' },
    { id: 'REQ-002', customer: 'John D.', service: 'electrical', address: '456 Oak Ave', status: 'searching', tech: '—', eta: '—', priority: 'urgent' },
    { id: 'REQ-003', customer: 'Sarah L.', service: 'hvac', address: '789 Pine Rd', status: 'arrived', tech: 'James K.', eta: 'On site', priority: 'standard' },
    { id: 'REQ-004', customer: 'Alex W.', service: 'locksmith', address: '321 Elm St', status: 'submitted', tech: '—', eta: '—', priority: 'emergency' },
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
    plumbing: Droplets, electrical: Zap, hvac: Thermometer,
    locksmith: KeyRound, pest: Bug, roofing: Home,
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    'submitted': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
    'searching': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
    'en-route': { bg: 'bg-[#8FB34A]/10', text: 'text-[#8FB34A]', dot: 'bg-[#8FB34A] animate-pulse' },
    'arrived': { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
    'completed': { bg: 'bg-white/5', text: 'text-white/40', dot: 'bg-white/30' },
}

const TECH_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    online: { bg: 'bg-[#8FB34A]/10', text: 'text-[#8FB34A]' },
    busy: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    offline: { bg: 'bg-white/5', text: 'text-white/30' },
}

const PRIORITY_COLORS: Record<string, string> = {
    emergency: 'text-red-400',
    urgent: 'text-amber-400',
    standard: 'text-white/40',
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

    return (
        <div className="p-4 lg:p-6 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-sm text-white/30">
                        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {' · '}
                        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3.5 py-2 text-xs font-medium text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/70"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <div className="flex items-center gap-1.5 rounded-xl bg-[#8FB34A]/10 px-3.5 py-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8FB34A] opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8FB34A]" />
                        </span>
                        <span className="text-xs font-semibold text-[#8FB34A]">Live</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATS.map(({ label, value, change, icon: Icon, color, bgColor }) => (
                    <div
                        key={label}
                        className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 transition-all hover:bg-white/[0.05]"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: bgColor }}>
                                <Icon className="h-[18px] w-[18px]" style={{ color }} />
                            </div>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8FB34A]">
                                <TrendingUp className="h-3 w-3" />
                                {change}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                        <p className="mt-0.5 text-xs text-white/30">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Live Requests Feed */}
                <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[#8FB34A]" />
                            <h3 className="text-sm font-semibold text-white">Live Requests</h3>
                            <span className="rounded-full bg-[#8FB34A]/10 px-2 py-0.5 text-[10px] font-bold text-[#8FB34A]">
                                {LIVE_REQUESTS.filter(r => r.status !== 'completed').length} active
                            </span>
                        </div>
                        <button className="text-white/30 hover:text-white/60">
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                        {LIVE_REQUESTS.map((req) => {
                            const Icon = SERVICE_ICONS[req.service] || Wrench
                            const statusStyle = STATUS_COLORS[req.status] || STATUS_COLORS.submitted
                            return (
                                <div key={req.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                                        <Icon className="h-4 w-4 text-white/40" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">{req.customer}</span>
                                            <span className={`text-[10px] font-bold uppercase ${PRIORITY_COLORS[req.priority]}`}>
                                                {req.priority === 'emergency' && '🔴 '}{req.priority}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/30 truncate">{req.address}</p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
                                        <span>{req.tech}</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                                        {req.status}
                                    </div>
                                    <span className="text-xs font-medium text-white/40 w-14 text-right">{req.eta}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Technician Grid */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <h3 className="text-sm font-semibold text-white">Technicians</h3>
                        </div>
                        <span className="text-xs text-white/30">{TECHNICIANS.filter(t => t.status !== 'offline').length} online</span>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                        {TECHNICIANS.map((tech, i) => {
                            const sc = TECH_STATUS_COLORS[tech.status]
                            return (
                                <div key={i} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-white/60">
                                        {tech.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">{tech.name}</p>
                                        <p className="text-[10px] text-white/30">{tech.trade} · ⭐ {tech.rating}</p>
                                    </div>
                                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                                        {tech.status}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Map Section */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#8FB34A]" />
                        <h3 className="text-sm font-semibold text-white">Live Map</h3>
                    </div>
                    <span className="text-xs text-white/30">{mapMarkers.length} active on map</span>
                </div>
                <GoogleMap
                    center={{ lat: 40.7128, lng: -74.006 }}
                    zoom={13}
                    markers={mapMarkers}
                    style={{ height: 340 }}
                />
            </div>

            {/* Service Overview */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Service Availability</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { name: 'Plumbing', techs: 3, active: 2, icon: Droplets },
                        { name: 'Electrical', techs: 2, active: 1, icon: Zap },
                        { name: 'HVAC', techs: 2, active: 1, icon: Thermometer },
                        { name: 'Locksmith', techs: 1, active: 0, icon: KeyRound },
                    ].map(svc => (
                        <div key={svc.name} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <svc.icon className="h-4 w-4 text-white/40" />
                                <span className="text-xs font-semibold text-white/70">{svc.name}</span>
                            </div>
                            <p className="text-lg font-bold text-white">{svc.active}<span className="text-white/30 text-sm">/{svc.techs}</span></p>
                            <p className="text-[10px] text-white/30">technicians active</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
