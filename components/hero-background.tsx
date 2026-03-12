'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Premium animated landing background — Dark Glassmorphism
 * Multi-layer: deep dark base → olive mesh blobs → floating orbs → grain overlay
 */
export function HeroBackground() {
    const containerRef = useRef<HTMLDivElement>(null)
    const orbsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!orbsRef.current) return

        const orbs = orbsRef.current.querySelectorAll('.hero-orb')

        // Animate each orb with organic floating motion
        orbs.forEach((orb, i) => {
            const duration = 10 + i * 3
            const delay = i * 1.2

            gsap.to(orb, {
                x: () => gsap.utils.random(-80, 80),
                y: () => gsap.utils.random(-60, 60),
                scale: () => gsap.utils.random(0.8, 1.2),
                duration,
                delay,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
            })

            // Subtle opacity breathing
            gsap.to(orb, {
                opacity: () => gsap.utils.random(0.3, 0.7),
                duration: duration * 0.5,
                delay: delay + 1,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
            })
        })

        // Animate the mesh gradient rotation
        const mesh = containerRef.current?.querySelector('.hero-mesh')
        if (mesh) {
            gsap.to(mesh, {
                rotation: 360,
                duration: 90,
                ease: 'none',
                repeat: -1,
                transformOrigin: '50% 50%',
            })
        }

        // Animate ambient particles
        const particles = containerRef.current?.querySelectorAll('.hero-particle')
        if (particles) {
            particles.forEach((p, i) => {
                gsap.to(p, {
                    y: () => gsap.utils.random(-100, -300),
                    x: () => gsap.utils.random(-50, 50),
                    opacity: 0,
                    duration: gsap.utils.random(4, 8),
                    delay: i * 0.8,
                    ease: 'power1.out',
                    repeat: -1,
                    repeatDelay: gsap.utils.random(1, 3),
                })
            })
        }

        return () => {
            gsap.killTweensOf(orbs)
            if (mesh) gsap.killTweensOf(mesh)
            if (particles) gsap.killTweensOf(particles)
        }
    }, [])

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">

            {/* ── Layer 1: Deep dark base with subtle olive gradient ── */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
            linear-gradient(135deg, 
              #050505 0%, 
              #0A0E04 15%, 
              #0D1208 30%,
              #0A0A0A 50%, 
              #080C04 70%, 
              #050505 100%
            )
          `,
                }}
            />

            {/* ── Layer 2: Animated mesh gradient (slow rotation) ── */}
            <div
                className="hero-mesh absolute inset-[-50%] opacity-40"
                style={{
                    background: `
            radial-gradient(ellipse 40% 50% at 30% 40%, rgba(200, 230, 76, 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 70% 60%, rgba(100, 130, 30, 0.1) 0%, transparent 70%),
            radial-gradient(ellipse 35% 45% at 50% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 60%),
            radial-gradient(ellipse 45% 35% at 25% 70%, rgba(80, 110, 20, 0.08) 0%, transparent 70%)
          `,
                }}
            />

            {/* ── Layer 3: Floating orbs (GSAP animated) ── */}
            <div ref={orbsRef} className="absolute inset-0">
                {/* Large chartreuse glow — top-left */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        top: '5%', left: '5%',
                        width: '45vw', height: '45vw',
                        maxWidth: 600, maxHeight: 600,
                        background: 'radial-gradient(circle, rgba(200,230,76,0.08) 0%, rgba(200,230,76,0.02) 50%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                {/* Medium olive glow — bottom-right */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        bottom: '10%', right: '5%',
                        width: '35vw', height: '35vw',
                        maxWidth: 500, maxHeight: 500,
                        background: 'radial-gradient(circle, rgba(120,160,30,0.1) 0%, rgba(80,110,20,0.04) 50%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
                {/* Small bright accent — center-top */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        top: '20%', left: '50%',
                        width: '25vw', height: '25vw',
                        maxWidth: 350, maxHeight: 350,
                        background: 'radial-gradient(circle, rgba(200,230,76,0.06) 0%, rgba(200,230,76,0.02) 50%, transparent 70%)',
                        filter: 'blur(50px)',
                        transform: 'translateX(-50%)',
                    }}
                />
                {/* Tiny warm dot — mid-right */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        top: '45%', right: '15%',
                        width: '15vw', height: '15vw',
                        maxWidth: 200, maxHeight: 200,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)',
                        filter: 'blur(30px)',
                    }}
                />
                {/* Deep shadow — bottom-left */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        bottom: '5%', left: '15%',
                        width: '30vw', height: '30vw',
                        maxWidth: 400, maxHeight: 400,
                        background: 'radial-gradient(circle, rgba(100,140,25,0.06) 0%, transparent 65%)',
                        filter: 'blur(60px)',
                    }}
                />
            </div>

            {/* ── Layer 4: Topographic contour lines ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <svg
                    className="absolute inset-[-10%] w-[120%] h-[120%] animate-topo-drift"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    viewBox="0 0 1000 800"
                >
                    <defs>
                        <linearGradient id="heroTopoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#C8E64C" stopOpacity="0.05" />
                            <stop offset="50%" stopColor="#C8E64C" stopOpacity="0.025" />
                            <stop offset="100%" stopColor="#C8E64C" stopOpacity="0.04" />
                        </linearGradient>
                    </defs>
                    <g fill="none" stroke="url(#heroTopoGrad)" strokeWidth="0.7">
                        {/* Central terrain feature */}
                        <path d="M-50,350 Q200,200 450,300 T800,250 T1050,350" />
                        <path d="M-50,370 Q210,225 460,320 T810,270 T1050,370" />
                        <path d="M-50,395 Q225,255 475,345 T825,295 T1050,395" />
                        <path d="M-50,425 Q240,290 490,375 T840,325 T1050,425" />

                        {/* Upper contours */}
                        <path d="M-50,120 Q200,40 450,100 T850,60 T1050,130" />
                        <path d="M-50,140 Q210,60 460,120 T860,80 T1050,150" />
                        <path d="M-50,165 Q225,85 475,145 T875,105 T1050,175" />

                        {/* Lower contours */}
                        <path d="M-50,580 Q200,500 500,560 T900,520 T1050,590" />
                        <path d="M-50,600 Q210,520 510,580 T910,540 T1050,610" />
                        <path d="M-50,625 Q225,545 525,605 T925,565 T1050,635" />

                        {/* Contour island */}
                        <ellipse cx="650" cy="420" rx="140" ry="90" />
                        <ellipse cx="650" cy="420" rx="100" ry="60" />
                        <ellipse cx="650" cy="420" rx="60" ry="35" />
                    </g>
                </svg>

                {/* Secondary set (counter-drift) */}
                <svg
                    className="absolute inset-[-5%] w-[110%] h-[110%] animate-topo-drift-alt"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    viewBox="0 0 1000 800"
                >
                    <g fill="none" stroke="rgba(200, 230, 76, 0.02)" strokeWidth="0.5">
                        <path d="M-50,250 Q250,150 500,220 T900,180 T1050,260" />
                        <path d="M-50,270 Q260,170 510,240 T910,200 T1050,280" />
                        <path d="M-50,550 Q300,450 550,510 T850,470 T1050,550" />
                        <path d="M-50,570 Q310,470 560,530 T860,490 T1050,570" />
                    </g>
                </svg>
            </div>

            {/* ── Layer 4b: Light streaks ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-1/2 -right-1/4 w-[120%] h-[200%] opacity-[0.02]"
                    style={{
                        background: `
              repeating-linear-gradient(
                -45deg,
                transparent 0px,
                transparent 80px,
                rgba(200,230,76,0.3) 80px,
                rgba(200,230,76,0.3) 81px
              )
            `,
                    }}
                />
            </div>

            {/* ── Layer 5: Floating particles ── */}
            <div className="absolute inset-0 pointer-events-none">
                {[
                    { w: 2.5, h: 2.8, l: 15, t: 65, a: 0.35 },
                    { w: 1.8, h: 3.2, l: 32, t: 72, a: 0.28 },
                    { w: 3.1, h: 1.9, l: 48, t: 68, a: 0.42 },
                    { w: 2.2, h: 2.5, l: 62, t: 78, a: 0.32 },
                    { w: 1.5, h: 3.5, l: 75, t: 63, a: 0.38 },
                    { w: 2.9, h: 2.1, l: 85, t: 75, a: 0.25 },
                    { w: 2.0, h: 2.8, l: 25, t: 82, a: 0.45 },
                    { w: 3.3, h: 1.6, l: 55, t: 70, a: 0.30 },
                ].map((p, i) => (
                    <div
                        key={i}
                        className="hero-particle absolute rounded-full"
                        style={{
                            width: p.w,
                            height: p.h,
                            left: `${p.l}%`,
                            top: `${p.t}%`,
                            background: `rgba(200, 230, 76, ${p.a})`,
                            opacity: 0.6,
                        }}
                    />
                ))}
            </div>

            {/* ── Layer 6: Depth gradients (vignette) ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none" />

            {/* ── Layer 7: Subtle noise/grain texture ── */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '128px 128px',
                }}
            />
        </div>
    )
}
