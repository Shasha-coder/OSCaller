'use client'

/**
 * Dense doodle-style SVG background for service pages.
 * Inspired by WhatsApp-style pattern backgrounds.
 * Home service themed: wrenches, pipes, plugs, hammers, houses, faucets, etc.
 * Green thin outlines on a subtle green gradient.
 */

export function ServicePageBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none" aria-hidden="true">
            {/* Subtle gradient base */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#F6F8F4] via-[#F0F4EC] to-[#E8F0E0]" />

            <svg
                className="absolute inset-0 h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <defs>
                    <pattern id="service-doodles" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                        <g stroke="#8FB34A" fill="none" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.13">

                            {/* ─── Wrench ─── */}
                            <path d="M15 12 L20 7 L25 12 L20 17 Z" />
                            <path d="M20 17 L20 30" />
                            <path d="M17 27 L23 27" />

                            {/* ─── House ─── */}
                            <path d="M60 35 L70 25 L80 35" />
                            <rect x="63" y="35" width="14" height="12" rx="1" />
                            <rect x="68" y="41" width="4" height="6" />

                            {/* ─── Lightning bolt ─── */}
                            <path d="M130 8 L125 20 L131 20 L126 32" />

                            {/* ─── Faucet/Tap ─── */}
                            <path d="M155 25 L155 18 L165 18 L165 22" />
                            <path d="M162 22 Q162 28 158 32" />
                            <circle cx="155" cy="16" r="2" />

                            {/* ─── Hammer ─── */}
                            <path d="M40 70 L40 90" />
                            <rect x="35" y="65" width="10" height="8" rx="1" />

                            {/* ─── Gear/cog ─── */}
                            <circle cx="100" cy="80" r="8" />
                            <circle cx="100" cy="80" r="4" />
                            <line x1="100" y1="70" x2="100" y2="73" />
                            <line x1="100" y1="87" x2="100" y2="90" />
                            <line x1="90" y1="80" x2="93" y2="80" />
                            <line x1="107" y1="80" x2="110" y2="80" />
                            <line x1="93" y1="73" x2="95" y2="75" />
                            <line x1="105" y1="85" x2="107" y2="87" />
                            <line x1="93" y1="87" x2="95" y2="85" />
                            <line x1="105" y1="73" x2="107" y2="75" />

                            {/* ─── Pipe elbow ─── */}
                            <path d="M150 65 L150 80 Q150 85 155 85 L170 85" />
                            <path d="M147 72 L153 72" />

                            {/* ─── Key ─── */}
                            <circle cx="25" cy="120" r="5" />
                            <path d="M30 120 L45 120" />
                            <path d="M40 120 L40 116" />
                            <path d="M43 120 L43 117" />

                            {/* ─── Plug/Socket ─── */}
                            <rect x="70" y="115" width="12" height="16" rx="2" />
                            <line x1="74" y1="121" x2="74" y2="125" />
                            <line x1="78" y1="121" x2="78" y2="125" />
                            <path d="M74 115 L74 112" />
                            <path d="M78 115 L78 112" />

                            {/* ─── Thermometer ─── */}
                            <path d="M130 110 L130 130" />
                            <circle cx="130" cy="133" r="4" />
                            <line x1="133" y1="115" x2="136" y2="115" />
                            <line x1="133" y1="120" x2="135" y2="120" />
                            <line x1="133" y1="125" x2="136" y2="125" />

                            {/* ─── Droplet ─── */}
                            <path d="M170 110 Q170 100 175 95 Q180 100 180 110 Q180 116 175 118 Q170 116 170 110" />

                            {/* ─── Screwdriver ─── */}
                            <path d="M20 155 L35 140" />
                            <path d="M35 140 L38 137 L41 140 L38 143" />
                            <rect x="17" y="155" width="6" height="4" rx="1" transform="rotate(-45 20 157)" />

                            {/* ─── Fan / HVAC ─── */}
                            <circle cx="80" cy="165" r="3" />
                            <path d="M80 162 Q86 155 80 150" />
                            <path d="M83 165 Q90 162 92 168" />
                            <path d="M80 168 Q86 175 80 180" />
                            <path d="M77 165 Q70 162 68 168" />

                            {/* ─── Paintbrush ─── */}
                            <path d="M120 155 L130 145" />
                            <path d="M130 145 L135 142 L138 148 L133 150" />
                            <path d="M118 157 L122 157 L122 162 L118 162 Z" />

                            {/* ─── Toilet/Plunger ─── */}
                            <path d="M165 155 L165 170" />
                            <path d="M158 170 Q158 178 165 178 Q172 178 172 170" />

                            {/* ─── Small stars scattered ─── */}
                            <path d="M48 15 L50 10 L52 15 L48 15" />
                            <path d="M110 42 L112 38 L114 42 L110 42" />
                            <path d="M8 90 L10 86 L12 90 L8 90" />
                            <path d="M185 50 L187 46 L189 50 L185 50" />
                            <path d="M55 140 L57 136 L59 140 L55 140" />
                            <path d="M140 175 L142 171 L144 175 L140 175" />

                            {/* ─── Small circles ─── */}
                            <circle cx="95" cy="15" r="2" />
                            <circle cx="180" cy="140" r="2" />
                            <circle cx="45" cy="50" r="1.5" />
                            <circle cx="145" cy="45" r="1.5" />
                            <circle cx="10" cy="170" r="2" />
                            <circle cx="105" cy="145" r="1.5" />
                            <circle cx="50" cy="185" r="1.5" />
                            <circle cx="155" cy="185" r="2" />

                            {/* ─── Small crosses/plus signs ─── */}
                            <path d="M35 100 L35 106 M32 103 L38 103" />
                            <path d="M160 130 L160 136 M157 133 L163 133" />
                            <path d="M90 55 L90 59 M88 57 L92 57" />
                            <path d="M10 40 L10 44 M8 42 L12 42" />
                            <path d="M190 95 L190 99 M188 97 L192 97" />

                            {/* ─── Wavy lines ─── */}
                            <path d="M5 130 Q10 125 15 130 Q20 135 25 130" />
                            <path d="M140 60 Q145 55 150 60 Q155 65 160 60" />

                            {/* ─── Small squares/diamonds ─── */}
                            <rect x="115" y="55" width="5" height="5" rx="0.5" transform="rotate(45 117.5 57.5)" />
                            <rect x="55" y="95" width="4" height="4" rx="0.5" transform="rotate(45 57 97)" />
                            <rect x="175" y="160" width="4" height="4" rx="0.5" />

                            {/* ─── Saw ─── */}
                            <path d="M60 180 L90 180" />
                            <path d="M65 180 L68 175 L71 180 L74 175 L77 180 L80 175 L83 180 L86 175 L89 180" />
                            <rect x="90" y="177" width="5" height="6" rx="1" />

                        </g>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#service-doodles)" />
            </svg>
        </div>
    )
}
