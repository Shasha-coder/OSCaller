'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

/* ─── Types ─── */
export interface MapMarker {
    id: string
    lat: number
    lng: number
    type: 'user' | 'pro' | 'service'
    label?: string
    pulse?: boolean
    heading?: number
}

export interface MapRoute {
    from: { lat: number; lng: number }
    to: { lat: number; lng: number }
}

interface GoogleMapProps {
    center?: { lat: number; lng: number }
    zoom?: number
    markers?: MapMarker[]
    route?: MapRoute | null
    className?: string
    style?: React.CSSProperties
    onMapReady?: (map: google.maps.Map) => void
}

/* ─── Premium dark map styling ─── */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
    // Base: near‑black land
    { elementType: 'geometry', stylers: [{ color: '#0d0f12' }] },
    { elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0f12' }] },
    // Administrative
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1a1f2b' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#3a4252' }] },
    // POI
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111318' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#3a4252' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f1410' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3a5a32' }] },
    // Roads
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161a22' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1f2b' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1c2130' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e2636' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#252d3d' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#5a6578' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#3a4252' }] },
    // Transit
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#141821' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#141821' }] },
    // Water: subtle brand‑tinted dark teal
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1018' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2a3a4a' }] },
]

/* ─── Script loader singleton ─── */
let loadPromise: Promise<void> | null = null
let scriptLoaded = false

function loadGoogleMapsScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()

    // Already loaded
    if (window.google?.maps?.Map) {
        scriptLoaded = true
        return Promise.resolve()
    }

    // Loading in progress
    if (loadPromise) return loadPromise

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''

    if (!apiKey) {
        console.warn('[GoogleMap] No API key found. Set NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local')
        return Promise.reject(new Error('No Google Maps API key'))
    }

    loadPromise = new Promise((resolve, reject) => {
        // Use callback approach for reliability
        const callbackName = '__googleMapsCallback'
            ; (window as any)[callbackName] = () => {
                scriptLoaded = true
                delete (window as any)[callbackName]
                resolve()
            }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=${callbackName}`
        script.async = true
        script.defer = true
        script.onerror = () => {
            loadPromise = null
            delete (window as any)[callbackName]
            reject(new Error('Failed to load Google Maps script'))
        }
        document.head.appendChild(script)
    })

    return loadPromise
}

/* ─── Marker HTML builders ─── */
function createUserMarkerHTML(pulse: boolean) {
    return `
  <div style="position:relative;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%)">
    ${pulse ? `
      <div style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(200,230,76,0.15);animation:mapPulse 2s ease-out infinite"></div>
      <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(200,230,76,0.2);animation:mapPulse 2s ease-out 0.5s infinite"></div>
    ` : ''}
    <div style="width:20px;height:20px;border-radius:50%;background:#C8E64C;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);z-index:2"></div>
  </div>`
}

function createProMarkerHTML(label: string, heading?: number) {
    const rotation = heading ? `transform:rotate(${heading}deg)` : ''
    return `
  <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
    <div style="background:#0F172A;color:white;border-radius:14px;padding:6px 12px;font-size:11px;font-weight:700;font-family:Inter,system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.3);white-space:nowrap;display:flex;align-items:center;gap:5px">
      <div style="width:6px;height:6px;border-radius:50%;background:#C8E64C;box-shadow:0 0 6px rgba(200,230,76,0.6)"></div>
      ${label || 'Pro'}
    </div>
    <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #0F172A;margin-top:-1px"></div>
    <div style="position:absolute;bottom:-24px;${rotation}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
      </svg>
    </div>
  </div>`
}

function createServiceMarkerHTML() {
    return `
  <div style="transform:translate(-50%,-50%)">
    <div style="width:32px;height:32px;border-radius:10px;background:rgba(200,230,76,0.1);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.15)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8E64C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7Z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    </div>
  </div>`
}

/* ─── Loading skeleton ─── */
function MapSkeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div className={cn('relative overflow-hidden rounded-3xl bg-[#0d0f12]', className)} style={style}>
            <div className="absolute inset-0 animate-shimmer" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] shadow-lg backdrop-blur-sm border border-white/[0.08]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C8E64C]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                </div>
                <span className="text-xs font-medium text-[#C8E64C]/60">Loading map…</span>
            </div>
            <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="mapGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#C8E64C" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapGrid)" />
            </svg>
        </div>
    )
}

/* ─── Main GoogleMap component ─── */
export function GoogleMap({
    center,
    zoom = 15,
    markers = [],
    route = null,
    className,
    style,
    onMapReady,
}: GoogleMapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<google.maps.Map | null>(null)
    const overlaysRef = useRef<google.maps.OverlayView[]>([])
    const polylineRef = useRef<google.maps.Polyline | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState(false)

    /* Load Google Maps script */
    useEffect(() => {
        let cancelled = false
        loadGoogleMapsScript()
            .then(() => { if (!cancelled) setLoaded(true) })
            .catch(() => { if (!cancelled) setError(true) })
        return () => { cancelled = true }
    }, [])

    /* Initialize map */
    useEffect(() => {
        if (!loaded || !containerRef.current || mapRef.current) return

        const defaultCenter = center || { lat: 40.7128, lng: -74.006 }

        try {
            const map = new google.maps.Map(containerRef.current, {
                center: defaultCenter,
                zoom,
                styles: MAP_STYLES,
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
                gestureHandling: 'greedy',
                clickableIcons: false,
            })

            mapRef.current = map
            onMapReady?.(map)
        } catch (err) {
            console.error('[GoogleMap] Failed to initialize map:', err)
            setError(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded])

    /* Update markers */
    useEffect(() => {
        if (!mapRef.current || !loaded) return
        const map = mapRef.current

        // Remove old overlays
        overlaysRef.current.forEach(ov => ov.setMap(null))
        overlaysRef.current = []

        markers.forEach(m => {
            const markerDiv = document.createElement('div')
            markerDiv.style.position = 'absolute'
            markerDiv.style.pointerEvents = 'none'
            markerDiv.style.zIndex = m.type === 'pro' ? '30' : m.type === 'user' ? '20' : '10'
            markerDiv.style.transition = 'left 0.8s ease-out, top 0.8s ease-out'

            if (m.type === 'user') {
                markerDiv.innerHTML = createUserMarkerHTML(m.pulse ?? false)
            } else if (m.type === 'pro') {
                markerDiv.innerHTML = createProMarkerHTML(m.label || 'Pro', m.heading)
            } else {
                markerDiv.innerHTML = createServiceMarkerHTML()
            }

            const overlay = new google.maps.OverlayView()
            overlay.onAdd = function () {
                const pane = this.getPanes()?.overlayMouseTarget
                if (pane) pane.appendChild(markerDiv)
            }
            overlay.draw = function () {
                const projection = this.getProjection()
                if (!projection) return
                const pos = projection.fromLatLngToDivPixel(new google.maps.LatLng(m.lat, m.lng))
                if (pos) {
                    markerDiv.style.left = pos.x + 'px'
                    markerDiv.style.top = pos.y + 'px'
                }
            }
            overlay.onRemove = function () {
                markerDiv.remove()
            }
            overlay.setMap(map)
            overlaysRef.current.push(overlay)
        })
    }, [markers, loaded])

    /* Update route polyline with animated dashed line */
    useEffect(() => {
        if (!mapRef.current || !loaded) return

        if (polylineRef.current) {
            polylineRef.current.setMap(null)
            polylineRef.current = null
        }

        if (route) {
            polylineRef.current = new google.maps.Polyline({
                path: [
                    new google.maps.LatLng(route.from.lat, route.from.lng),
                    new google.maps.LatLng(route.to.lat, route.to.lng),
                ],
                strokeColor: '#C8E64C',
                strokeOpacity: 0,
                strokeWeight: 3,
                icons: [{
                    icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 0.6,
                        strokeWeight: 3,
                        strokeColor: '#C8E64C',
                        scale: 3,
                    },
                    offset: '0',
                    repeat: '16px',
                }],
                map: mapRef.current,
            })

            // Animate the dashes
            let offset = 0
            const animateInterval = setInterval(() => {
                offset = (offset + 0.5) % 100
                polylineRef.current?.set('icons', [{
                    icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 0.6,
                        strokeWeight: 3,
                        strokeColor: '#C8E64C',
                        scale: 3,
                    },
                    offset: offset + '%',
                    repeat: '16px',
                }])
            }, 50)

            return () => clearInterval(animateInterval)
        }
    }, [route, loaded])

    /* Update center smoothly */
    useEffect(() => {
        if (mapRef.current && center) {
            mapRef.current.panTo(center)
        }
    }, [center])

    /* Update zoom */
    useEffect(() => {
        if (mapRef.current && zoom) {
            mapRef.current.setZoom(zoom)
        }
    }, [zoom])

    if (error) {
        return (
            <div className={cn('relative overflow-hidden rounded-3xl bg-[#0d0f12] flex items-center justify-center', className)} style={style}>
                <div className="text-center px-6">
                    <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[rgba(200,230,76,0.06)] border border-[#C8E64C]/10 mb-3">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C8E64C]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-white/80">Map unavailable</p>
                    <p className="text-xs text-white/40 mt-1">Check your API key and enable Maps JavaScript API in Google Cloud Console.</p>
                </div>
            </div>
        )
    }

    if (!loaded) {
        return <MapSkeleton className={className} style={style} />
    }

    return (
        <div
            ref={containerRef}
            className={cn('overflow-hidden', className)}
            style={{ backgroundColor: '#0d0f12', ...style }}
        />
    )
}
