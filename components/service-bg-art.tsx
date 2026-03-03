'use client'

/**
 * Lightweight SVG art backgrounds for service pages.
 * Thin green line art at visible but subtle opacity.
 * Each element shows abstract representations of home service tools.
 */

export function ServicePageBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none" aria-hidden="true">
            <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 1440 900"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
            >
                {/* ─── Wrench (top-left) ─── */}
                <g opacity="0.08" stroke="#8FB34A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M80 120 L95 105 L110 120 L95 135 Z" />
                    <path d="M95 135 L95 180" />
                    <path d="M85 170 L105 170" />
                    <path d="M85 180 L105 180" />
                </g>

                {/* ─── Pipe/Plumbing (top-right area) ─── */}
                <g opacity="0.07" stroke="#8FB34A" strokeWidth="1" strokeLinecap="round">
                    <path d="M1200 80 L1200 140 Q1200 160 1220 160 L1300 160" />
                    <path d="M1300 160 Q1320 160 1320 180 L1320 220" />
                    <path d="M1180 130 L1220 130" />
                    <circle cx="1200" cy="80" r="8" />
                    <circle cx="1320" cy="220" r="6" />
                </g>

                {/* ─── Lightning bolt / Electrical (center-left) ─── */}
                <g opacity="0.06" stroke="#8FB34A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M120 380 L140 360 L130 400 L150 380 L140 420" />
                    <circle cx="135" cy="390" r="30" strokeDasharray="4 6" />
                </g>

                {/* ─── House outline (center) ─── */}
                <g opacity="0.06" stroke="#8FB34A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M700 350 L720 330 L740 350" />
                    <path d="M704 348 L704 380 L736 380 L736 348" />
                    <path d="M715 380 L715 365 L725 365 L725 380" />
                </g>

                {/* ─── Gear/Cog (bottom-left) ─── */}
                <g opacity="0.07" stroke="#8FB34A" strokeWidth="0.8" strokeLinecap="round">
                    <circle cx="200" cy="700" r="25" />
                    <circle cx="200" cy="700" r="12" />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                        <line
                            key={angle}
                            x1={200 + 22 * Math.cos(angle * Math.PI / 180)}
                            y1={700 + 22 * Math.sin(angle * Math.PI / 180)}
                            x2={200 + 30 * Math.cos(angle * Math.PI / 180)}
                            y2={700 + 30 * Math.sin(angle * Math.PI / 180)}
                        />
                    ))}
                </g>

                {/* ─── Key (right side) ─── */}
                <g opacity="0.07" stroke="#8FB34A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="1300" cy="450" r="12" />
                    <path d="M1312 450 L1360 450" />
                    <path d="M1345 450 L1345 440" />
                    <path d="M1355 450 L1355 442" />
                </g>

                {/* ─── Thermometer (bottom-right area) ─── */}
                <g opacity="0.07" stroke="#8FB34A" strokeWidth="0.8" strokeLinecap="round">
                    <path d="M1250 650 L1250 710" />
                    <circle cx="1250" cy="720" r="10" />
                    <path d="M1245 660 L1255 660" />
                    <path d="M1245 680 L1255 680" />
                    <path d="M1245 700 L1255 700" />
                </g>

                {/* ─── Abstract network lines (scattered) ─── */}
                <g opacity="0.05" stroke="#8FB34A" strokeWidth="0.6">
                    {/* Top connecting lines */}
                    <path d="M400 60 Q500 100 600 50" />
                    <path d="M800 40 Q900 80 1000 30" />

                    {/* Middle scattered dots + connections */}
                    <circle cx="500" cy="500" r="3" />
                    <circle cx="550" cy="520" r="2" />
                    <circle cx="480" cy="540" r="2" />
                    <path d="M500 500 L550 520" />
                    <path d="M500 500 L480 540" />

                    <circle cx="900" cy="300" r="3" />
                    <circle cx="950" cy="280" r="2" />
                    <circle cx="920" cy="340" r="2" />
                    <path d="M900 300 L950 280" />
                    <path d="M900 300 L920 340" />

                    {/* Bottom flowing lines */}
                    <path d="M100 800 Q300 780 500 820 Q700 860 900 830" />
                    <path d="M200 850 Q400 830 600 870" />
                </g>

                {/* ─── Droplet (water) ─── */}
                <g opacity="0.07" stroke="#8FB34A" strokeWidth="0.8" fill="none">
                    <path d="M380 200 Q380 180 400 160 Q420 180 420 200 Q420 215 400 220 Q380 215 380 200" />
                </g>

                {/* ─── Screwdriver (mid-right) ─── */}
                <g opacity="0.06" stroke="#8FB34A" strokeWidth="0.8" strokeLinecap="round">
                    <path d="M1100 550 L1130 520" />
                    <path d="M1130 520 L1140 510 L1145 515 L1135 525" />
                    <path d="M1095 555 L1105 555 L1105 545 L1095 545 Z" />
                </g>

                {/* ─── Fan blades / HVAC (top center) ─── */}
                <g opacity="0.06" stroke="#8FB34A" strokeWidth="0.8" strokeLinecap="round">
                    <circle cx="720" cy="150" r="3" />
                    <path d="M720 147 Q730 130 720 120" />
                    <path d="M723 150 Q740 145 745 155" />
                    <path d="M720 153 Q730 170 720 180" />
                    <path d="M717 150 Q700 145 695 155" />
                    <circle cx="720" cy="150" r="22" strokeDasharray="3 5" />
                </g>

                {/* ─── Scattered geometric accents ─── */}
                <g opacity="0.04" stroke="#8FB34A" strokeWidth="0.6">
                    <rect x="350" y="650" width="15" height="15" rx="2" transform="rotate(15 357 657)" />
                    <rect x="850" y="750" width="10" height="10" rx="1" transform="rotate(-20 855 755)" />
                    <polygon points="600,700 607,715 593,715" />
                    <polygon points="1050,200 1057,215 1043,215" />
                    <circle cx="450" cy="400" r="5" strokeDasharray="2 3" />
                    <circle cx="1150" cy="350" r="8" strokeDasharray="2 4" />
                </g>

                {/* ─── Subtle grid dots (background texture) ─── */}
                <g opacity="0.035" fill="#8FB34A">
                    {Array.from({ length: 8 }).map((_, row) =>
                        Array.from({ length: 12 }).map((_, col) => (
                            <circle
                                key={`dot-${row}-${col}`}
                                cx={120 + col * 110}
                                cy={100 + row * 100}
                                r="1"
                            />
                        ))
                    )}
                </g>
            </svg>
        </div>
    )
}
