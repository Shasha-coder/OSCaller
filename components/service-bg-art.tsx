'use client'

/**
 * Premium topographic contour-line SVG background.
 * Replaces the old doodle-style pattern with flowing organic terrain lines.
 * Used on service pages, provider dashboard, etc.
 */

export function ServicePageBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none" aria-hidden="true">

            {/* ── Layer 0: Tiled home-service icon pattern (WhatsApp/IG style) ── */}
            <svg
                className="absolute inset-0 h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern id="serviceIcons" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                        {/* Wrench */}
                        <g transform="translate(10,10) scale(0.7)" fill="none" stroke="rgba(200,230,76,0.04)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </g>
                        {/* Lightning bolt */}
                        <g transform="translate(70,10) scale(0.7)" fill="none" stroke="rgba(200,230,76,0.04)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                        </g>
                        {/* Water drop / Plumbing */}
                        <g transform="translate(10,70) scale(0.7)" fill="none" stroke="rgba(200,230,76,0.04)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v6m0 0a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3m0-7a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3m0 0v7" />
                            <path d="M6 8h12" />
                        </g>
                        {/* Lock / Locksmith */}
                        <g transform="translate(70,70) scale(0.7)" fill="none" stroke="rgba(200,230,76,0.04)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </g>
                        {/* Thermometer / HVAC */}
                        <g transform="translate(40,40) scale(0.6)" fill="none" stroke="rgba(200,230,76,0.035)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                        </g>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#serviceIcons)" />
            </svg>

            {/* ── Layer 1: Subtle base gradient ── */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse 60% 50% at 20% 80%, rgba(200, 230, 76, 0.03) 0%, transparent 70%),
                        radial-gradient(ellipse 50% 60% at 80% 20%, rgba(200, 230, 76, 0.02) 0%, transparent 70%)
                    `,
                }}
            />

            {/* ── Layer 2: Topographic contour lines (primary set) ── */}
            <svg
                className="absolute inset-0 h-full w-full animate-topo-drift"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                viewBox="0 0 1200 800"
            >
                <defs>
                    <linearGradient id="topoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C8E64C" stopOpacity="0.06" />
                        <stop offset="50%" stopColor="#C8E64C" stopOpacity="0.03" />
                        <stop offset="100%" stopColor="#C8E64C" stopOpacity="0.05" />
                    </linearGradient>
                </defs>
                <g fill="none" stroke="url(#topoGrad1)" strokeWidth="0.8">
                    <path d="M-50,400 Q150,200 400,350 T800,300 T1250,400" />
                    <path d="M-50,420 Q160,230 410,370 T810,320 T1250,420" />
                    <path d="M-50,445 Q170,260 425,395 T825,345 T1250,445" />
                    <path d="M100,500 Q300,350 500,420 T900,380 T1200,480" />
                    <path d="M100,520 Q310,370 510,440 T910,400 T1200,500" />
                    <path d="M100,545 Q325,395 525,465 T925,425 T1200,525" />
                    <path d="M250,460 Q400,380 550,430 T800,410 T1050,470" />
                    <path d="M250,478 Q410,400 560,448 T810,428 T1050,488" />
                    <path d="M-50,150 Q200,50 450,120 T850,80 T1250,160" />
                    <path d="M-50,170 Q210,70 460,140 T860,100 T1250,180" />
                    <path d="M-50,195 Q225,95 475,165 T875,125 T1250,205" />
                    <path d="M-50,650 Q200,550 500,620 T900,580 T1250,660" />
                    <path d="M-50,670 Q210,570 510,640 T910,600 T1250,680" />
                    <path d="M-50,695 Q225,595 525,665 T925,625 T1250,705" />
                </g>
            </svg>

            {/* ── Layer 3: Secondary contour set ── */}
            <svg
                className="absolute inset-0 h-full w-full animate-topo-drift-alt"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                viewBox="0 0 1200 800"
            >
                <g fill="none" stroke="rgba(200, 230, 76, 0.025)" strokeWidth="0.6">
                    <path d="M-100,100 Q200,300 500,200 T900,350 T1300,250" />
                    <path d="M-100,120 Q210,320 510,220 T910,370 T1300,270" />
                    <path d="M-100,145 Q225,345 525,245 T925,395 T1300,295" />
                    <ellipse cx="700" cy="500" rx="180" ry="120" />
                    <ellipse cx="700" cy="500" rx="140" ry="90" />
                    <ellipse cx="700" cy="500" rx="100" ry="60" />
                    <ellipse cx="700" cy="500" rx="60" ry="35" />
                    <path d="M-50,750 Q300,650 600,700 T1000,660 T1250,740" />
                    <path d="M-50,770 Q310,670 610,720 T1010,680 T1250,760" />
                </g>
            </svg>

            {/* ── Layer 4: Vignette for depth ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
        </div>
    )
}
