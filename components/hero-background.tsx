'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Premium animated landing background
 * Multi-layer: base gradient → mesh blobs → floating orbs → grain overlay
 */
export function HeroBackground() {
    const containerRef = useRef<HTMLDivElement>(null)
    const orbsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!orbsRef.current) return

        const orbs = orbsRef.current.querySelectorAll('.hero-orb')
        const tl = gsap.timeline()

        // Animate each orb with organic floating motion
        orbs.forEach((orb, i) => {
            const duration = 12 + i * 4
            const delay = i * 1.5

            gsap.to(orb, {
                x: () => gsap.utils.random(-60, 60),
                y: () => gsap.utils.random(-40, 40),
                scale: () => gsap.utils.random(0.85, 1.15),
                duration,
                delay,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
            })

            // Subtle opacity breathing
            gsap.to(orb, {
                opacity: () => gsap.utils.random(0.4, 0.8),
                duration: duration * 0.6,
                delay: delay + 2,
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
                duration: 120,
                ease: 'none',
                repeat: -1,
                transformOrigin: '50% 50%',
            })
        }

        return () => {
            tl.kill()
            gsap.killTweensOf(orbs)
            if (mesh) gsap.killTweensOf(mesh)
        }
    }, [])

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">

            {/* ── Layer 1: Rich gradient base ── */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
            linear-gradient(135deg, 
              #4a7c1f 0%, 
              #6a9b2d 20%, 
              #8FB34A 40%, 
              #7da33f 60%, 
              #5a8a1a 80%, 
              #3d6e12 100%
            )
          `,
                }}
            />

            {/* ── Layer 2: Animated mesh gradient (slow rotation) ── */}
            <div
                className="hero-mesh absolute inset-[-50%] opacity-50"
                style={{
                    background: `
            radial-gradient(ellipse 40% 50% at 30% 40%, rgba(168, 210, 90, 0.6) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 70% 60%, rgba(74, 124, 31, 0.5) 0%, transparent 70%),
            radial-gradient(ellipse 35% 45% at 50% 30%, rgba(255, 255, 255, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 45% 35% at 25% 70%, rgba(61, 110, 18, 0.4) 0%, transparent 70%)
          `,
                }}
            />

            {/* ── Layer 3: Floating orbs (GSAP animated) ── */}
            <div ref={orbsRef} className="absolute inset-0">
                {/* Large warm glow — top-left */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        top: '5%', left: '5%',
                        width: '45vw', height: '45vw',
                        maxWidth: 600, maxHeight: 600,
                        background: 'radial-gradient(circle, rgba(168,210,90,0.35) 0%, rgba(143,179,74,0.1) 50%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
                {/* Medium cool glow — bottom-right */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        bottom: '10%', right: '5%',
                        width: '35vw', height: '35vw',
                        maxWidth: 500, maxHeight: 500,
                        background: 'radial-gradient(circle, rgba(74,124,31,0.4) 0%, rgba(61,110,18,0.15) 50%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                />
                {/* Small bright accent — center-top */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        top: '20%', left: '50%',
                        width: '25vw', height: '25vw',
                        maxWidth: 350, maxHeight: 350,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(168,210,90,0.08) 50%, transparent 70%)',
                        filter: 'blur(40px)',
                        transform: 'translateX(-50%)',
                    }}
                />
                {/* Tiny bright dot — mid-right */}
                <div
                    className="hero-orb absolute rounded-full"
                    style={{
                        top: '45%', right: '15%',
                        width: '15vw', height: '15vw',
                        maxWidth: 200, maxHeight: 200,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)',
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
                        background: 'radial-gradient(circle, rgba(42,80,10,0.3) 0%, transparent 65%)',
                        filter: 'blur(50px)',
                    }}
                />
            </div>

            {/* ── Layer 4: Light streaks ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute -top-1/2 -right-1/4 w-[120%] h-[200%] opacity-[0.04]"
                    style={{
                        background: `
              repeating-linear-gradient(
                -45deg,
                transparent 0px,
                transparent 80px,
                rgba(255,255,255,0.5) 80px,
                rgba(255,255,255,0.5) 81px
              )
            `,
                    }}
                />
            </div>

            {/* ── Layer 5: Depth gradients (vignette + top fade) ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-transparent pointer-events-none" />

            {/* ── Layer 6: Subtle noise/grain texture ── */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '128px 128px',
                }}
            />
        </div>
    )
}
