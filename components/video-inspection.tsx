'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface VideoAnalysis {
    description: string
    issue_detected: string
    severity: string
    suggested_trade: string
    tools_needed: string[]
    follow_up_questions: string[]
    advice: string
}

interface Props {
    requestId?: string
    onAnalysis?: (analysis: VideoAnalysis) => void
    onClose: () => void
}

export function VideoInspection({ requestId, onAnalysis, onClose }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const [isStreaming, setIsStreaming] = useState(false)
    const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [frameCount, setFrameCount] = useState(0)

    // Start camera stream
    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Rear camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }
            setIsStreaming(true)

            // Play start chime
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                const playTone = (f: number, t: number, v = 0.2) => {
                    const o = ctx.createOscillator()
                    const g = ctx.createGain()
                    o.connect(g); g.connect(ctx.destination)
                    o.frequency.value = f; o.type = 'sine'
                    g.gain.setValueAtTime(v, t)
                    g.gain.exponentialRampToValueAtTime(0.005, t + 0.15)
                    o.start(t); o.stop(t + 0.15)
                }
                const now = ctx.currentTime
                playTone(784, now)        // G5
                playTone(1047, now + 0.1) // C6
            } catch { }

        } catch (err: any) {
            console.error('[video] Camera error:', err)
            setError(err?.message?.includes('Permission')
                ? 'Camera access denied. Please allow camera permission.'
                : 'Could not access camera. Is it in use by another app?')
        }
    }, [])

    // Capture a frame and analyze
    const captureAndAnalyze = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || analyzing) return

        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = Math.min(video.videoWidth, 640)
        canvas.height = Math.min(video.videoHeight, 480)

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const frame = canvas.toDataURL('image/jpeg', 0.7) // Compress for speed

        setAnalyzing(true)
        setFrameCount(prev => prev + 1)

        try {
            const res = await fetch('/api/video-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frame, requestId }),
            })

            if (res.ok) {
                const data = await res.json()
                if (data.analysis) {
                    setAnalysis(data.analysis)
                    onAnalysis?.(data.analysis)
                }
            }
        } catch (err) {
            console.error('[video] Analysis failed:', err)
        } finally {
            setAnalyzing(false)
        }
    }, [analyzing, requestId, onAnalysis])

    // Auto-analyze every 4 seconds
    useEffect(() => {
        if (!isStreaming) return

        // First capture after 1.5s
        const firstCapture = setTimeout(() => captureAndAnalyze(), 1500)

        // Then every 4s
        intervalRef.current = setInterval(() => captureAndAnalyze(), 4000)

        return () => {
            clearTimeout(firstCapture)
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isStreaming, captureAndAnalyze])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop())
            }
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    // Stop and close
    const handleClose = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setIsStreaming(false)
        onClose()
    }, [onClose])

    const severityColor = {
        minor: 'text-green-400 bg-green-400/10 border-green-400/30',
        moderate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
        serious: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
        emergency: 'text-red-400 bg-red-400/10 border-red-400/30',
    }

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#0A0A0A]/98 backdrop-blur-2xl">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/15">
                        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[14px] font-bold text-white">Live Video Inspection</h2>
                        <p className="text-[11px] text-white/40">
                            {isStreaming
                                ? analyzing ? 'Analyzing...' : `Frame ${frameCount} • AI watching`
                                : 'Point camera at the issue'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    data-no-focus-ring
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white transition-all outline-none"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden">
                {!isStreaming ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
                        {error ? (
                            <>
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20">
                                    <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5l-1.409-2.409M10.5 5.25H4.5A2.25 2.25 0 0 0 2.25 7.5v1.5M3.75 3.75l16.5 16.5" />
                                    </svg>
                                </div>
                                <p className="text-red-400 text-sm font-medium text-center">{error}</p>
                                <button
                                    onClick={startCamera}
                                    className="px-6 py-3 rounded-2xl bg-white/[0.06] text-white/70 text-sm font-semibold hover:bg-white/[0.1] transition-all"
                                >Try again</button>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 -m-4 rounded-full bg-[#C8E64C]/10 animate-pulse" />
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#C8E64C]/10 border border-[#C8E64C]/20">
                                        <svg className="h-10 w-10 text-[#C8E64C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg mb-1">Show Aria what's happening</p>
                                    <p className="text-white/50 text-sm max-w-[260px]">Point your camera at the issue. Aria will analyze it in real-time and help diagnose the problem.</p>
                                </div>
                                <button
                                    onClick={startCamera}
                                    data-no-focus-ring
                                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#C8E64C] to-[#7DA33F] text-white font-bold shadow-[0_4px_20px_rgba(200,230,76,0.3)] hover:shadow-[0_6px_28px_rgba(200,230,76,0.4)] transition-all active:scale-[0.98] outline-none"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                    Start Camera
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Video feed */}
                        <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            playsInline
                            muted
                            autoPlay
                        />

                        {/* Scanning overlay */}
                        {analyzing && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#C8E64C] to-transparent animate-[scanLine_2s_ease-in-out_infinite]" />
                                <div className="absolute top-4 right-4 flex items-center gap-2 rounded-xl bg-[#0A0A0A]/70 backdrop-blur-lg px-3 py-1.5 border border-[#C8E64C]/20">
                                    <div className="h-2 w-2 rounded-full bg-[#C8E64C] animate-pulse" />
                                    <span className="text-[11px] font-bold text-[#C8E64C]">AI Analyzing</span>
                                </div>
                            </div>
                        )}

                        {/* Recording indicator */}
                        {!analyzing && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 rounded-xl bg-[#0A0A0A]/60 backdrop-blur-lg px-3 py-1.5 border border-white/[0.08]">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[11px] font-semibold text-white/70">LIVE</span>
                            </div>
                        )}

                        {/* Manual capture button */}
                        <button
                            onClick={captureAndAnalyze}
                            disabled={analyzing}
                            data-no-focus-ring
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0A0A0A]/70 backdrop-blur-xl border border-white/[0.1] text-white font-semibold text-sm transition-all hover:bg-[#0A0A0A]/80 active:scale-[0.97] outline-none disabled:opacity-50"
                        >
                            <svg className="h-4 w-4 text-[#C8E64C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                            {analyzing ? 'Analyzing...' : 'Capture & Analyze'}
                        </button>
                    </>
                )}
            </div>

            {/* Analysis Results Panel */}
            {analysis && isStreaming && (
                <div className="border-t border-white/[0.06] bg-[#0A0A0A]/95 backdrop-blur-2xl px-4 py-3 max-h-[40%] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {/* Severity badge */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                            'px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase border',
                            severityColor[analysis.severity as keyof typeof severityColor] || severityColor.moderate
                        )}>
                            {analysis.severity}
                        </span>
                        {analysis.suggested_trade && analysis.suggested_trade !== 'general' && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-[#C8E64C] bg-[#C8E64C]/10 border border-[#C8E64C]/20 uppercase">
                                {analysis.suggested_trade}
                            </span>
                        )}
                    </div>

                    {/* Issue */}
                    <p className="text-[13px] font-semibold text-white mb-1">{analysis.issue_detected}</p>
                    <p className="text-[12px] text-white/50 mb-3 leading-relaxed">{analysis.description}</p>

                    {/* Advice */}
                    {analysis.advice && (
                        <div className="rounded-xl bg-[#C8E64C]/[0.06] border border-[#C8E64C]/10 px-3 py-2 mb-3">
                            <p className="text-[11px] font-bold text-[#C8E64C] mb-0.5">💡 Advice</p>
                            <p className="text-[12px] text-white/70">{analysis.advice}</p>
                        </div>
                    )}

                    {/* Follow-up questions */}
                    {analysis.follow_up_questions?.length > 0 && (
                        <div className="mt-2">
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">Questions to ask</p>
                            <ul className="space-y-1">
                                {analysis.follow_up_questions.map((q, i) => (
                                    <li key={i} className="text-[12px] text-white/60 flex gap-1.5">
                                        <span className="text-[#C8E64C] shrink-0">•</span>
                                        <span>{q}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
