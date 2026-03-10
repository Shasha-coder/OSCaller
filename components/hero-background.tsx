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

            {/* ── Layer 4: Light streaks ── */}
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
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="hero-particle absolute rounded-full"
                        style={{
                            width: Math.random() * 3 + 1,
                            height: Math.random() * 3 + 1,
                            left: `${Math.random() * 100}%`,
                            top: `${60 + Math.random() * 30}%`,
                            background: `rgba(200, 230, 76, ${0.2 + Math.random() * 0.3})`,
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
