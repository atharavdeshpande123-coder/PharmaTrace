'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Factory, Truck, Warehouse, Users, Store, Box } from 'lucide-react'

/**
 * PharmaTrace Verification Scene
 *
 * A high-end cinematic recreation of the signature pharma-supply-chain animation:
 *   - Central glass medicine vial with blue liquid + chrome cap + "GENUINE MEDICINE" label
 *   - Glowing circular platform beneath the vial with concentric pulse rings + radar sweep
 *   - DNA double helix on the left (slow twisting rotation)
 *   - Hub-and-spoke supply-chain network on the right (Factory → Truck → Warehouse → Store → Users)
 *     with flowing data pulses along the connecting lines
 *   - Floating bokeh particles in the background
 *   - Faint hexagonal grid pattern
 *
 * Designed for light + dark mode, mobile + desktop, and respects prefers-reduced-motion.
 */
export function PharmaVerificationScene({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()
  // Only render random particles after mount to avoid SSR/CSR hydration
  // mismatches (Math.random() produces different values on server vs client).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Pre-generate particle field (stable across renders, client-only)
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 3.5,
        delay: Math.random() * 4,
        duration: 5 + Math.random() * 5,
        cyan: i % 2 === 0,
      })),
    [],
  )

  // Supply-chain network nodes (right side hub-and-spoke around central block icon)
  const networkNodes = [
    { icon: Factory, label: 'MFG', angle: -90, color: '#34d399' },
    { icon: Truck, label: 'LOGISTICS', angle: -30, color: '#2F80ED' },
    { icon: Warehouse, label: 'WHOLESALER', angle: 30, color: '#2F80ED' },
    { icon: Store, label: 'PHARMACY', angle: 90, color: '#34d399' },
    { icon: Users, label: 'PATIENT', angle: 150, color: '#a78bfa' },
    { icon: Box, label: 'BATCH', angle: 210, color: '#2F80ED' },
  ]

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-border/40 bg-[#F0F6FC] dark:bg-[#0B1A2E] ${className}`}
      style={{
        backgroundImage:
          // Light-mode: soft ice-blue radial glows
          'radial-gradient(ellipse at 50% 35%, rgba(47,128,237,0.14), transparent 60%), ' +
          'radial-gradient(ellipse at 18% 82%, rgba(0,174,239,0.12), transparent 55%), ' +
          'radial-gradient(ellipse at 85% 18%, rgba(167,139,250,0.10), transparent 55%)',
      }}
      aria-hidden="true"
    >
      {/* === BACKGROUND LAYER === */}
      {/* Hex grid pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14] dark:opacity-[0.10]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hexgrid" width="56" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M28 0 L56 16 L56 32 L28 48 L0 32 L0 16 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-[#1769AA] dark:text-[#2F80ED]"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexgrid)" />
      </svg>

      {/* Floating bokeh particles (client-only to avoid hydration mismatch) */}
      {mounted && particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.cyan ? 'rgba(0,174,239,0.55)' : 'rgba(47,128,237,0.45)',
            boxShadow: `0 0 ${p.size * 4}px ${p.cyan ? 'rgba(0,174,239,0.5)' : 'rgba(47,128,237,0.4)'}`,
          }}
          animate={
            reduce
              ? {}
              : {
                  y: [0, -14, 0],
                  opacity: [0.3, 0.9, 0.3],
                  scale: [0.9, 1.15, 0.9],
                }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* === MAIN SCENE === */}
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-2 px-4 sm:px-8 py-10 sm:py-14 min-h-[420px] sm:min-h-[460px]">

        {/* === LEFT: DNA DOUBLE HELIX === */}
        <div className="hidden md:flex justify-center items-center h-full">
          <DNAHelix reduce={reduce} />
        </div>

        {/* === CENTER: VIAL + GLOWING PLATFORM === */}
        <div className="relative flex flex-col items-center justify-end h-full">
          {/* Vial */}
          <motion.div
            animate={reduce ? {} : { y: [0, -5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-20"
          >
            <MedicineVial />
          </motion.div>

          {/* Soft drop shadow under vial */}
          <div
            className="z-10 -mt-2 mb-1 rounded-[50%] blur-md"
            style={{
              width: 90,
              height: 14,
              background: 'radial-gradient(ellipse, rgba(23,105,170,0.45), transparent 70%)',
            }}
          />

          {/* Glowing platform with concentric pulse rings */}
          <PlatformPulse reduce={reduce} />
        </div>

        {/* === RIGHT: HUB-AND-SPOKE NETWORK === */}
        <div className="hidden md:flex justify-center items-center h-full">
          <NetworkGraph nodes={networkNodes} reduce={reduce} />
        </div>

        {/* Mobile fallback: show simplified network below */}
        <div className="md:hidden flex justify-center items-center pt-2">
          <NetworkGraph nodes={networkNodes} reduce={reduce} compact />
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 *  MEDICINE VIAL — glass bottle with blue liquid + chrome cap
 * ============================================================ */
function MedicineVial() {
  return (
    <svg width="86" height="150" viewBox="0 0 86 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Glass body gradient */}
        <linearGradient id="glass" x1="0" y1="0" x2="86" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.15" stopColor="#E8F4FB" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="0.85" stopColor="#DCE6F0" />
          <stop offset="1" stopColor="#B9CFE0" />
        </linearGradient>
        {/* Liquid gradient */}
        <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5BA8E8" />
          <stop offset="0.5" stopColor="#2F80ED" />
          <stop offset="1" stopColor="#1769AA" />
        </linearGradient>
        {/* Chrome cap gradient */}
        <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5F9FC" />
          <stop offset="0.3" stopColor="#DCE6F0" />
          <stop offset="0.5" stopColor="#A8C0D6" />
          <stop offset="0.7" stopColor="#DCE6F0" />
          <stop offset="1" stopColor="#7E96AC" />
        </linearGradient>
        {/* Highlight */}
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Cap (top) */}
      <rect x="26" y="6" width="34" height="20" rx="3" fill="url(#chrome)" stroke="#7E96AC" strokeWidth="0.5" />
      <rect x="26" y="6" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.5" />
      {/* Cap ridges */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line key={i} x1={28 + i * 4} y1="9" x2={28 + i * 4} y2="23" stroke="#7E96AC" strokeWidth="0.4" opacity="0.6" />
      ))}

      {/* Neck */}
      <rect x="34" y="24" width="18" height="8" fill="url(#glass)" stroke="#B9CFE0" strokeWidth="0.5" />

      {/* Body */}
      <rect x="22" y="32" width="42" height="100" rx="8" fill="url(#glass)" stroke="#B9CFE0" strokeWidth="0.8" />

      {/* Liquid fill (bottom ~60%) */}
      <rect x="24" y="68" width="38" height="62" rx="6" fill="url(#liquid)" />
      {/* Liquid surface ellipse */}
      <ellipse cx="43" cy="68" rx="19" ry="3" fill="#5BA8E8" opacity="0.9" />
      <ellipse cx="43" cy="68" rx="19" ry="3" fill="#FFFFFF" opacity="0.25" />

      {/* Bubbles in liquid */}
      <circle cx="33" cy="95" r="1.5" fill="#FFFFFF" opacity="0.7" />
      <circle cx="52" cy="110" r="1" fill="#FFFFFF" opacity="0.6" />
      <circle cx="40" cy="118" r="1.2" fill="#FFFFFF" opacity="0.5" />

      {/* Glass shine (left highlight) */}
      <rect x="26" y="36" width="6" height="92" rx="3" fill="url(#shine)" opacity="0.7" />
      {/* Glass shine (right thin) */}
      <rect x="58" y="40" width="2" height="80" rx="1" fill="#FFFFFF" opacity="0.5" />

      {/* Label */}
      <rect x="24" y="42" width="38" height="22" rx="2" fill="#FFFFFF" opacity="0.92" stroke="#1769AA" strokeWidth="0.6" />
      {/* Blue cross icon */}
      <g transform="translate(43, 48)">
        <circle r="5" fill="#2F80ED" />
        <rect x="-3.5" y="-0.8" width="7" height="1.6" rx="0.4" fill="#FFFFFF" />
        <rect x="-0.8" y="-3.5" width="1.6" height="7" rx="0.4" fill="#FFFFFF" />
      </g>
      {/* Label text */}
      <text x="43" y="61" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#102A43" fontFamily="ui-monospace, monospace" letterSpacing="0.5">
        GENUINE
      </text>

      {/* Barcode bottom of label */}
      <g transform="translate(26, 64)">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <rect key={i} x={i * 3} y="0" width={i % 3 === 0 ? 1.2 : 0.6} height="3" fill="#102A43" />
        ))}
      </g>

      {/* Subtle glow around the whole vial */}
      <rect x="18" y="28" width="50" height="108" rx="10" fill="none" stroke="#2F80ED" strokeWidth="0.4" opacity="0.3" />
    </svg>
  )
}

/* ============================================================
 *  GLOWING PLATFORM — concentric pulse rings + radar sweep
 * ============================================================ */
function PlatformPulse({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-0 pointer-events-none">
      <svg width="240" height="80" viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="platformGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#2F80ED" stopOpacity="0.45" />
            <stop offset="0.5" stopColor="#00AEEF" stopOpacity="0.18" />
            <stop offset="1" stopColor="#2F80ED" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base glow */}
        <ellipse cx="120" cy="40" rx="110" ry="30" fill="url(#platformGlow)" />

        {/* Static platform ellipse */}
        <ellipse cx="120" cy="40" rx="80" ry="20" fill="none" stroke="#2F80ED" strokeWidth="1" opacity="0.4" />
        <ellipse cx="120" cy="40" rx="60" ry="14" fill="none" stroke="#2F80ED" strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="120" cy="40" rx="40" ry="9" fill="none" stroke="#00AEEF" strokeWidth="0.8" opacity="0.6" />

        {/* Animated pulse rings (expanding outward) */}
        {[0, 1, 2].map((i) => (
          <motion.ellipse
            key={i}
            cx="120"
            cy="40"
            rx="40"
            ry="9"
            fill="none"
            stroke="#00AEEF"
            strokeWidth="1.2"
            animate={
              reduce
                ? {}
                : {
                    rx: [40, 110],
                    ry: [9, 28],
                    opacity: [0.7, 0],
                  }
            }
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.85,
            }}
          />
        ))}

        {/* Radar sweep arc */}
        <motion.g
          animate={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '120px 40px' }}
        >
          <path
            d="M 120 40 L 200 40 A 80 20 0 0 1 120 60 Z"
            fill="url(#platformGlow)"
            opacity="0.4"
          />
        </motion.g>
      </svg>
    </div>
  )
}

/* ============================================================
 *  DNA DOUBLE HELIX — two intertwining sine waves + rungs
 * ============================================================ */
function DNAHelix({ reduce }: { reduce: boolean | null }) {
  // Pre-compute helix points (memoized + rounded to avoid SSR/CSR
  // floating-point hydration mismatches like 0.8343...076 vs 0.8343...075)
  const height = 220
  const amplitude = 22
  const wavelength = 50
  const points = useMemo(() => {
    const round = (n: number) => Math.round(n * 1000) / 1000
    return Array.from({ length: 22 }, (_, i) => {
      const y = round((i / 21) * height)
      const phase = (y / wavelength) * Math.PI * 2
      return {
        y,
        x1: round(Math.sin(phase) * amplitude),
        x2: round(Math.sin(phase + Math.PI) * amplitude),
        depth1: round((Math.cos(phase) + 1) / 2),
        depth2: round((Math.cos(phase + Math.PI) + 1) / 2),
      }
    })
  }, [])

  return (
    <motion.svg
      width="70"
      height={height}
      viewBox={`-35 0 70 ${height}`}
      animate={reduce ? {} : { rotateY: [0, 360] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <defs>
        <radialGradient id="dnaNode">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#00AEEF" />
          <stop offset="1" stopColor="#1769AA" />
        </radialGradient>
      </defs>

      {/* Strand 1 (continuous path) */}
      <path
        d={`M ${points[0].x1} ${points[0].y} ` + points.map((p) => `L ${p.x1} ${p.y}`).join(' ')}
        fill="none"
        stroke="#2F80ED"
        strokeWidth="2"
        opacity="0.85"
      />
      {/* Strand 2 (continuous path) */}
      <path
        d={`M ${points[0].x2} ${points[0].y} ` + points.map((p) => `L ${p.x2} ${p.y}`).join(' ')}
        fill="none"
        stroke="#00AEEF"
        strokeWidth="2"
        opacity="0.85"
      />

      {/* Rungs + nodes */}
      {points.map((p, i) => (
        <g key={i}>
          {/* Rung */}
          <line
            x1={p.x1}
            y1={p.y}
            x2={p.x2}
            y2={p.y}
            stroke="#5BA8E8"
            strokeWidth="1.2"
            opacity={0.35 + Math.abs(p.depth1 - 0.5) * 0.4}
          />
          {/* Node 1 */}
          <circle cx={p.x1} cy={p.y} r={2 + p.depth1 * 1.6} fill="url(#dnaNode)" opacity={0.5 + p.depth1 * 0.5} />
          {/* Node 2 */}
          <circle cx={p.x2} cy={p.y} r={2 + p.depth2 * 1.6} fill="url(#dnaNode)" opacity={0.5 + p.depth2 * 0.5} />
        </g>
      ))}

      {/* Vertical center axis (faint) */}
      <line x1="0" y1="0" x2="0" y2={height} stroke="#1769AA" strokeWidth="0.4" opacity="0.15" strokeDasharray="2 3" />
    </motion.svg>
  )
}

/* ============================================================
 *  NETWORK GRAPH — hub-and-spoke with flowing data pulses
 * ============================================================ */
interface NetNode {
  icon: React.ComponentType<{ className?: string }>
  label: string
  angle: number
  color: string
}

function NetworkGraph({
  nodes,
  reduce,
  compact = false,
}: {
  nodes: NetNode[]
  reduce: boolean | null
  compact?: boolean
}) {
  const radius = compact ? 70 : 95
  const center = compact ? 90 : 120
  const size = center * 2

  const positioned = useMemo(() => {
    const round = (n: number) => Math.round(n * 1000) / 1000
    return nodes.map((n) => {
      const rad = (n.angle * Math.PI) / 180
      return {
        ...n,
        x: round(center + Math.cos(rad) * radius),
        y: round(center + Math.sin(rad) * radius),
      }
    })
  }, [nodes, radius, center])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hubGlow">
          <stop offset="0" stopColor="#2F80ED" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#1769AA" stopOpacity="0.3" />
          <stop offset="1" stopColor="#1769AA" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flowLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2F80ED" stopOpacity="0.7" />
          <stop offset="1" stopColor="#00AEEF" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Hub glow background */}
      <circle cx={center} cy={center} r={radius + 14} fill="url(#hubGlow)" opacity="0.35" />

      {/* Connecting lines (spokes) with animated dash flow */}
      {positioned.map((n, i) => (
        <g key={`line-${i}`}>
          <line
            x1={center}
            y1={center}
            x2={n.x}
            y2={n.y}
            stroke={n.color}
            strokeWidth="1.2"
            opacity="0.35"
          />
          {/* Flowing data pulse along the line */}
          <motion.line
            x1={center}
            y1={center}
            x2={n.x}
            y2={n.y}
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeDasharray="2 60"
            strokeLinecap="round"
            animate={reduce ? {} : { strokeDashoffset: [62, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.3,
            }}
            style={{ filter: `drop-shadow(0 0 3px ${n.color})` }}
          />
        </g>
      ))}

      {/* Central hub — hexagon with cube/block icon */}
      <g transform={`translate(${center}, ${center})`}>
        {/* Rotating outer hexagon ring */}
        <motion.polygon
          points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13"
          fill="none"
          stroke="#2F80ED"
          strokeWidth="1.2"
          opacity="0.6"
          animate={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '0 0' }}
        />
        {/* Solid hex */}
        <polygon
          points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10"
          fill="#1769AA"
          stroke="#2F80ED"
          strokeWidth="1"
        />
        <polygon
          points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10"
          fill="url(#hubGlow)"
          opacity="0.6"
        />
        {/* Central cube icon */}
        <g transform="translate(-8, -8)">
          <Box className="text-white" />
        </g>
      </g>

      {/* Outer nodes */}
      {positioned.map((n, i) => (
        <motion.g
          key={`node-${i}`}
          animate={reduce ? {} : { scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
        >
          <circle cx={n.x} cy={n.y} r="16" fill="#FFFFFF" stroke={n.color} strokeWidth="1.5" />
          <circle cx={n.x} cy={n.y} r="16" fill={n.color} opacity="0.12" />
          {/* Pulse ring */}
          <motion.circle
            cx={n.x}
            cy={n.y}
            r="16"
            fill="none"
            stroke={n.color}
            strokeWidth="1"
            animate={reduce ? {} : { r: [16, 24], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          />
          <foreignObject x={n.x - 8} y={n.y - 8} width="16" height="16">
            <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <n.icon className="h-3.5 w-3.5" style={{ color: n.color }} />
            </div>
          </foreignObject>
          {/* Label */}
          <text
            x={n.x}
            y={n.y + 26}
            textAnchor="middle"
            fontSize="6.5"
            fontWeight="600"
            fill="currentColor"
            className="text-[#102A43] dark:text-[#DCE6F0]"
            fontFamily="ui-monospace, monospace"
            letterSpacing="0.5"
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  )
}
