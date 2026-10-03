'use client'
/**
 * Animated particle + grid background. Pure CSS to keep things light and
 * avoid runtime canvas bugs. Particles are positioned via deterministic
 * styles so they look organic without re-rendering on every frame.
 */
import { useMemo } from 'react'

export function AnimatedBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 2 + (i % 3),
        delay: `${(i * 0.7) % 6}s`,
        duration: `${6 + (i % 5) * 2}s`,
        color: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#a78bfa' : '#34d399',
      })),
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-3xl" />
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.4,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}
